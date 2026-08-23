from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.models import Class, FeeStructure, Enrollment, Payment, AcademicSession
from ..schemas.class_schema import ClassCreate, ClassUpdate
from typing import Optional, List


# ============ CREATE ============

def create_class(db: Session, class_data: ClassCreate) -> Class:
    """Create a new class"""
    db_class = Class(name=class_data.name)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)

    # If fee is provided, create fee structure for current session
    if class_data.fee:
        from .session_crud import get_current_session
        from .fee_structure import create_fee_structure
        from ..schemas.fee_structure import FeeStructureCreate

        current_session = get_current_session(db)
        if current_session:
            # Check if fee structure already exists
            existing = db.query(FeeStructure).filter(
                FeeStructure.session_id == current_session.id,
                FeeStructure.class_id == db_class.id
            ).first()

            if not existing:
                fee_data = FeeStructureCreate(
                    session_id=current_session.id,
                    class_id=db_class.id,
                    amount=float(class_data.fee)  # Ensure it's float
                )
                create_fee_structure(db, fee_data)

    return db_class

# ============ READ ============

def get_class_by_id(db: Session, class_id: int) -> Optional[Class]:
    """Get class by ID"""
    return db.query(Class).filter(Class.id == class_id).first()


def get_class_by_name(db: Session, name: str) -> Optional[Class]:
    """Get class by name"""
    return db.query(Class).filter(Class.name == name).first()


def get_all_classes(db: Session, skip: int = 0, limit: int = 100) -> List[Class]:
    """Get all classes with pagination"""
    return db.query(Class).offset(skip).limit(limit).all()


def get_class_with_stats(db: Session, class_id: int, session_id: Optional[int] = None) -> Optional[dict]:
    """Get class with enrollment statistics"""
    class_obj = get_class_by_id(db, class_id)
    if not class_obj:
        return None

    # If no session_id provided, get current session
    if not session_id:
        current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
        session_id = current_session.id if current_session else None

    result = {
        "class": class_obj,
        "current_session_fee": None,
        "student_count": 0,
        "paid_count": 0,
        "partial_count": 0,
        "unpaid_count": 0,
        "outstanding_total": 0
    }

    if session_id:
        fee = db.query(FeeStructure).filter(
            FeeStructure.class_id == class_id,
            FeeStructure.session_id == session_id
        ).first()

        result["current_session_fee"] = fee.amount if fee else None

        enrollments = db.query(Enrollment).filter(
            Enrollment.class_id == class_id,
            Enrollment.session_id == session_id,
            Enrollment.status == "ACTIVE"
        ).all()

        result["student_count"] = len(enrollments)

        for enrollment in enrollments:
            total_paid = db.query(func.sum(Payment.amount)).filter(
                Payment.enrollment_id == enrollment.id,
                Payment.transaction_status == "success"
            ).scalar() or 0

            fee_amount = fee.amount if fee else 0
            balance = fee_amount - total_paid

            if balance <= 0:
                result["paid_count"] += 1
            elif total_paid > 0:
                result["partial_count"] += 1
            else:
                result["unpaid_count"] += 1

            if balance > 0:
                result["outstanding_total"] += balance

    return result


def get_all_classes_with_stats(db: Session, session_id: Optional[int] = None) -> List[dict]:
    """Get all classes with statistics"""
    classes = get_all_classes(db)
    result = []

    for class_obj in classes:
        stats = get_class_with_stats(db, class_obj.id, session_id)
        if stats:
            result.append(stats)

    return result


# ============ UPDATE ============

def update_class(db: Session, class_id: int, class_data: ClassUpdate) -> Optional[Class]:
    """Update a class"""
    db_class = get_class_by_id(db, class_id)
    if not db_class:
        return None

    if class_data.name is not None:
        db_class.name = class_data.name

    db.commit()
    db.refresh(db_class)
    return db_class


# ============ DELETE ============

def delete_class(db: Session, class_id: int) -> Optional[Class]:
    """Delete a class"""
    db_class = get_class_by_id(db, class_id)
    if not db_class:
        return None

    # Check if class has enrollments
    enrollments = db.query(Enrollment).filter(Enrollment.class_id == class_id).count()
    if enrollments > 0:
        return None  # Cannot delete class with enrollments

    db.delete(db_class)
    db.commit()
    return db_class
