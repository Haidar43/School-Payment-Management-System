from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
import json
import os
import hmac
import hashlib

from ..database.session import get_db
from ..database.models import Payment, Student, Enrollment
from ..utils.paystack import verify_webhook_signature
from ..utils.receipt import generate_receipt_number

router = APIRouter(prefix="/webhook", tags=["Webhook"])


@router.post("/paystack")
async def paystack_webhook(
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Handle Paystack webhook events.
    Primarily charge.success for payment confirmation.
    """
    payload = await request.body()
    signature = request.headers.get("x-paystack-signature")
    app_env = os.getenv("APP_ENV", "development")

    # Skip signature verification in dev/test
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
    print(f"📨 Webhook received: {event}")

    if event == "charge.success":
        return handle_charge_success(data, db)
    elif event == "charge.failed":
        return handle_charge_failed(data, db)

    return {"status": "ignored", "message": f"Unhandled event: {event}"}


def handle_charge_success(data: dict, db: Session):
    """Handle successful charge."""
    from datetime import datetime

    event_data = data.get("data", {})
    reference = event_data.get("reference")
    amount_in_kobo = event_data.get("amount", 0)
    metadata = event_data.get("metadata", {})
    student_id = metadata.get("student_id")

    if not student_id:
        return {"status": "error", "message": "No student_id in metadata"}

    # Find existing payment
    payment = db.query(Payment).filter(
        Payment.transaction_reference == reference
    ).first()

    if payment:
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
            "message": "Payment updated",
            "payment_id": payment.id
        }

    # Create new payment if webhook arrived first
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
    db.commit()
    db.refresh(payment)

    return {
        "status": "success",
        "message": "Payment recorded",
        "payment_id": payment.id
    }


def handle_charge_failed(data: dict, db: Session):
    """Handle failed charge."""
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