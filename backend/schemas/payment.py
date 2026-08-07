from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

# Payment method options
class PaymentMethod(str, Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    CARD = "CARD"
    USSD = "USSD"
    VIRTUAL_ACCOUNT = "VIRTUAL_ACCOUNT"

# Schema for creating a payment (used when admin records a payment)
class PaymentCreate(BaseModel):
    student_id: int  # We'll find the enrollment from this
    amount: float
    method: PaymentMethod
    remarks: Optional[str] = None
    # receipt_number will be auto-generated

# Schema for updating a payment
class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    method: Optional[PaymentMethod] = None
    remarks: Optional[str] = None

# Schema for returning payment data
class PaymentResponse(BaseModel):
    id: int
    enrollment_id: int
    amount: float
    receipt_number: str
    payment_date: datetime
    method: str
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema for payment with student/parent details (used in reports)
class PaymentWithDetails(PaymentResponse):
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    class_name: Optional[str] = None
    session_name: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None