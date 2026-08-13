from sqlalchemy.orm import Session
from ..database.models import Payment
import random
import string
from datetime import datetime


def generate_receipt_number(db: Session) -> str:
    """
    Generate a unique receipt number.
    Format: RCP-YYYY-XXXXX
    Example: RCP-2026-00123
    """
    year = datetime.now().year

    while True:
        random_str = ''.join(random.choices(string.digits, k=5))
        receipt_number = f"RCP-{year}-{random_str}"

        # Check if this receipt number already exists
        existing = db.query(Payment).filter(
            Payment.receipt_number == receipt_number
        ).first()

        if not existing:
            return receipt_number
