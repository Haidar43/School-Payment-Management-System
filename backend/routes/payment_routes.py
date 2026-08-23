import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
import os

from ..database.session import get_db
from ..database.models import Student, Parent, Enrollment, FeeStructure, Payment, AcademicSession
from ..crud.payment import create_payment
from ..schemas.payment import PaymentCreate
from ..utils.paystack import initialize_transaction, verify_transaction, generate_payment_reference
from ..utils.auth import get_current_parent, get_current_admin

router = APIRouter(prefix="/api/payments", tags=["Payments"])

from pydantic import BaseModel

from pydantic import BaseModel, Field


# 1. Define the request schema
class PaymentInitializeRequest(BaseModel):
    student_id: int
    amount: float


# 2. Update the router endpoint to accept the payload
@router.post("/initialize")
def initialize_payment(
        payload: PaymentInitializeRequest,
        parent: Parent = Depends(get_current_parent),
        db: Session = Depends(get_db)
):
    student_id = payload.student_id
    amount = payload.amount

    # Check if student exists and belongs to this parent
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.parent_id == parent.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found or does not belong to you"
        )

    # Validate amount
    min_amount = int(os.getenv("MIN_PAYMENT_AMOUNT", "1000"))
    if amount < min_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum payment amount is ₦{min_amount:,}"
        )

    # Get student's current enrollment
    current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
    if not current_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No current session found"
        )

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.session_id == current_session.id,
        Enrollment.status == "ACTIVE"
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is not enrolled in current session"
        )

    # Get fee structure
    fee = db.query(FeeStructure).filter(
        FeeStructure.session_id == current_session.id,
        FeeStructure.class_id == enrollment.class_id
    ).first()

    if not fee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fee structure found for this class"
        )

    # Calculate outstanding balance
    total_paid = db.query(Payment).filter(
        Payment.enrollment_id == enrollment.id,
        Payment.transaction_status == "success"
    ).all()

    total_paid_amount = sum(p.amount for p in total_paid)
    outstanding = fee.amount - total_paid_amount

    # Validate amount doesn't exceed outstanding
    if amount > outstanding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount exceeds outstanding balance. Outstanding: ₦{outstanding:,.2f}"
        )

    # Generate payment reference
    reference = generate_payment_reference(student_id)

    # Initialize transaction with Paystack
    callback_url = os.getenv(
        "PAYMENT_CALLBACK_URL",
        f"http://localhost:3000/payment/verify"
    )

    result = initialize_transaction(
        amount=amount,
        email=parent.email or f"{parent.phone}@paystack.com",
        reference=reference,
        callback_url=callback_url,
        metadata={
            "student_id": student_id,
            "parent_id": parent.id,
            "enrollment_id": enrollment.id,
            "amount": amount
        }
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to initialize payment")
        )

    # Create pending payment record
    pending_payment = Payment(
        enrollment_id=enrollment.id,
        amount=int(amount * 100),  # Store in kobo
        receipt_number=f"PENDING-{reference}",
        payment_date=None,  # Will be set when confirmed
        method="PAYSTACK",
        remarks=f"Paystack payment - {reference}",
        transaction_reference=reference,
        transaction_status="pending"
    )

    db.add(pending_payment)
    db.commit()
    db.refresh(pending_payment)

    return {
        "success": True,
        "message": "Payment initialized successfully",
        "authorization_url": result["authorization_url"],
        "reference": reference,
        "payment_id": pending_payment.id,
        "amount": amount,
        "outstanding": outstanding
    }


