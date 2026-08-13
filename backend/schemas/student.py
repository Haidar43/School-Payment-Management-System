from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Schema for creating a new student
class StudentCreate(BaseModel):
    admission_number: str
    first_name: str
    last_name: str
    parent_id: int


# Schema for updating a student
class StudentUpdate(BaseModel):
    admission_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    parent_id: Optional[int] = None


# Schema for returning student data
class StudentResponse(BaseModel):
    id: int
    admission_number: str
    first_name: str
    last_name: str
    parent_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Schema for student summary (used in lists and dashboards)
class StudentSummary(BaseModel):
    id: int
    admission_number: str
    first_name: str
    last_name: str
    parent_name: Optional[str] = None  # Will be populated from parent relationship
    class Config:
        from_attributes = True