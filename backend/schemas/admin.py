from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Schema for creating a new admin
class AdminCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    password: str  # Plain password, will be hashed before storing

# Schema for updating an admin (all fields optional)
class AdminUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None  # New password, will be hashed

# Schema for admin login
class AdminLogin(BaseModel):
    email: EmailStr
    password: str

# Schema for returning admin data (response)
class AdminResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows converting SQLAlchemy model to this schemas