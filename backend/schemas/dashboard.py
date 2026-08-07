from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Admin dashboard summary
class AdminDashboard(BaseModel):
    current_session: Optional[str] = None
    total_students: int = 0
    total_parents: int = 0
    total_collected: float = 0
    total_outstanding: float = 0
    paid_students: int = 0
    partial_students: int = 0
    unpaid_students: int = 0
    defaulters: int = 0
    recent_payments: List[dict] = []

# Parent dashboard summary
class ParentDashboard(BaseModel):
    welcome: str
    children_count: int = 0
    total_outstanding: float = 0
    children: List[dict] = []
    recent_payments: List[dict] = []

# Class payment status card (used in payment status page)
class ClassPaymentStatus(BaseModel):
    class_id: int
    class_name: str
    students: int = 0
    paid: int = 0
    partial: int = 0
    unpaid: int = 0
    outstanding: float = 0
    fee: float = 0