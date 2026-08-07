from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta

from ..database.session import get_db
from ..database.models import Admin, Parent
from ..schemas.admin import AdminLogin, AdminResponse
from ..schemas.parent import ParentLogin
from ..utils.auth import (
    create_access_token,
    create_refresh_token,
    verify_password,
    logout,
    security,
    get_current_admin,
    get_current_parent
)
from ..crud.admin import get_admin_by_email
from ..crud.parent import get_parent_by_phone

router = APIRouter(tags=["Public"])


# ============ ADMIN LOGIN ============

@router.post("/login/admin")
def admin_login(login_data: AdminLogin, db: Session = Depends(get_db)):
    """Admin login with email and password"""
    admin = get_admin_by_email(db, login_data.email)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(login_data.password, admin.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={
            "sub": admin.email,
            "role": "admin",
            "id": admin.id,
            "email": admin.email
        }
    )
    refresh_token = create_refresh_token(
        data={
            "sub": admin.email,
            "role": "admin",
            "id": admin.id
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": admin.id,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "email": admin.email,
            "phone": admin.phone,
            "role": "admin"
        }
    }


# ============ PARENT LOGIN ============

@router.post("/login/parent")
def parent_login(login_data: ParentLogin, db: Session = Depends(get_db)):
    """Parent login with phone and password"""
    parent = get_parent_by_phone(db, login_data.phone)
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(login_data.password, parent.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={
            "sub": parent.phone,
            "role": "parent",
            "id": parent.id,
            "phone": parent.phone
        }
    )
    refresh_token = create_refresh_token(
        data={
            "sub": parent.phone,
            "role": "parent",
            "id": parent.id
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": parent.id,
            "first_name": parent.first_name,
            "last_name": parent.last_name,
            "email": parent.email,
            "phone": parent.phone,
            "role": "parent"
        }
    }


# ============ REFRESH TOKEN ============

@router.post("/refresh")
def refresh_token(refresh_token: str):
    """Get new access token using refresh token"""
    from ..utils.auth import refresh_access_token
    return refresh_access_token(refresh_token)


# ============ LOGOUT ============

@router.post("/logout")
def logout_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user (blacklist token)"""
    return logout(credentials.credentials)