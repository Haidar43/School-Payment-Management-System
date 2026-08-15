from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Schema for creating a new class
class ClassCreate(BaseModel):
    name: str
    fee: Optional[float] = None  # ADD THIS - optional fee amount

# Schema for updating a class
class ClassUpdate(BaseModel):
    name: Optional[str] = None

# Schema for returning class data
class ClassResponse(BaseModel):
    id: int
    name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema for class with additional stats
class ClassWithStats(ClassResponse):
    student_count: Optional[int] = 0
    paid_count: Optional[int] = 0
    partial_count: Optional[int] = 0
    unpaid_count: Optional[int] = 0
    total_outstanding: Optional[float] = 0
    current_fee: Optional[float] = 0