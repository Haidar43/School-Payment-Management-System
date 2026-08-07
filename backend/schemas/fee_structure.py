from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Schema for creating a fee structure
class FeeStructureCreate(BaseModel):
    amount: float  # Fee amount (will be stored as integer in database)
    session_id: int
    class_id: int


# Schema for updating a fee structure
class FeeStructureUpdate(BaseModel):
    amount: Optional[float] = None
    session_id: Optional[int] = None
    class_id: Optional[int] = None


# Schema for returning fee structure data
class FeeStructureResponse(BaseModel):
    id: int
    amount: float
    session_id: int
    class_id: int
    created_at: Optional[datetime] = None

    # Optional: include related names for display
    session_name: Optional[str] = None
    class_name: Optional[str] = None

    class Config:
        from_attributes = True