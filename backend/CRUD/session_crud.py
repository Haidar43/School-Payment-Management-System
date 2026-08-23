from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.models import AcademicSession, Enrollment, FeeStructure, Payment
from ..schemas.session_schema import SessionCreate, SessionUpdate
from typing import Optional, List


# ============ CREATE ============

def create_session(db: Session, session_data: SessionCreate) -> Session:
    """Create a new academic session"""
    # Check if this is the first session
    existing_sessions = db.query(AcademicSession).count()
    is_current = True if existing_sessions == 0 else False

    db_session = AcademicSession(
        name=session_data.name,
        start_date=session_data.start_date,
        end_date=session_data.end_date,
        is_current=is_current
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


# ============ READ ============

def get_session_by_id(db: Session, session_id: int) -> Optional[Session]:
    """Get session by ID"""
    return db.query(AcademicSession).filter(AcademicSession.id == session_id).first()


def get_session_by_name(db: Session, name: str) -> Optional[Session]:
    """Get session by name"""
    return db.query(AcademicSession).filter(AcademicSession.name == name).first()


def get_all_sessions(db: Session, skip: int = 0, limit: int = 100) -> List[Session]:
    """Get all sessions with pagination"""
    return db.query(AcademicSession).order_by(AcademicSession.start_date.desc()).offset(skip).limit(limit).all()


def get_current_session(db: Session) -> Optional[Session]:
    """Get current active session"""
    return db.query(AcademicSession).filter(AcademicSession.is_current == True).first()


def get_session_stats(db: Session, session_id: int) -> Optional[dict]:
    """Get session statistics"""
    session = get_session_by_id(db, session_id)
    if not session:
        return None

    enrollments = db.query(Enrollment).filter(
        Enrollment.session_id == session_id,
        Enrollment.status == "ACTIVE"
    ).all()

    total_students = len(enrollments)
    total_collected = 0
    total_outstanding = 0
    paid_students = 0
    partial_students = 0
    unpaid_students = 0

    for enrollment in enrollments:
        fee = db.query(FeeStructure).filter(
            FeeStructure.session_id == session_id,
            FeeStructure.class_id == enrollment.class_id
        ).first()

        fee_amount = fee.amount if fee else 0

        total_paid = db.query(func.sum(Payment.amount)).filter(
            Payment.enrollment_id == enrollment.id,
            Payment.transaction_status == "success"
        ).scalar() or 0

        total_collected += total_paid
        balance = fee_amount - total_paid

        if balance > 0:
            total_outstanding += balance
            if total_paid > 0:
                partial_students += 1
            else:
                unpaid_students += 1
        else:
            paid_students += 1

    return {
        "session": session,
        "total_students": total_students,
        "total_collected": total_collected,
        "total_outstanding": total_outstanding,
        "paid_students": paid_students,
        "partial_students": partial_students,
        "unpaid_students": unpaid_students
    }


# ============ UPDATE ============

def update_session(db: Session, session_id: int, session_data: SessionUpdate) -> Optional[Session]:
    """Update a session"""
    db_session = get_session_by_id(db, session_id)
    if not db_session:
        return None

    if session_data.name is not None:
        db_session.name = session_data.name
    if session_data.start_date is not None:
        db_session.start_date = session_data.start_date
    if session_data.end_date is not None:
        db_session.end_date = session_data.end_date
    if session_data.is_current is not None:
        db_session.is_current = session_data.is_current

    db.commit()
    db.refresh(db_session)
    return db_session


def set_current_session(db: Session, session_id: int) -> Optional[Session]:
    """Set a session as current (deactivate all others)"""
    # Deactivate all sessions
    db.query(AcademicSession).filter(AcademicSession.is_current == True).update({"is_current": False})

    # Activate the selected session
    db_session = get_session_by_id(db, session_id)
    if not db_session:
        return None

    db_session.is_current = True
    db.commit()
    db.refresh(db_session)
    return db_session


# ============ DELETE ============

def delete_session(db: Session, session_id: int) -> Optional[Session]:
    """Delete a session"""
    db_session = get_session_by_id(db, session_id)
    if not db_session:
        return None

    # Check if session has enrollments
    enrollments = db.query(Enrollment).filter(Enrollment.session_id == session_id).count()
    if enrollments > 0:
        return None  # Cannot delete session with enrollments

    db.delete(db_session)
    db.commit()
    return db_session
