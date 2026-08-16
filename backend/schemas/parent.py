from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from typing import List
from .student import StudentSummary

class ParentCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str
    nin: Optional[str] = None  # ADD THIS

class ParentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    nin: Optional[str] = None  # ADD THIS

class ParentLogin(BaseModel):
    phone: str
    password: str

class ParentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    nin: Optional[str] = None  # ADD THIS
    nin_validated: bool = False  # ADD THIS
    paystack_customer_code: Optional[str] = None  # ADD THIS
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ParentWithDetails(ParentResponse):
    children_count: int = 0
    outstanding_balance: float = 0
    children: List['StudentSummary'] = []