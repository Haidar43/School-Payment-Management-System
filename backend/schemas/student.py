from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    admission_number: str
    first_name: str
    last_name: str
    parent_id: int
    class_id: Optional[int] = None


class StudentUpdate(BaseModel):
    admission_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    parent_id: Optional[int] = None


class StudentResponse(BaseModel):
    id: int
    admission_number: str
    first_name: str
    last_name: str
    parent_id: int
    dva: Optional[str] = None  # ADD THIS
    dva_customer_code: Optional[str] = None  # ADD THIS
    dva_account_name: Optional[str] = None  # ADD THIS
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentSummary(BaseModel):
    id: int
    admission_number: str
    first_name: str
    last_name: str
    parent_name: Optional[str] = None
    dva: Optional[str] = None  # ADD THIS

    class Config:
        from_attributes = True