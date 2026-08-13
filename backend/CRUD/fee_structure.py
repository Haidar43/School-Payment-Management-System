from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.models import FeeStructure, AcademicSession
from ..schemas.fee_structure import FeeStructureCreate, FeeStructureUpdate
from typing import Optional, List


# ============ CREATE ============

def create_fee_structure(db: Session, fee_data: FeeStructureCreate) -> FeeStructure:
    """Create a new fee structure"""
    # Check if fee already exists for this session+class
    existing = get_fee_structure_by_session_class(db, fee_data.session_id, fee_data.class_id)
    if existing:
        return None

    db_fee = FeeStructure(
        amount=int(fee_data.amount * 100),  # Convert to cents
        session_id=fee_data.session_id,
        class_id=fee_data.class_id
    )

    db.add(db_fee)
    db.commit()
    db.refresh(db_fee)
    return db_fee


# ============ READ ============

def get_fee_structure_by_id(db: Session, fee_id: int) -> Optional[FeeStructure]:
    """Get fee structure by ID"""
    return db.query(FeeStructure).filter(FeeStructure.id == fee_id).first()


def get_fee_structure_by_session_class(db: Session, session_id: int, class_id: int) -> Optional[FeeStructure]:
    """Get fee structure by session and class"""
    return db.query(FeeStructure).filter(
        FeeStructure.session_id == session_id,
        FeeStructure.class_id == class_id
    ).first()


def get_all_fee_structures(db: Session, skip: int = 0, limit: int = 100) -> List[FeeStructure]:
    """Get all fee structures with pagination"""
    return db.query(FeeStructure).offset(skip).limit(limit).all()


def get_fee_structures_by_session(db: Session, session_id: int) -> List[FeeStructure]:
    """Get all fee structures for a session"""
    return db.query(FeeStructure).filter(FeeStructure.session_id == session_id).all()


def get_current_session_fees(db: Session) -> List[FeeStructure]:
    """Get all fee structures for current session"""
    current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
    if not current_session:
        return []

    return get_fee_structures_by_session(db, current_session.id)


# ============ UPDATE ============

def update_fee_structure(db: Session, fee_id: int, fee_data: FeeStructureUpdate) -> Optional[FeeStructure]:
    """Update a fee structure"""
    db_fee = get_fee_structure_by_id(db, fee_id)
    if not db_fee:
        return None

    if fee_data.amount is not None:
        db_fee.amount = int(fee_data.amount * 100)
    if fee_data.session_id is not None:
        db_fee.session_id = fee_data.session_id
    if fee_data.class_id is not None:
        db_fee.class_id = fee_data.class_id

    db.commit()
    db.refresh(db_fee)
    return db_fee


# ============ DELETE ============

def delete_fee_structure(db: Session, fee_id: int) -> Optional[FeeStructure]:
    """Delete a fee structure"""
    db_fee = get_fee_structure_by_id(db, fee_id)
    if not db_fee:
        return None

    db.delete(db_fee)
    db.commit()
    return db_fee