from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.models import Student, Parent, Enrollment, Payment, FeeStructure, AcademicSession, Class
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta


# ============ ADMIN DASHBOARD ============

def get_admin_dashboard(db: Session) -> Dict[str, Any]:
    """Get all statistics for admin dashboard"""

    # Get current session
    current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()

    # Basic counts
    total_students = db.query(Student).count()
    total_parents = db.query(Parent).count()

    # Default response
    result = {
        "current_session": current_session.name if current_session else None,
        "total_students": total_students,
        "total_parents": total_parents,
        "total_collected": 0,
        "total_outstanding": 0,
        "paid_students": 0,
        "partial_students": 0,
        "unpaid_students": 0,
        "defaulters": 0,
        "recent_payments": [],
        "class_summary": []
    }

    if not current_session:
        return result

    # Get enrollments for current session
    enrollments = db.query(Enrollment).filter(
        Enrollment.session_id == current_session.id,
        Enrollment.status == "ACTIVE"
    ).all()

    total_collected = 0
    total_outstanding = 0
    paid_students = 0
    partial_students = 0
    unpaid_students = 0
    defaulters = 0

    class_summary = {}

    for enrollment in enrollments:
        fee = db.query(FeeStructure).filter(
            FeeStructure.session_id == current_session.id,
            FeeStructure.class_id == enrollment.class_id
        ).first()

        fee_amount = fee.amount if fee else 0

        total_paid = db.query(func.sum(Payment.amount)).filter(
            Payment.enrollment_id == enrollment.id
        ).scalar() or 0

        balance = fee_amount - total_paid
        total_collected += total_paid

        # Track class summary
        class_name = enrollment.class_.name
        if class_name not in class_summary:
            class_summary[class_name] = {
                "class_id": enrollment.class_id,
                "class_name": class_name,
                "students": 0,
                "paid": 0,
                "partial": 0,
                "unpaid": 0,
                "outstanding": 0,
                "fee": fee_amount
            }

        class_summary[class_name]["students"] += 1

        if balance <= 0:
            paid_students += 1
            class_summary[class_name]["paid"] += 1
        elif total_paid > 0:
            partial_students += 1
            defaulters += 1
            total_outstanding += balance
            class_summary[class_name]["partial"] += 1
            class_summary[class_name]["outstanding"] += balance
        else:
            unpaid_students += 1
            defaulters += 1
            total_outstanding += balance
            class_summary[class_name]["unpaid"] += 1
            class_summary[class_name]["outstanding"] += balance

    # Get recent payments (last 10)
    recent_payments = db.query(Payment).order_by(
        Payment.payment_date.desc()
    ).limit(10).all()

    recent_payments_data = []
    for p in recent_payments:
        student = p.enrollment.student
        recent_payments_data.append({
            "receipt": p.receipt_number,
            "student": f"{student.first_name} {student.last_name}",
            "amount": p.amount,
            "date": p.payment_date,
            "method": p.method
        })

    result.update({
        "total_collected": total_collected,
        "total_outstanding": total_outstanding,
        "paid_students": paid_students,
        "partial_students": partial_students,
        "unpaid_students": unpaid_students,
        "defaulters": defaulters,
        "recent_payments": recent_payments_data,
        "class_summary": list(class_summary.values())
    })

    return result


# ============ PARENT DASHBOARD ============

def get_parent_dashboard(db: Session, parent_id: int) -> Dict[str, Any]:
    """Get dashboard for a parent"""
    from .parent import get_parent_with_children

    parent_data = get_parent_with_children(db, parent_id)
    if not parent_data:
        return {
            "welcome": "Welcome",
            "children_count": 0,
            "total_paid": 0,
            "total_outstanding": 0,
            "children": [],
            "recent_payments": []
        }

    # Get recent payments for this parent's children
    recent_payments = db.query(Payment).join(Enrollment).join(Student).filter(
        Student.parent_id == parent_id
    ).order_by(Payment.payment_date.desc()).limit(5).all()

    recent_payments_data = []
    for p in recent_payments:
        student = p.enrollment.student
        recent_payments_data.append({
            "receipt": p.receipt_number,
            "student": f"{student.first_name} {student.last_name}",
            "amount": p.amount,
            "date": p.payment_date,
            "method": p.method
        })

    return {
        "welcome": f"Welcome {parent_data['parent'].first_name}",
        "children_count": parent_data["children_count"],
        "total_outstanding": parent_data["outstanding_balance"],
        "children": parent_data["children"],
        "recent_payments": recent_payments_data
    }


