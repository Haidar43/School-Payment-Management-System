from sqlalchemy.orm import Session
from sqlalchemy import func
from database.models import Admin
from schemas.admin import AdminCreate, AdminUpdate
from utils.auth import hash_password, verify_password
from typing import Optional, List


# ============ CREATE ============

def create_admin(db: Session, admin_data: AdminCreate) -> Admin:
    """Create a new admin"""
    # Hash password before storing
    hashed_password = hash_password(admin_data.password)

    db_admin = Admin(
        first_name=admin_data.first_name,
        last_name=admin_data.last_name,
        phone=admin_data.phone,
        email=admin_data.email,
        password=hashed_password
    )

    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


# ============ READ ============

def get_admin_by_email(db: Session, email: str) -> Optional[Admin]:
    """Get admin by email"""
    return db.query(Admin).filter(Admin.email == email).first()


def get_admin_by_phone(db: Session, phone: str) -> Optional[Admin]:
    """Get admin by phone"""
    return db.query(Admin).filter(Admin.phone == phone).first()


def get_admin_by_id(db: Session, admin_id: int) -> Optional[Admin]:
    """Get admin by ID"""
    return db.query(Admin).filter(Admin.id == admin_id).first()


def get_all_admins(db: Session, skip: int = 0, limit: int = 100) -> List[Admin]:
    """Get all admins with pagination"""
    return db.query(Admin).offset(skip).limit(limit).all()


# ============ UPDATE ============

def update_admin(db: Session, admin_id: int, admin_data: AdminUpdate) -> Optional[Admin]:
    """Update an admin"""
    db_admin = get_admin_by_id(db, admin_id)
    if not db_admin:
        return None

    # Update only fields that were provided
    if admin_data.first_name is not None:
        db_admin.first_name = admin_data.first_name
    if admin_data.last_name is not None:
        db_admin.last_name = admin_data.last_name
    if admin_data.phone is not None:
        db_admin.phone = admin_data.phone
    if admin_data.email is not None:
        db_admin.email = admin_data.email
    if admin_data.password is not None:
        db_admin.password = hash_password(admin_data.password)

    db.commit()
    db.refresh(db_admin)
    return db_admin


# ============ DELETE ============

def delete_admin(db: Session, admin_id: int) -> Optional[Admin]:
    """Delete an admin"""
    db_admin = get_admin_by_id(db, admin_id)
    if not db_admin:
        return None

    db.delete(db_admin)
    db.commit()
    return db_admin


# ============ AUTHENTICATION ============

def authenticate_admin(db: Session, email: str, password: str) -> Optional[Admin]:
    """Authenticate admin by email and password"""
    admin = get_admin_by_email(db, email)
    if not admin:
        return None

    if not verify_password(password, admin.password):
        return None

    return admin