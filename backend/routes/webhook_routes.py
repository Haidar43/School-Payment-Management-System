from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
import json
import os
import hmac
import hashlib

from ..database.session import get_db
from ..database.models import Student, Payment, Enrollment, AcademicSession
from ..crud.payment import create_payment as create_payment_crud
from ..schemas.payment import PaymentCreate
from ..utils.paystack import verify_webhook_signature

router = APIRouter(prefix="/webhook", tags=["Webhook"])


@router.post("/paystack")
async def paystack_webhook(
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Handle Paystack webhook events.
    Currently handles: charge.success (when payment is made to DVA)
    """
    # Get the raw payload
    payload = await request.body()

    # Get the signature from headers
    signature = request.headers.get("x-paystack-signature")

    # In test/development mode, we accept webhooks without signature verification
    app_env = os.getenv("APP_ENV", "development")

    if not signature:
        # In production, require signature
        if app_env == "production":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing signature header"
            )
        else:
            # In dev/test, log warning but continue
            print("⚠️ Webhook received without signature (allowed in dev mode)")

    # Verify signature (skip in test/dev mode)
    if signature:
        is_valid = verify_webhook_signature(payload, signature)
        if not is_valid and app_env == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
        elif not is_valid:
            print("⚠️ Webhook signature verification failed (allowed in dev mode)")

    # Parse the payload
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )

    # Get event type
    event = data.get("event")

    if not event:
        return {"status": "ignored", "message": "No event type provided"}

    print(f"📨 Webhook received: {event}")

    # Handle different event types
    if event == "charge.success":
        return await handle_charge_success(data, db, app_env)
    elif event == "charge.failed":
        return await handle_charge_failed(data, db)
    elif event == "customeridentification.failed":
        return {"status": "ignored", "message": "Customer identification failed"}
    elif event == "dedicatedaccount.assign.success":
        return {"status": "ignored", "message": "DVA assigned successfully"}
    else:
        return {"status": "ignored", "message": f"Unhandled event: {event}"}


async def handle_charge_success(data: dict, db: Session, app_env: str):
    """
    Handle successful charge event.
    This is triggered when a payment is made to a DVA.
    """
    event_data = data.get("data", {})

    # Get the account number from the event
    # Paystack sends the account number in 'dedicated_account' field
    account_number = event_data.get("dedicated_account", {}).get("account_number")

    if not account_number:
        # Try alternative field
        account_number = event_data.get("account_number")

    if not account_number:
        return {"status": "ignored", "message": "No account number found"}

    print(f"💰 Payment received for account: {account_number}")

    # Find the student by DVA
    student = db.query(Student).filter(Student.dva == account_number).first()

    if not student:
        # Check if it's a test DVA or log it
        print(f"⚠️ No student found for account: {account_number}")
        return {
            "status": "ignored",
            "message": f"No student found for account: {account_number}"
        }

    print(f"👤 Found student: {student.first_name} {student.last_name} (ID: {student.id})")

    # Get the amount (Paystack sends in kobo)
    amount_in_kobo = event_data.get("amount", 0)
    amount_in_ngn = amount_in_kobo / 100

    # Get the reference
    reference = event_data.get("reference", "N/A")

    # Get payment method from the channel
    channel = event_data.get("channel", "VIRTUAL_ACCOUNT")

    # Get current session
    current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
    if not current_session:
        return {
            "status": "error",
            "message": "No current session found"
        }

    print(f"📅 Current session: {current_session.name}")

    # Get the student's enrollment for current session
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student.id,
        Enrollment.session_id == current_session.id,
        Enrollment.status == "ACTIVE"
    ).first()

    if not enrollment:
        # Try to find any active enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student.id,
            Enrollment.status == "ACTIVE"
        ).first()

        if not enrollment:
            return {
                "status": "error",
                "message": f"No active enrollment found for student: {student.id}"
            }

    # Check if this payment was already recorded (idempotency)
    existing_payment = db.query(Payment).filter(
        Payment.receipt_number == reference
    ).first()

    if existing_payment:
        print(f"⚠️ Duplicate payment detected for reference: {reference}")
        return {
            "status": "ignored",
            "message": "Payment already recorded",
            "payment_id": existing_payment.id
        }

    # Create payment record
    try:
        payment_data = PaymentCreate(
            student_id=student.id,
            amount=amount_in_ngn,
            method="VIRTUAL_ACCOUNT",
            remarks=f"Auto-payment from DVA {account_number} - Reference: {reference}"
        )

        payment = create_payment_crud(db, payment_data)

        if payment:
            db.commit()
            print(f"✅ Payment recorded successfully: {payment.receipt_number}")
            return {
                "status": "success",
                "message": "Payment recorded successfully",
                "payment_id": payment.id,
                "receipt_number": payment.receipt_number,
                "student_id": student.id,
                "amount": amount_in_ngn
            }
        else:
            return {
                "status": "error",
                "message": "Failed to create payment record"
            }

    except Exception as e:
        db.rollback()
        print(f"❌ Error recording payment: {str(e)}")
        return {
            "status": "error",
            "message": f"Error recording payment: {str(e)}"
        }


async def handle_charge_failed(data: dict, db: Session):
    """
    Handle failed charge event.
    """
    event_data = data.get("data", {})
    account_number = event_data.get("dedicated_account", {}).get("account_number")

    if not account_number:
        account_number = event_data.get("account_number")

    if not account_number:
        return {"status": "ignored", "message": "No account number found"}

    reference = event_data.get("reference", "N/A")
    reason = event_data.get("gateway_response", "Unknown reason")

    print(f"❌ Payment failed for account {account_number}: {reason} (Ref: {reference})")

    return {
        "status": "recorded",
        "message": f"Failed charge recorded for account: {account_number}",
        "reference": reference,
        "reason": reason
    }