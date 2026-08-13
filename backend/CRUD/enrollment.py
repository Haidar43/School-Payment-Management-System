from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.models import Enrollment, Student, AcademicSession, Class, FeeStructure, Payment
from ..schemas.enrollment import EnrollmentCreate, EnrollmentUpdate
from typing import Optional, List


# ============ CREATE ============

def create_enrollment(db: Session, enrollment_data: EnrollmentCreate) -> Enrollment:
    """Create a new enrollment"""
    # Check if student is already enrolled in this session
    existing = get_enrollment_by_student_session(db, enrollment_data.student_id, enrollment_data.session_id)
    if existing:
        return None

    # Check if fee structure exists for this session+class
    fee = db.query(FeeStructure).filter(
        FeeStructure.session_id == enrollment_data.session_id,
        FeeStructure.class_id == enrollment_data.class_id
    ).first()

    if not fee:
        return None

    db_enrollment = Enrollment(
        student_id=enrollment_data.student_id,
        class_id=enrollment_data.class_id,
        session_id=enrollment_data.session_id,
        status=enrollment_data.status
    )

    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


# ============ READ ============

def get_enrollment_by_id(db: Session, enrollment_id: int) -> Optional[Enrollment]:
    """Get enrollment by ID"""
    return db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()


def get_enrollment_by_student_session(db: Session, student_id: int, session_id: int) -> Optional[Enrollment]:
    """Get enrollment by student and session"""
    return db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.session_id == session_id
    ).first()


def get_all_enrollments(db: Session, skip: int = 0, limit: int = 100) -> List[Enrollment]:
    """Get all enrollments with pagination"""
    return db.query(Enrollment).offset(skip).limit(limit).all()


def get_student_current_enrollment(db: Session, student_id: int) -> Optional[Enrollment]:
    """Get student's current enrollment"""
    current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
    if not current_session:
        return None

    return db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.session_id == current_session.id,
        Enrollment.status == "ACTIVE"
    ).first()


def get_class_enrollments(db: Session, class_id: int, session_id: Optional[int] = None) -> List[Enrollment]:
    """Get all enrollments for a class"""
    if not session_id:
        current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
        session_id = current_session.id if current_session else None

    if not session_id:
        return []

    return db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.session_id == session_id,
        Enrollment.status == "ACTIVE"
    ).all()


def get_enrollment_with_details(db: Session, enrollment_id: int) -> Optional[dict]:
    """Get enrollment with payment summary"""
    enrollment = get_enrollment_by_id(db, enrollment_id)
    if not enrollment:
        return None

    fee = db.query(FeeStructure).filter(
        FeeStructure.session_id == enrollment.session_id,
        FeeStructure.class_id == enrollment.class_id
    ).first()

    payments = db.query(Payment).filter(
        Payment.enrollment_id == enrollment.id
    ).order_by(Payment.payment_date.desc()).all()

    total_paid = sum(p.amount for p in payments) if payments else 0
    fee_amount = fee.amount if fee else 0
    balance = fee_amount - total_paid

    return {
        "enrollment": enrollment,
        "student": enrollment.student,
        "class": enrollment.class_,
        "session": enrollment.session,
        "fee": fee_amount,
        "total_paid": total_paid,
        "balance": balance,
        "status": "PAID" if balance <= 0 else "PARTIAL" if total_paid > 0 else "UNPAID",
        "payments": payments
    }


# ============ UPDATE ============

def update_enrollment(db: Session, enrollment_id: int, enrollment_data: EnrollmentUpdate) -> Optional[Enrollment]:
    """Update an enrollment"""
    db_enrollment = get_enrollment_by_id(db, enrollment_id)
    if not db_enrollment:
        return None

    if enrollment_data.class_id is not None:
        db_enrollment.class_id = enrollment_data.class_id
    if enrollment_data.session_id is not None:
        db_enrollment.session_id = enrollment_data.session_id
    if enrollment_data.status is not None:
        db_enrollment.status = enrollment_data.status

    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


# ============ DELETE ============

def delete_enrollment(db: Session, enrollment_id: int) -> Optional[Enrollment]:
    """Delete an enrollment"""
    db_enrollment = get_enrollment_by_id(db, enrollment_id)
    if not db_enrollment:
        return None

    # Check if enrollment has payments
    payments = db.query(Payment).filter(Payment.enrollment_id == enrollment_id).count()
    if payments > 0:
        return None  # Cannot delete enrollment with payments

    db.delete(db_enrollment)
    db.commit()
    return db_enrollment