@router.get("/verify")
def verify_payment(
        reference: str,
        db: Session = Depends(get_db)
):
    """
    Verify a payment after redirect from Paystack.
    This can be accessed by both parent and admin.
    """
    # Find the payment record
    payment = db.query(Payment).filter(
        Payment.transaction_reference == reference
    ).first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found"
        )

    # Verify with Paystack
    result = verify_transaction(reference)

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to verify payment")
        )

    # Update payment status
    payment.transaction_status = result.get("status", "failed")
    payment.paystack_response = result.get("data")

    if result.get("status") == "success":
        verified_amount = result.get("data", {}).get("amount")
        if verified_amount != payment.amount:
            payment.transaction_status = "failed"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verified amount does not match initialized payment"
            )

        # Payment successful - update receipt number
        from ..utils.receipt import generate_receipt_number
        if payment.receipt_number.startswith("PENDING-"):
            payment.receipt_number = generate_receipt_number(db)
        if payment.payment_date is None:
            payment.payment_date = datetime.utcnow()

        db.commit()
        db.refresh(payment)

        return {
            "success": True,
            "status": "success",
            "message": "Payment verified successfully",
            "payment_id": payment.id,
            "receipt_number": payment.receipt_number,
            "amount": payment.amount / 100,
            "student_id": payment.enrollment.student_id
        }
    elif result.get("status") == "failed":
        db.commit()
        return {
            "success": False,
            "status": "failed",
            "message": f"Payment failed: {result.get('failure_reason', 'Unknown error')}",
            "payment_id": payment.id
        }
    else:
        db.commit()
        return {
            "success": False,
            "status": result.get("status", "unknown"),
            "message": f"Payment status: {result.get('status', 'unknown')}",
            "payment_id": payment.id
        }


@router.post("/webhook")
async def payment_webhook(
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Webhook endpoint for Paystack to confirm payments.
    This is the primary way to confirm payments.
    """
    from ..utils.paystack import verify_webhook_signature

    # Get raw payload and signature
    payload = await request.body()
    signature = request.headers.get("x-paystack-signature")

    app_env = os.getenv("APP_ENV", "development")

    # Verify signature (skip in dev/test)
    if app_env == "production":
        if not signature or not verify_webhook_signature(payload, signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )

    event = data.get("event")

    if event == "charge.success":
        return handle_charge_success(data, db)
    elif event == "charge.failed":
        return handle_charge_failed(data, db)

    return {"status": "ignored", "message": f"Unhandled event: {event}"}


def handle_charge_success(data: dict, db: Session):
    """
    Handle successful charge webhook.
    """
    from ..crud.payment import create_payment
    from ..schemas.payment import PaymentCreate
    from ..utils.receipt import generate_receipt_number
    from datetime import datetime

    event_data = data.get("data", {})
    reference = event_data.get("reference")
    status = event_data.get("status")
    amount_in_kobo = event_data.get("amount", 0)
    metadata = event_data.get("metadata", {})
    student_id = metadata.get("student_id")

    if not reference:
        return {"status": "error", "message": "No payment reference in webhook payload"}

    if status != "success":
        return {"status": "ignored", "message": f"Charge status is {status or 'unknown'}"}

    if not student_id:
        return {"status": "error", "message": "No student_id in metadata"}

    # Find payment record
    payment = db.query(Payment).filter(
        Payment.transaction_reference == reference
    ).first()

    if not payment:
        # Create new payment if not found (webhook first)
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.status == "ACTIVE"
        ).first()

        if not enrollment:
            return {"status": "error", "message": "No active enrollment found"}

        payment = Payment(
            enrollment_id=enrollment.id,
            amount=amount_in_kobo,
            receipt_number=generate_receipt_number(db),
            payment_date=datetime.utcnow(),
            method="PAYSTACK",
            remarks=f"Paystack payment - {reference}",
            transaction_reference=reference,
            transaction_status="success",
            paystack_response=event_data
        )
        db.add(payment)
    else:
        if payment.amount != amount_in_kobo:
            return {"status": "error", "message": "Webhook amount does not match initialized payment"}

        # Update existing payment
        payment.transaction_status = "success"
        payment.payment_date = datetime.utcnow()
        payment.paystack_response = event_data

        if payment.receipt_number.startswith("PENDING-"):
            payment.receipt_number = generate_receipt_number(db)

    db.commit()
    db.refresh(payment)

    return {
        "status": "success",
        "message": "Payment recorded successfully",
        "payment_id": payment.id
    }


def handle_charge_failed(data: dict, db: Session):
    """
    Handle failed charge webhook.
    """
    event_data = data.get("data", {})
    reference = event_data.get("reference")

    payment = db.query(Payment).filter(
        Payment.transaction_reference == reference
    ).first()

    if payment:
        payment.transaction_status = "failed"
        payment.paystack_response = event_data
        db.commit()

    return {"status": "recorded", "message": "Failed charge recorded"}