# ============ GET ALL CLASSES PAYMENT STATUS ============

def get_all_classes_payment_status(db: Session, session_id: Optional[int] = None) -> List[Dict]:
    """Get payment status for all classes (card view)"""

    if not session_id:
        current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
        session_id = current_session.id if current_session else None

    if not session_id:
        return []

    classes = db.query(Class).all()
    result = []

    for class_obj in classes:
        fee = db.query(FeeStructure).filter(
            FeeStructure.class_id == class_obj.id,
            FeeStructure.session_id == session_id
        ).first()

        if not fee:
            continue

        enrollments = db.query(Enrollment).filter(
            Enrollment.class_id == class_obj.id,
            Enrollment.session_id == session_id,
            Enrollment.status == "ACTIVE"
        ).all()

        total_students = len(enrollments)
        paid = 0
        partial = 0
        unpaid = 0
        outstanding = 0

        for enrollment in enrollments:
            total_paid = db.query(func.sum(Payment.amount)).filter(
                Payment.enrollment_id == enrollment.id
            ).scalar() or 0

            balance = fee.amount - total_paid

            if balance <= 0:
                paid += 1
            elif total_paid > 0:
                partial += 1
                outstanding += balance
            else:
                unpaid += 1
                outstanding += balance

        result.append({
            "class_id": class_obj.id,
            "class_name": class_obj.name,
            "students": total_students,
            "paid": paid,
            "partial": partial,
            "unpaid": unpaid,
            "outstanding": outstanding,
            "fee": fee.amount
        })

    return result


# ============ CLASS PAYMENT MONITOR ============

def get_class_payment_monitor(
        db: Session,
        class_id: int,
        session_id: Optional[int] = None,
        status_filter: Optional[str] = None  # ALL, PAID, PARTIAL, UNPAID, DEFAULTERS
) -> Dict[str, Any]:
    """Get detailed class payment monitor with student list"""

    if not session_id:
        current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
        session_id = current_session.id if current_session else None

    if not session_id:
        return {"error": "No session selected"}

    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        return {"error": "Class not found"}

    fee = db.query(FeeStructure).filter(
        FeeStructure.class_id == class_id,
        FeeStructure.session_id == session_id
    ).first()

    if not fee:
        return {
            "class_name": class_obj.name,
            "session_name": db.query(AcademicSession).filter(AcademicSession.id == session_id).first().name,
            "fee": 0,
            "students": []
        }

    enrollments = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.session_id == session_id,
        Enrollment.status == "ACTIVE"
    ).all()

    students_data = []
    for enrollment in enrollments:
        total_paid = db.query(func.sum(Payment.amount)).filter(
            Payment.enrollment_id == enrollment.id
        ).scalar() or 0

        balance = fee.amount - total_paid
        status = "PAID" if balance <= 0 else "PARTIAL" if total_paid > 0 else "UNPAID"

        student_data = {
            "admission_number": enrollment.student.admission_number,
            "student_name": f"{enrollment.student.first_name} {enrollment.student.last_name}",
            "parent_name": f"{enrollment.student.parent.first_name} {enrollment.student.parent.last_name}",
            "parent_phone": enrollment.student.parent.phone,
            "paid": total_paid,
            "balance": balance,
            "status": status,
            "enrollment_id": enrollment.id,
            "student_id": enrollment.student_id
        }

        # Apply filter
        if status_filter and status_filter != "ALL":
            if status_filter == "DEFAULTERS" and status in ["PARTIAL", "UNPAID"]:
                students_data.append(student_data)
            elif status_filter == status:
                students_data.append(student_data)
        else:
            students_data.append(student_data)

    return {
        "class_name": class_obj.name,
        "session_name": db.query(AcademicSession).filter(AcademicSession.id == session_id).first().name,
        "fee": fee.amount,
        "students": students_data
    }


# ============ RECENT PAYMENTS ============

def get_recent_payments(db: Session, limit: int = 10) -> List[Dict]:
    """Get recent payments with details"""
    payments = db.query(Payment).order_by(
        Payment.payment_date.desc()
    ).limit(limit).all()

    result = []
    for p in payments:
        student = p.enrollment.student
        result.append({
            "receipt": p.receipt_number,
            "student": f"{student.first_name} {student.last_name}",
            "admission_number": student.admission_number,
            "amount": p.amount,
            "date": p.payment_date,
            "method": p.method,
            "class": p.enrollment.class_.name,
            "session": p.enrollment.session.name
        })

    return result