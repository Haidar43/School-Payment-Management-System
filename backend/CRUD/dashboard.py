from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from ..database.models import Student, Parent, Enrollment, Payment, FeeStructure, AcademicSession, Class
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta


# ============ ADMIN DASHBOARD ============

def get_admin_dashboard(db: Session) -> Dict[str, Any]:
    """
    Get all statistics for admin dashboard.
    OPTIMIZED: Uses joins and aggregations without N+1 query bottlenecks.
    """

    # 1. Get current session
    current_session = db.query(AcademicSession).filter(
        AcademicSession.is_current == True
    ).first()

    # Basic counts
    total_students = db.query(Student).count()
    total_parents = db.query(Parent).count()

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

    # 2. Get active enrollments with fee structure in ONE query
    enrollments = db.query(
        Enrollment,
        Student,
        Class,
        FeeStructure.amount.label('fee_amount')
    ).join(
        Student, Enrollment.student_id == Student.id
    ).join(
        Class, Enrollment.class_id == Class.id
    ).outerjoin(
        FeeStructure, and_(
            FeeStructure.session_id == Enrollment.session_id,
            FeeStructure.class_id == Enrollment.class_id
        )
    ).filter(
        Enrollment.session_id == current_session.id,
        Enrollment.status == "ACTIVE"
    ).all()

    if not enrollments:
        return result

    enrollment_ids = [e.Enrollment.id for e in enrollments]

    # 3. Get total SUCCESSFUL payments per enrollment
    payment_totals = db.query(
        Payment.enrollment_id,
        func.sum(Payment.amount).label('total_paid')
    ).filter(
        Payment.enrollment_id.in_(enrollment_ids),
        Payment.transaction_status == "success"  # CRITICAL: Filter out pending/failed payments
    ).group_by(
        Payment.enrollment_id
    ).all()

    # Create fast lookup map
    payment_lookup = {pt.enrollment_id: (pt.total_paid or 0) for pt in payment_totals}

    # 4. Fetch recent successful payments
    recent_payments_query = db.query(
        Payment,
        Student.first_name,
        Student.last_name,
        Class.name.label("class_name")
    ).join(
        Enrollment, Payment.enrollment_id == Enrollment.id
    ).join(
        Student, Enrollment.student_id == Student.id
    ).join(
        Class, Enrollment.class_id == Class.id
    ).filter(
        Enrollment.session_id == current_session.id,
        Payment.transaction_status == "success"
    ).order_by(
        Payment.payment_date.desc()
    ).limit(10).all()

    recent_payments = [
        {
            "id": p.Payment.id,
            "student_name": f"{p.first_name} {p.last_name}",
            "class_name": p.class_name,
            "amount": p.Payment.amount,
            "receipt_number": p.Payment.receipt_number,
            "method": p.Payment.method,
            "payment_date": p.Payment.payment_date.isoformat() if p.Payment.payment_date else None
        }
        for p in recent_payments_query
    ]

    total_collected = 0
    total_outstanding = 0
    paid_students = 0
    partial_students = 0
    unpaid_students = 0
    defaulters = 0

    class_summary_map = {}

    # 5. Process memory aggregation
    for enrollment_data in enrollments:
        enrollment = enrollment_data.Enrollment
        class_obj = enrollment_data.Class
        fee_amount = int(enrollment_data.fee_amount or 0)

        total_paid = int(payment_lookup.get(enrollment.id, 0))
        balance = fee_amount - total_paid
        total_collected += total_paid

        class_name = class_obj.name
        if class_name not in class_summary_map:
            class_summary_map[class_name] = {
                "class_id": class_obj.id,
                "class_name": class_name,
                "students": 0,
                "paid": 0,
                "partial": 0,
                "unpaid": 0,
                "outstanding": 0,
                "fee": fee_amount
            }

        class_summary_map[class_name]["students"] += 1

        if balance <= 0:
            paid_students += 1
            class_summary_map[class_name]["paid"] += 1
        elif total_paid > 0:
            partial_students += 1
            defaulters += 1
            total_outstanding += balance
            class_summary_map[class_name]["partial"] += 1
            class_summary_map[class_name]["outstanding"] += balance
        else:
            unpaid_students += 1
            defaulters += 1
            total_outstanding += balance
            class_summary_map[class_name]["unpaid"] += 1
            class_summary_map[class_name]["outstanding"] += balance

    # Populate final dictionary response
    result.update({
        "total_collected": total_collected,
        "total_outstanding": total_outstanding,
        "paid_students": paid_students,
        "partial_students": partial_students,
        "unpaid_students": unpaid_students,
        "defaulters": defaulters,
        "recent_payments": recent_payments,
        "class_summary": list(class_summary_map.values())
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
        Student.parent_id == parent_id,
        Payment.transaction_status == "success"
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
    """
    Get payment status for all classes (card view).
    OPTIMIZED: Single query using subquery aggregation to eliminate Cartesian product & N+1 issues.
    """

    # 1. Resolve current session using AcademicSession model
    if not session_id:
        current_session = db.query(AcademicSession).filter(
            AcademicSession.is_current == True
        ).first()
        session_id = current_session.id if current_session else None

    if not session_id:
        return []

    # 2. Subquery: Aggregate total SUCCESSFUL payments per enrollment
    payment_subquery = db.query(
        Payment.enrollment_id,
        func.coalesce(func.sum(Payment.amount), 0).label('total_paid')
    ).filter(
        Payment.transaction_status == "success"
    ).group_by(
        Payment.enrollment_id
    ).subquery()

    # 3. Main Query: Aggregate metrics per Class
    total_paid_col = func.coalesce(payment_subquery.c.total_paid, 0)
    fee_col = func.coalesce(FeeStructure.amount, 0)
    balance_col = fee_col - total_paid_col

    results = db.query(
        Class.id.label('class_id'),
        Class.name.label('class_name'),
        func.count(Enrollment.id).label('total_students'),
        func.sum(
            case((balance_col <= 0, 1), else_=0)
        ).label('paid_count'),
        func.sum(
            case(
                (
                    and_(
                        balance_col > 0,
                        total_paid_col > 0
                    ), 1
                ),
                else_=0
            )
        ).label('partial_count'),
        func.sum(
            case((total_paid_col == 0, 1), else_=0)
        ).label('unpaid_count'),
        func.sum(
            case((balance_col > 0, balance_col), else_=0)
        ).label('total_outstanding'),
        fee_col.label('fee')
    ).join(
        FeeStructure, FeeStructure.class_id == Class.id
    ).outerjoin(
        Enrollment, and_(
            Enrollment.class_id == Class.id,
            Enrollment.session_id == FeeStructure.session_id,
            Enrollment.status == "ACTIVE"
        )
    ).outerjoin(
        payment_subquery, payment_subquery.c.enrollment_id == Enrollment.id
    ).filter(
        FeeStructure.session_id == session_id
    ).group_by(
        Class.id, Class.name, FeeStructure.amount
    ).all()

    # 4. Format into clean dictionary array
    return [
        {
            "class_id": r.class_id,
            "class_name": r.class_name,
            "students": r.total_students or 0,
            "paid": int(r.paid_count or 0) if r.total_students else 0,
            "partial": int(r.partial_count or 0) if r.total_students else 0,
            "unpaid": int(r.unpaid_count or 0) if r.total_students else 0,
            "outstanding": int(r.total_outstanding or 0),
            "fee": int(r.fee or 0)
        }
        for r in results
    ]

# ============ CLASS PAYMENT MONITOR ============

def get_class_payment_monitor(
    db: Session,
    class_id: int,
    session_id: Optional[int] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get detailed class payment monitor with student list.
    OPTIMIZED: Uses outerjoin on verified payments and avoids model class bugs.
    """

    # 1. Resolve academic session
    if not session_id:
        current_session = db.query(AcademicSession).filter(
            AcademicSession.is_current == True
        ).first()
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

    session_obj = db.query(AcademicSession).filter(
        AcademicSession.id == session_id
    ).first()

    if not fee:
        return {
            "class_name": class_obj.name,
            "session_name": session_obj.name if session_obj else None,
            "fee": 0,
            "students": []
        }

    # 2. Get students and sum ONLY successful payments
    students_data = db.query(
        Student,
        Parent,
        Enrollment,
        func.coalesce(func.sum(Payment.amount), 0).label('total_paid')
    ).join(
        Enrollment, Enrollment.student_id == Student.id
    ).join(
        Parent, Student.parent_id == Parent.id
    ).outerjoin(
        Payment, and_(
            Payment.enrollment_id == Enrollment.id,
            Payment.transaction_status == "success"  # CRITICAL: Filter successful payments only
        )
    ).filter(
        Enrollment.class_id == class_id,
        Enrollment.session_id == session_id,
        Enrollment.status == "ACTIVE"
    ).group_by(
        Student.id, Parent.id, Enrollment.id
    ).all()

    students_list = []
    fee_amount = int(fee.amount)

    for row in students_data:
        student = row.Student
        parent = row.Parent
        total_paid = int(row.total_paid or 0)

        balance = fee_amount - total_paid
        status = "PAID" if balance <= 0 else "PARTIAL" if total_paid > 0 else "UNPAID"

        student_dict = {
            "admission_number": student.admission_number,
            "student_name": f"{student.first_name} {student.last_name}",
            "parent_name": f"{parent.first_name} {parent.last_name}",
            "parent_phone": parent.phone,
            "paid": total_paid,
            "balance": balance,
            "status": status,
            "enrollment_id": row.Enrollment.id,
            "student_id": student.id
        }

        # Apply filtering logic
        if status_filter and status_filter.upper() != "ALL":
            target_status = status_filter.upper()
            if target_status == "DEFAULTERS" and status in ["PARTIAL", "UNPAID"]:
                students_list.append(student_dict)
            elif target_status == status:
                students_list.append(student_dict)
        else:
            students_list.append(student_dict)

    return {
        "class_name": class_obj.name,
        "session_name": session_obj.name if session_obj else None,
        "fee": fee_amount,
        "students": students_list
    }