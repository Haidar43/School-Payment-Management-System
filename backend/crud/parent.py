from sqlalchemy.orm import Session
from sqlalchemy import func
from database.models import Parent, Student, Enrollment, Payment, FeeStructure
from schemas.parent import ParentCreate, ParentUpdate
from utils.auth import hash_password, verify_password
from typing import Optional, List


# ============ CREATE ============

def create_parent(db: Session, parent_data: ParentCreate) -> Parent:
    """Create a new parent"""
    hashed_password = hash_password(parent_data.password)

    db_parent = Parent(
        first_name=parent_data.first_name,
        last_name=parent_data.last_name,
        phone=parent_data.phone,
        email=parent_data.email,
        password=hashed_password
    )

    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)
    return db_parent


# ============ READ ============

def get_parent_by_phone(db: Session, phone: str) -> Optional[Parent]:
    """Get parent by phone"""
    return db.query(Parent).filter(Parent.phone == phone).first()


def get_parent_by_email(db: Session, email: str) -> Optional[Parent]:
    """Get parent by email"""
    return db.query(Parent).filter(Parent.email == email).first()


def get_parent_by_id(db: Session, parent_id: int) -> Optional[Parent]:
    """Get parent by ID"""
    return db.query(Parent).filter(Parent.id == parent_id).first()


def get_all_parents(db: Session, skip: int = 0, limit: int = 100) -> List[Parent]:
    """Get all parents with pagination"""
    return db.query(Parent).offset(skip).limit(limit).all()


def get_parent_with_children(db: Session, parent_id: int) -> Optional[dict]:
    """Get parent with their children and payment summaries"""
    parent = get_parent_by_id(db, parent_id)
    if not parent:
        return None

    children = db.query(Student).filter(Student.parent_id == parent_id).all()

    result = {
        "parent": parent,
        "children": [],
        "children_count": len(children),
        "outstanding_balance": 0
    }

    # Get current session
    current_session = db.query(Session).filter(Session.is_current == True).first()

    for student in children:
        student_data = {
            "student": student,
            "class": None,
            "session": None,
            "fee": 0,
            "paid": 0,
            "balance": 0,
            "status": "NOT_ENROLLED"
        }

        if current_session:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == student.id,
                Enrollment.session_id == current_session.id,
                Enrollment.status == "ACTIVE"
            ).first()

            if enrollment:
                fee = db.query(FeeStructure).filter(
                    FeeStructure.session_id == current_session.id,
                    FeeStructure.class_id == enrollment.class_id
                ).first()

                total_paid = db.query(func.sum(Payment.amount)).filter(
                    Payment.enrollment_id == enrollment.id
                ).scalar() or 0

                fee_amount = fee.amount if fee else 0
                balance = fee_amount - total_paid

                student_data["class"] = enrollment.class_
                student_data["session"] = enrollment.session
                student_data["fee"] = fee_amount
                student_data["paid"] = total_paid
                student_data["balance"] = balance
                student_data["status"] = "PAID" if balance <= 0 else "PARTIAL" if total_paid > 0 else "UNPAID"

                if balance > 0:
                    result["outstanding_balance"] += balance

        result["children"].append(student_data)

    return result


# ============ UPDATE ============

def update_parent(db: Session, parent_id: int, parent_data: ParentUpdate) -> Optional[Parent]:
    """Update a parent"""
    db_parent = get_parent_by_id(db, parent_id)
    if not db_parent:
        return None

    if parent_data.first_name is not None:
        db_parent.first_name = parent_data.first_name
    if parent_data.last_name is not None:
        db_parent.last_name = parent_data.last_name
    if parent_data.phone is not None:
        db_parent.phone = parent_data.phone
    if parent_data.email is not None:
        db_parent.email = parent_data.email
    if parent_data.password is not None:
        db_parent.password = hash_password(parent_data.password)

    db.commit()
    db.refresh(db_parent)
    return db_parent


# ============ DELETE ============

def delete_parent(db: Session, parent_id: int) -> Optional[Parent]:
    """Delete a parent"""
    db_parent = get_parent_by_id(db, parent_id)
    if not db_parent:
        return None

    # Check if parent has students
    students = db.query(Student).filter(Student.parent_id == parent_id).count()
    if students > 0:
        return None  # Cannot delete parent with students

    db.delete(db_parent)
    db.commit()
    return db_parent


# ============ AUTHENTICATION ============

def authenticate_parent(db: Session, phone: str, password: str) -> Optional[Parent]:
    """Authenticate parent by phone and password"""
    parent = get_parent_by_phone(db, phone)
    if not parent:
        return None

    if not verify_password(password, parent.password):
        return None

    return parent