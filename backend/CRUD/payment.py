from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..database.models import Payment, Enrollment, Student, AcademicSession, FeeStructure
from ..schemas.payment import PaymentCreate, PaymentUpdate
from ..utils.receipt import generate_receipt_number
from typing import Optional, List
from datetime import date


# ============ CREATE ============

def create_payment(db: Session, payment_data: PaymentCreate) -> Optional[Payment]:
    """Create a new payment"""
    # Get student's current enrollment
    current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
    if not current_session:
        return None

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == payment_data.student_id,
        Enrollment.session_id == current_session.id,
        Enrollment.status == "ACTIVE"
    ).first()

    if not enrollment:
        return None

    # Generate receipt number
    receipt_number = generate_receipt_number(db)

    db_payment = Payment(
        enrollment_id=enrollment.id,
        amount=int(payment_data.amount * 100),  # Convert to cents
        receipt_number=receipt_number,
        method=payment_data.method.value,
        remarks=payment_data.remarks
    )

    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


# ============ READ ============

def get_payment_by_id(db: Session, payment_id: int) -> Optional[Payment]:
    """Get payment by ID"""
    return db.query(Payment).filter(Payment.id == payment_id).first()


def get_payment_by_receipt(db: Session, receipt_number: str) -> Optional[Payment]:
    """Get payment by receipt number"""
    return db.query(Payment).filter(Payment.receipt_number == receipt_number).first()


def get_all_payments(db: Session, skip: int = 0, limit: int = 100) -> List[Payment]:
    """Get all payments with pagination"""
    return db.query(Payment).order_by(Payment.payment_date.desc()).offset(skip).limit(limit).all()


def get_payments_by_student(db: Session, student_id: int, session_id: Optional[int] = None) -> List[Payment]:
    """Get all payments for a student"""
    query = db.query(Payment).join(Enrollment).filter(Enrollment.student_id == student_id)

    if session_id:
        query = query.filter(Enrollment.session_id == session_id)

    return query.order_by(Payment.payment_date.desc()).all()


def get_payments_by_enrollment(db: Session, enrollment_id: int) -> List[Payment]:
    """Get all payments for an enrollment"""
    return db.query(Payment).filter(
        Payment.enrollment_id == enrollment_id
    ).order_by(Payment.payment_date.desc()).all()


def get_payments_filtered(
        db: Session,
        session_id: Optional[int] = None,
        student_id: Optional[int] = None,
        parent_id: Optional[int] = None,
        receipt_number: Optional[str] = None,
        method: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100
) -> List[Payment]:
    """Get payments with filters"""
    query = db.query(Payment).join(Enrollment).join(Student)

    if session_id:
        query = query.filter(Enrollment.session_id == session_id)
    if student_id:
        query = query.filter(Enrollment.student_id == student_id)
    if parent_id:
        query = query.filter(Student.parent_id == parent_id)
    if receipt_number:
        query = query.filter(Payment.receipt_number.ilike(f"%{receipt_number}%"))
    if method:
        query = query.filter(Payment.method == method)
    if start_date:
        query = query.filter(Payment.payment_date >= start_date)
    if end_date:
        query = query.filter(Payment.payment_date <= end_date)

    return query.order_by(Payment.payment_date.desc()).offset(skip).limit(limit).all()


def get_payment_with_details(db: Session, payment_id: int) -> Optional[dict]:
    """Get payment with student and parent details"""
    payment = get_payment_by_id(db, payment_id)
    if not payment:
        return None

    enrollment = payment.enrollment
    student = enrollment.student
    parent = student.parent

    return {
        "payment": payment,
        "student_name": f"{student.first_name} {student.last_name}",
        "admission_number": student.admission_number,
        "class_name": enrollment.class_.name,
        "session_name": enrollment.session.name,
        "parent_name": f"{parent.first_name} {parent.last_name}",
        "parent_phone": parent.phone
    }


# ============ UPDATE ============

def update_payment(db: Session, payment_id: int, payment_data: PaymentUpdate) -> Optional[Payment]:
    """Update a payment"""
    db_payment = get_payment_by_id(db, payment_id)
    if not db_payment:
        return None

    if payment_data.amount is not None:
        db_payment.amount = int(payment_data.amount * 100)
    if payment_data.method is not None:
        db_payment.method = payment_data.method.value
    if payment_data.remarks is not None:
        db_payment.remarks = payment_data.remarks

    db.commit()
    db.refresh(db_payment)
    return db_payment


# ============ DELETE ============

def delete_payment(db: Session, payment_id: int) -> Optional[Payment]:
    """Delete a payment"""
    db_payment = get_payment_by_id(db, payment_id)
    if not db_payment:
        return None

    db.delete(db_payment)
    db.commit()
    return db_payment