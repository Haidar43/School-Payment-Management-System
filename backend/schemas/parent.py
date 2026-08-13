from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Schema for creating a new parent
class ParentCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str  # Plain password, will be hashed

# Schema for updating a parent
class ParentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

# Schema for parent login (uses phone number instead of email)
class ParentLogin(BaseModel):
    phone: str
    password: str

# Schema for returning parent data
class ParentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    children_count: int
    outstanding_balance: float

    class Config:
        from_attributes = True