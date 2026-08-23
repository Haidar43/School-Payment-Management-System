from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class PaymentMethod(str, Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    CARD = "CARD"
    USSD = "USSD"
    VIRTUAL_ACCOUNT = "VIRTUAL_ACCOUNT"
    PAYSTACK = "PAYSTACK"

class PaymentCreate(BaseModel):
    student_id: int
    amount: float
    method: PaymentMethod
    remarks: Optional[str] = None

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    method: Optional[PaymentMethod] = None
    remarks: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    enrollment_id: int
    amount: float
    receipt_number: str
    payment_date: Optional[datetime] = None
    method: str
    remarks: Optional[str] = None
    transaction_reference: Optional[str] = None
    transaction_status: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaymentWithDetails(PaymentResponse):
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    class_name: Optional[str] = None
    session_name: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None