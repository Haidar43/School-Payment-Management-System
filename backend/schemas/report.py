from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# Filter parameters for reports
class ReportFilters(BaseModel):
    session_id: Optional[int] = None
    class_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Payment report schemas
class PaymentReport(BaseModel):
    session_name: str
    class_name: str
    student_count: int
    total_fee: float
    total_paid: float
    total_outstanding: float
    paid_students: int
    partial_students: int
    unpaid_students: int
    defaulter_students: int
    payment_details: List[dict]

# Daily collection report
class DailyCollectionReport(BaseModel):
    date: date
    total_amount: float
    payment_count: int
    method_breakdown: dict
    students_paid: List[dict]

# Outstanding students report
class OutstandingStudent(BaseModel):
    class_name: str
    student_name: str
    admission_number: str
    parent_name: str
    parent_phone: str
    fee: float
    paid: float
    balance: float