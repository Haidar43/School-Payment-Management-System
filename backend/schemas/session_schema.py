from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Schema for creating a new academic session
class SessionCreate(BaseModel):
    name: str  # e.g., "2025-2026"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Schema for updating a session
class SessionUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None  # Can set or unset as current

# Schema for returning session data
class SessionResponse(BaseModel):
    id: int
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema for session with statistics
class SessionWithStats(SessionResponse):
    total_students: Optional[int] = 0
    total_collected: Optional[float] = 0
    total_outstanding: Optional[float] = 0
    paid_students: Optional[int] = 0
    partial_students: Optional[int] = 0
    unpaid_students: Optional[int] = 0