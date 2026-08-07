from fastapi import Depends, HTTPException, status, security
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Any, Dict

from ..database.base import get_db
from .auth import get_current_admin, get_current_parent, decode_token
from ..crud.session_crud import session_crud
from ..database.models import Session as SessionModel
from ..database.models import Student

# ============ SESSION DEPENDENCIES ============

def get_current_session(db: Session = Depends(get_db)) -> SessionModel:
    """
    Get the current active session.
    """
    session = session_crud.get_current(db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No current session set. Please activate a session."
        )
    return session


def get_session_or_none(db: Session = Depends(get_db)) -> Optional[SessionModel]:
    """
    Get the current active session or None.
    """
    return session_crud.get_current(db)


# ============ AUTH DEPENDENCIES ============

# Admin auth dependency
AdminAuth = Depends(get_current_admin)

# Parent auth dependency
ParentAuth = Depends(get_current_parent)


# Optional auth (for endpoints that can work with or without auth)
async def get_current_user_optional(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Get current user if authenticated, otherwise return None.
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        payload = decode_token(token)
        return {
            "id": payload.get("sub"),
            "role": payload.get("role"),
            "email": payload.get("email"),
            "phone": payload.get("phone")
        }
    except HTTPException:
        return None


# ============ PERMISSION DEPENDENCIES ============

def get_enrollment_access_check(
        enrollment_id: int,
        current_user: Dict[str, Any] = Depends(get_current_user_optional),
        db: Session = Depends(get_db)
):
    """
    Check if user has access to an enrollment.
    Admins have full access, parents only access their children's enrollments.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    # Admin has full access
    if current_user["role"] == "admin":
        return True

    # Parent can only access their children's enrollments
    if current_user["role"] == "parent":
        from ..crud.enrollment import enrollment_crud
        enrollment = enrollment_crud.get(db, enrollment_id)
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enrollment not found"
            )

        # Check if the student belongs to this parent
        parent_id = db.query(Student).filter(
            Student.id == enrollment.student_id
        ).first().parent_id

        if parent_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions"
    )


def get_student_access_check(
        student_id: int,
        current_user: Dict[str, Any] = Depends(get_current_user_optional),
        db: Session = Depends(get_db)
):
    """
    Check if user has access to a student.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    # Admin has full access
    if current_user["role"] == "admin":
        return True

    # Parent can only access their children
    if current_user["role"] == "parent":
        from ..crud.student import student as student_crud
        student = student_crud.get(db, student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        if student.parent_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions"
    )