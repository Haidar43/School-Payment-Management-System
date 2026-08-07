from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database.session import get_db
from ..database.models import Admin
from ..schemas.admin import AdminCreate, AdminUpdate, AdminResponse
from schemas.parent import ParentCreate, ParentUpdate, ParentResponse
from schemas.student import StudentCreate, StudentUpdate, StudentResponse
from schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse, ClassWithStats
from schemas.session_schema import SessionCreate, SessionUpdate, SessionResponse, SessionWithStats
from schemas.fee_structure import FeeStructureCreate, FeeStructureUpdate, FeeStructureResponse
from schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse, EnrollmentWithPaymentSummary
from schemas.payment import PaymentCreate, PaymentResponse, PaymentWithDetails

from utils.auth import get_current_admin, hash_password
from crud.admin import *
from crud.parent import *
from crud.student import *
from crud.class_crud import *
from crud.session_crud import *
from crud.fee_structure import *
from crud.enrollment import *
from crud.payment import *
from crud.dashboard import *
from crud.reports import *

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============================================================
# DASHBOARD
# ============================================================

@router.get("/dashboard")
def get_dashboard(
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    return get_admin_dashboard(db)


# ============================================================
# ADMIN MANAGEMENT
# ============================================================

@router.get("/admins", response_model=List[AdminResponse])
def get_admins(
        skip: int = 0,
        limit: int = 100,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get all admins"""
    return get_all_admins(db, skip, limit)


@router.get("/admins/{admin_id}", response_model=AdminResponse)
def get_admin(
        admin_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get admin by ID"""
    admin = get_admin_by_id(db, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin


@router.post("/admins", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def create_admin(
        admin_data: AdminCreate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Create a new admin"""
    # Check if email exists
    if get_admin_by_email(db, admin_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    # Check if phone exists
    if get_admin_by_phone(db, admin_data.phone):
        raise HTTPException(status_code=400, detail="Phone already registered")
    return create_admin(db, admin_data)


@router.put("/admins/{admin_id}", response_model=AdminResponse)
def update_admin(
        admin_id: int,
        admin_data: AdminUpdate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Update an admin"""
    db_admin = update_admin(db, admin_id, admin_data)
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return db_admin


@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(
        admin_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Delete an admin"""
    if admin_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db_admin = delete_admin(db, admin_id)
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": "Admin deleted successfully"}


# ============================================================
# PARENT MANAGEMENT
# ============================================================

@router.get("/parents", response_model=List[ParentResponse])
def get_parents(
        skip: int = 0,
        limit: int = 100,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get all parents"""
    return get_all_parents(db, skip, limit)


@router.get("/parents/{parent_id}")
def get_parent(
        parent_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get parent with children and payment summary"""
    parent_data = get_parent_with_children(db, parent_id)
    if not parent_data:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent_data


@router.post("/parents", response_model=ParentResponse, status_code=status.HTTP_201_CREATED)
def create_parent(
        parent_data: ParentCreate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Create a new parent"""
    if get_parent_by_phone(db, parent_data.phone):
        raise HTTPException(status_code=400, detail="Phone already registered")
    if parent_data.email and get_parent_by_email(db, parent_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_parent(db, parent_data)


@router.put("/parents/{parent_id}", response_model=ParentResponse)
def update_parent(
        parent_id: int,
        parent_data: ParentUpdate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Update a parent"""
    db_parent = update_parent(db, parent_id, parent_data)
    if not db_parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return db_parent


@router.delete("/parents/{parent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parent(
        parent_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Delete a parent"""
    db_parent = delete_parent(db, parent_id)
    if not db_parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return {"message": "Parent deleted successfully"}


# ============================================================
# STUDENT MANAGEMENT
# ============================================================

@router.get("/students")
def get_students(
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get all students with optional search"""
    if search:
        return search_students(db, search)
    return get_all_students(db, skip, limit)


@router.get("/students/{student_id}")
def get_student(
        student_id: int,
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get student with payment summary"""
    student_data = get_student_with_payment_summary(db, student_id, session_id)
    if not student_data:
        raise HTTPException(status_code=404, detail="Student not found")
    return student_data


@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
        student_data: StudentCreate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Create a new student"""
    if get_student_by_admission(db, student_data.admission_number):
        raise HTTPException(status_code=400, detail="Admission number already exists")
    # Check if parent exists
    if not get_parent_by_id(db, student_data.parent_id):
        raise HTTPException(status_code=400, detail="Parent not found")
    return create_student(db, student_data)


@router.put("/students/{student_id}", response_model=StudentResponse)
def update_student(
        student_id: int,
        student_data: StudentUpdate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Update a student"""
    db_student = update_student(db, student_id, student_data)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
        student_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Delete a student"""
    db_student = delete_student(db, student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}


@router.post("/students/{student_id}/promote")
def promote_student(
        student_id: int,
        new_class_id: int,
        new_session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Promote a student to new class/session"""
    result = promote_student(db, student_id, new_class_id, new_session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Student not found")
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ============================================================
# CLASS MANAGEMENT
# ============================================================

@router.get("/classes")
def get_classes(
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get all classes with statistics"""
    return get_all_classes_with_stats(db, session_id)


@router.get("/classes/{class_id}")
def get_class(
        class_id: int,
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get class with statistics"""
    class_data = get_class_with_stats(db, class_id, session_id)
    if not class_data:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_data


@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
        class_data: ClassCreate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Create a new class"""
    if get_class_by_name(db, class_data.name):
        raise HTTPException(status_code=400, detail="Class name already exists")
    return create_class(db, class_data)


@router.put("/classes/{class_id}", response_model=ClassResponse)
def update_class(
        class_id: int,
        class_data: ClassUpdate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Update a class"""
    db_class = update_class(db, class_id, class_data)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    return db_class


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
        class_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Delete a class"""
    db_class = delete_class(db, class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class deleted successfully"}


# ============================================================
# SESSION MANAGEMENT
# ============================================================

@router.get("/sessions")
def get_sessions(
        skip: int = 0,
        limit: int = 100,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get all sessions"""
    return get_all_sessions(db, skip, limit)


@router.get("/sessions/current")
def get_current_session(
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get current active session"""
    session = get_current_session(db)
    if not session:
        raise HTTPException(status_code=404, detail="No current session set")
    return session


@router.get("/sessions/{session_id}/stats")
def get_session_stats(
        session_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get session statistics"""
    stats = get_session_stats(db, session_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Session not found")
    return stats


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
        session_data: SessionCreate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Create a new session"""
    if get_session_by_name(db, session_data.name):
        raise HTTPException(status_code=400, detail="Session name already exists")
    return create_session(db, session_data)


@router.put("/sessions/{session_id}", response_model=SessionResponse)
def update_session(
        session_id: int,
        session_data: SessionUpdate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Update a session"""
    db_session = update_session(db, session_id, session_data)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@router.post("/sessions/{session_id}/activate")
def activate_session(
        session_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Set a session as current"""
    db_session = set_current_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": f"Session '{db_session.name}' activated", "session": db_session}


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
        session_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Delete a session"""
    db_session = delete_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}


# ============================================================
# FEE STRUCTURE MANAGEMENT
# ============================================================

@router.get("/fees")
def get_fees(
        session_id: Optional[int] = None,
        class_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get fee structures with optional filters"""
    return get_fee_structures_filtered(db, session_id, class_id)


@router.get("/fees/current-session")
def get_current_session_fees(
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get all fee structures for current session"""
    return get_current_session_fees(db)


@router.get("/fees/{fee_id}")
def get_fee(
        fee_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get fee structure by ID"""
    fee = get_fee_structure_by_id(db, fee_id)
    if not fee:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    return fee


@router.post("/fees", response_model=FeeStructureResponse, status_code=status.HTTP_201_CREATED)
def create_fee(
        fee_data: FeeStructureCreate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Create a new fee structure"""
    # Check if session exists
    if not get_session_by_id(db, fee_data.session_id):
        raise HTTPException(status_code=400, detail="Session not found")
    # Check if class exists
    if not get_class_by_id(db, fee_data.class_id):
        raise HTTPException(status_code=400, detail="Class not found")

    fee = create_fee_structure(db, fee_data)
    if not fee:
        raise HTTPException(status_code=400, detail="Fee structure already exists for this session and class")
    return fee


@router.put("/fees/{fee_id}", response_model=FeeStructureResponse)
def update_fee(
        fee_id: int,
        fee_data: FeeStructureUpdate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Update a fee structure"""
    db_fee = update_fee_structure(db, fee_id, fee_data)
    if not db_fee:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    return db_fee


@router.delete("/fees/{fee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fee(
        fee_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Delete a fee structure"""
    db_fee = delete_fee_structure(db, fee_id)
    if not db_fee:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    return {"message": "Fee structure deleted successfully"}


# Helper function for filtered fees
def get_fee_structures_filtered(db: Session, session_id: Optional[int] = None, class_id: Optional[int] = None):
    from crud.fee_structure import get_fee_structures_by_session, get_all_fee_structures
    if session_id:
        return get_fee_structures_by_session(db, session_id)
    return get_all_fee_structures(db)


# ============================================================
# ENROLLMENT MANAGEMENT
# ============================================================

@router.get("/enrollments")
def get_enrollments(
        student_id: Optional[int] = None,
        session_id: Optional[int] = None,
        class_id: Optional[int] = None,
        status: Optional[str] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get enrollments with filters"""
    return get_enrollments_filtered(db, student_id, session_id, class_id, status)


@router.get("/enrollments/{enrollment_id}")
def get_enrollment(
        enrollment_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get enrollment with payment details"""
    enrollment = get_enrollment_with_details(db, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.get("/students/{student_id}/current-enrollment")
def get_student_current_enrollment(
        student_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get student's current enrollment"""
    enrollment = get_student_current_enrollment(db, student_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student not enrolled in current session")
    return get_enrollment_with_details(db, enrollment.id)


@router.get("/students/{student_id}/payment-summary")
def get_student_payment_summary(
        student_id: int,
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get student's payment summary"""
    return get_student_with_payment_summary(db, student_id, session_id)


@router.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def create_enrollment(
        enrollment_data: EnrollmentCreate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Create a new enrollment"""
    # Check if student exists
    if not get_student_by_id(db, enrollment_data.student_id):
        raise HTTPException(status_code=400, detail="Student not found")
    # Check if class exists
    if not get_class_by_id(db, enrollment_data.class_id):
        raise HTTPException(status_code=400, detail="Class not found")
    # Check if session exists
    if not get_session_by_id(db, enrollment_data.session_id):
        raise HTTPException(status_code=400, detail="Session not found")

    enrollment = create_enrollment(db, enrollment_data)
    if not enrollment:
        raise HTTPException(status_code=400, detail="Student already enrolled in this session or fee structure missing")
    return enrollment


@router.put("/enrollments/{enrollment_id}", response_model=EnrollmentResponse)
def update_enrollment(
        enrollment_id: int,
        enrollment_data: EnrollmentUpdate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Update an enrollment"""
    db_enrollment = update_enrollment(db, enrollment_id, enrollment_data)
    if not db_enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return db_enrollment


@router.delete("/enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(
        enrollment_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Delete an enrollment"""
    db_enrollment = delete_enrollment(db, enrollment_id)
    if not db_enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return {"message": "Enrollment deleted successfully"}


# Helper function for filtered enrollments
def get_enrollments_filtered(db: Session, student_id=None, session_id=None, class_id=None, status=None):
    from crud.enrollment import get_all_enrollments
    if student_id or session_id or class_id or status:
        return get_all_enrollments(db)  # For now, return all. Can be optimized.
    return get_all_enrollments(db)


# ============================================================
# PAYMENT MANAGEMENT
# ============================================================

@router.get("/payments")
def get_payments(
        session_id: Optional[int] = None,
        student_id: Optional[int] = None,
        parent_id: Optional[int] = None,
        receipt_number: Optional[str] = None,
        method: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get payments with filters"""
    return get_payments_filtered(
        db, session_id, student_id, parent_id,
        receipt_number, method, start_date, end_date,
        skip, limit
    )


@router.get("/payments/{payment_id}")
def get_payment(
        payment_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get payment with details"""
    payment = get_payment_with_details(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
        payment_data: PaymentCreate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Record a new payment"""
    # Check if student exists
    if not get_student_by_id(db, payment_data.student_id):
        raise HTTPException(status_code=400, detail="Student not found")

    payment = create_payment(db, payment_data)
    if not payment:
        raise HTTPException(status_code=400, detail="Student not enrolled in current session")
    return payment


@router.put("/payments/{payment_id}", response_model=PaymentResponse)
def update_payment(
        payment_id: int,
        payment_data: PaymentUpdate,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Update a payment"""
    db_payment = update_payment(db, payment_id, payment_data)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment


@router.delete("/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(
        payment_id: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Delete a payment"""
    db_payment = delete_payment(db, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted successfully"}


# ============================================================
# PAYMENT STATUS (SPECIAL UI PAGES)
# ============================================================

@router.get("/payment-status")
def get_payment_status(
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get payment status for all classes (card view)"""
    return get_all_classes_payment_status(db, session_id)


@router.get("/payment-status/{class_id}")
def get_class_payment_monitor(
        class_id: int,
        session_id: Optional[int] = None,
        status_filter: Optional[str] = Query(None, description="ALL, PAID, PARTIAL, UNPAID, DEFAULTERS"),
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get detailed class payment monitor with student list"""
    result = get_class_payment_monitor(db, class_id, session_id, status_filter)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ============================================================
# REPORTS
# ============================================================

@router.get("/reports/payment")
def get_payment_report(
        session_id: Optional[int] = None,
        class_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get comprehensive payment report"""
    result = get_payment_report(db, session_id, class_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/reports/outstanding")
def get_outstanding_report(
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get list of all students with outstanding balances"""
    return get_outstanding_report(db, session_id)


@router.get("/reports/daily-collection")
def get_daily_collection(
        date: date,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get collection report for a specific date"""
    return get_daily_collection_report(db, date)


@router.get("/reports/today")
def get_today_collection(
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get today's collections"""
    return get_today_payments(db)


@router.get("/reports/monthly")
def get_monthly_collection(
        year: int,
        month: int,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get monthly collection report"""
    return get_monthly_collection_report(db, year, month)


@router.get("/reports/this-month")
def get_this_month_collection(
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get this month's collections"""
    return get_this_month_payments(db)


@router.get("/reports/session-collections")
def get_session_collections(
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get collection summary for all sessions"""
    return get_session_collections_report(db)


@router.get("/reports/outstanding-by-class")
def get_outstanding_by_class(
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get outstanding balance grouped by class"""
    return get_outstanding_by_class(db, session_id)


@router.get("/reports/defaulters")
def get_defaulters(
        session_id: Optional[int] = None,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get list of all defaulters"""
    return get_defaulters_list(db, session_id)


# ============================================================
# RECENT PAYMENTS (for dashboard)
# ============================================================

@router.get("/recent-payments")
def get_recent_payments(
        limit: int = 10,
        current_admin: Admin = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """Get recent payments"""
    return get_recent_payments(db, limit)