from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

# Enrollment status options
class EnrollmentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    WITHDRAWN = "WITHDRAWN"

# Schema for creating an enrollment
class EnrollmentCreate(BaseModel):
    student_id: int
    class_id: int
    session_id: int
    status: Optional[EnrollmentStatus] = EnrollmentStatus.ACTIVE

# Schema for updating an enrollment
class EnrollmentUpdate(BaseModel):
    class_id: Optional[int] = None
    session_id: Optional[int] = None
    status: Optional[EnrollmentStatus] = None

# Schema for returning enrollment data
class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    class_id: int
    session_id: int
    status: str
    enrolled_at: datetime
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema for enrollment with payment summary
class EnrollmentWithPaymentSummary(EnrollmentResponse):
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    session_name: Optional[str] = None
    fee_amount: Optional[float] = 0
    total_paid: Optional[float] = 0
    balance: Optional[float] = 0
    payment_status: Optional[str] = None  # PAID, PARTIAL, UNPAID