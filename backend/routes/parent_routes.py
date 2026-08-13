from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database.session import get_db
from ..database.models import Parent, Student
from ..schemas.parent import ParentUpdate
from ..schemas.student import StudentResponse

from ..utils.auth import get_current_parent
from ..crud.parent import get_parent_by_id, update_parent, get_parent_with_children
from ..crud.student import get_student_by_id, get_student_with_payment_summary
from ..crud.payment import get_payments_by_student
from ..crud.dashboard import get_parent_dashboard

router = APIRouter(prefix="/api/parent", tags=["Parent"])


# ============================================================
# DASHBOARD
# ============================================================

@router.get("/dashboard")
def get_dashboard(
        current_parent: Parent = Depends(get_current_parent),
        db: Session = Depends(get_db)
):
    """Get parent dashboard with children summary"""
    return get_parent_dashboard(db, current_parent.id)


# ============================================================
# PROFILE
# ============================================================

@router.get("/profile")
def get_profile(
        current_parent: Parent = Depends(get_current_parent)
):
    """Get parent profile"""
    return {
        "id": current_parent.id,
        "first_name": current_parent.first_name,
        "last_name": current_parent.last_name,
        "phone": current_parent.phone,
        "email": current_parent.email
    }


@router.put("/profile")
def update_profile(
        parent_data: ParentUpdate,
        current_parent: Parent = Depends(get_current_parent),
        db: Session = Depends(get_db)
):
    """Update parent profile"""
    db_parent = update_parent(db, current_parent.id, parent_data)
    if not db_parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return db_parent


# ============================================================
# CHILDREN
# ============================================================

@router.get("/children")
def get_children(
        current_parent: Parent = Depends(get_current_parent),
        db: Session = Depends(get_db)
):
    """Get all children of the parent with payment summary"""
    parent_data = get_parent_with_children(db, current_parent.id)
    if not parent_data:
        return {"children": [], "children_count": 0}
    return {
        "children": parent_data["children"],
        "children_count": parent_data["children_count"],
        "total_outstanding": parent_data["outstanding_balance"]
    }


@router.get("/children/{student_id}")
def get_child_details(
        student_id: int,
        session_id: Optional[int] = None,
        current_parent: Parent = Depends(get_current_parent),
        db: Session = Depends(get_db)
):
    """Get child details with payment summary"""
    # Verify student belongs to this parent
    student = get_student_by_id(db, student_id)
    if not student or student.parent_id != current_parent.id:
        raise HTTPException(status_code=404, detail="Student not found")

    return get_student_with_payment_summary(db, student_id, session_id)


# ============================================================
# PAYMENT HISTORY
# ============================================================

@router.get("/payment-history")
def get_payment_history(
        skip: int = 0,
        limit: int = 50,
        current_parent: Parent = Depends(get_current_parent),
        db: Session = Depends(get_db)
):
    """Get all payments for parent's children"""
    payments = get_payments_filtered_by_parent(db, current_parent.id, skip, limit)

    result = []
    for p in payments:
        student = p.enrollment.student
        result.append({
            "receipt": p.receipt_number,
            "student": f"{student.first_name} {student.last_name}",
            "amount": p.amount,
            "method": p.method,
            "date": p.payment_date,
            "class": p.enrollment.class_.name,
            "session": p.enrollment.session.name
        })

    return {
        "payments": result,
        "total": len(result)
    }


# ============================================================
# CHILD PAYMENT HISTORY
# ============================================================

@router.get("/children/{student_id}/payments")
def get_child_payments(
        student_id: int,
        current_parent: Parent = Depends(get_current_parent),
        db: Session = Depends(get_db)
):
    """Get payment history for a specific child"""
    # Verify student belongs to this parent
    student = get_student_by_id(db, student_id)
    if not student or student.parent_id != current_parent.id:
        raise HTTPException(status_code=404, detail="Student not found")

    payments = get_payments_by_student(db, student_id)

    return {
        "student": {
            "id": student.id,
            "name": f"{student.first_name} {student.last_name}",
            "admission_number": student.admission_number
        },
        "payments": [
            {
                "receipt": p.receipt_number,
                "amount": p.amount,
                "method": p.method,
                "date": p.payment_date,
                "class": p.enrollment.class_.name,
                "session": p.enrollment.session.name,
                "remarks": p.remarks
            } for p in payments
        ]
    }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_payments_filtered_by_parent(db: Session, parent_id: int, skip: int = 0, limit: int = 50):
    """Get payments for a parent's children"""
    from ..crud.payment import get_payments_filtered
    return get_payments_filtered(db, parent_id=parent_id, skip=skip, limit=limit)