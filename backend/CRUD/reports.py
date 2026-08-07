from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..database.models import Session, Class, Enrollment, Student, Payment, FeeStructure
from typing import Optional, List, Dict
from datetime import date, datetime, timedelta


# ============ PAYMENT REPORT ============

def get_payment_report(
        db: Session,
        session_id: Optional[int] = None,
        class_id: Optional[int] = None
) -> Dict:
    """Get comprehensive payment report"""

    if not session_id:
        current_session = db.query(Session).filter(Session.is_current == True).first()
        session_id = current_session.id if current_session else None

    if not session_id:
        return {"error": "No session selected"}

    query = db.query(Enrollment).filter(
        Enrollment.session_id == session_id,
        Enrollment.status == "ACTIVE"
    )

    if class_id:
        query = query.filter(Enrollment.class_id == class_id)

    enrollments = query.all()

    result = {
        "session_name": "",
        "class_name": "",
        "student_count": len(enrollments),
        "total_fee": 0,
        "total_paid": 0,
        "total_outstanding": 0,
        "paid_students": 0,
        "partial_students": 0,
        "unpaid_students": 0,
        "defaulter_students": 0,
        "payment_details": []
    }

    for enrollment in enrollments:
        fee = db.query(FeeStructure).filter(
            FeeStructure.session_id == enrollment.session_id,
            FeeStructure.class_id == enrollment.class_id
        ).first()

        fee_amount = fee.amount if fee else 0

        total_paid = db.query(func.sum(Payment.amount)).filter(
            Payment.enrollment_id == enrollment.id
        ).scalar() or 0

        balance = fee_amount - total_paid
        status = "PAID" if balance <= 0 else "PARTIAL" if total_paid > 0 else "UNPAID"

        result["total_fee"] += fee_amount
        result["total_paid"] += total_paid
        result["total_outstanding"] += balance if balance > 0 else 0

        if status == "PAID":
            result["paid_students"] += 1
        elif status == "PARTIAL":
            result["partial_students"] += 1
            result["defaulter_students"] += 1
        else:
            result["unpaid_students"] += 1
            result["defaulter_students"] += 1

        result["payment_details"].append({
            "admission_number": enrollment.student.admission_number,
            "student": f"{enrollment.student.first_name} {enrollment.student.last_name}",
            "parent": f"{enrollment.student.parent.first_name} {enrollment.student.parent.last_name}",
            "class": enrollment.class_.name,
            "fee": fee_amount,
            "paid": total_paid,
            "balance": balance,
            "status": status
        })

    if enrollments:
        result["session_name"] = enrollments[0].session.name
        if class_id:
            result["class_name"] = enrollments[0].class_.name

    return result


# ============ OUTSTANDING STUDENTS REPORT ============

def get_outstanding_report(db: Session, session_id: Optional[int] = None) -> List[Dict]:
    """Get list of all students with outstanding balances"""

    if not session_id:
        current_session = db.query(Session).filter(Session.is_current == True).first()
        session_id = current_session.id if current_session else None

    if not session_id:
        return []

    enrollments = db.query(Enrollment).filter(
        Enrollment.session_id == session_id,
        Enrollment.status == "ACTIVE"
    ).all()

    outstanding_students = []

    for enrollment in enrollments:
        fee = db.query(FeeStructure).filter(
            FeeStructure.session_id == enrollment.session_id,
            FeeStructure.class_id == enrollment.class_id
        ).first()

        fee_amount = fee.amount if fee else 0
        total_paid = db.query(func.sum(Payment.amount)).filter(
            Payment.enrollment_id == enrollment.id
        ).scalar() or 0

        balance = fee_amount - total_paid

        if balance > 0:
            outstanding_students.append({
                "class_name": enrollment.class_.name,
                "student_name": f"{enrollment.student.first_name} {enrollment.student.last_name}",
                "admission_number": enrollment.student.admission_number,
                "parent_name": f"{enrollment.student.parent.first_name} {enrollment.student.parent.last_name}",
                "parent_phone": enrollment.student.parent.phone,
                "fee": fee_amount,
                "paid": total_paid,
                "balance": balance,
                "status": "PARTIAL" if total_paid > 0 else "UNPAID"
            })

    return outstanding_students


# ============ DAILY COLLECTION REPORT ============

def get_daily_collection_report(db: Session, target_date: date) -> Dict:
    """Get collection report for a specific date"""

    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())

    payments = db.query(Payment).filter(
        Payment.payment_date >= start_datetime,
        Payment.payment_date <= end_datetime
    ).all()

    total_amount = sum(p.amount for p in payments)

    method_breakdown = {}
    for payment in payments:
        method = payment.method
        method_breakdown[method] = method_breakdown.get(method, 0) + payment.amount

    students_paid = []
    for payment in payments:
        student = payment.enrollment.student
        students_paid.append({
            "student": f"{student.first_name} {student.last_name}",
            "admission": student.admission_number,
            "amount": payment.amount,
            "receipt": payment.receipt_number,
            "method": payment.method,
            "class": payment.enrollment.class_.name
        })

    return {
        "date": target_date,
        "total_amount": total_amount,
        "payment_count": len(payments),
        "method_breakdown": method_breakdown,
        "students_paid": students_paid
    }


# ============ MONTHLY COLLECTION REPORT ============

def get_monthly_collection_report(db: Session, year: int, month: int) -> Dict:
    """Get collection report for a specific month"""

    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)

    payments = db.query(Payment).filter(
        Payment.payment_date >= start_date,
        Payment.payment_date < end_date
    ).all()

    total_amount = sum(p.amount for p in payments)

    # Daily breakdown
    daily_breakdown = {}
    for payment in payments:
        day = payment.payment_date.day
        daily_breakdown[day] = daily_breakdown.get(day, 0) + payment.amount

    return {
        "year": year,
        "month": month,
        "total_amount": total_amount,
        "payment_count": len(payments),
        "daily_breakdown": daily_breakdown
    }


# ============ SESSION COLLECTIONS REPORT ============

def get_session_collections_report(db: Session) -> List[Dict]:
    """Get collection summary for all sessions"""

    sessions = db.query(Session).all()
    result = []

    for session in sessions:
        enrollments = db.query(Enrollment).filter(
            Enrollment.session_id == session.id,
            Enrollment.status == "ACTIVE"
        ).all()

        total_collected = 0
        student_count = len(enrollments)
        fully_paid = 0
        total_fee = 0

        for enrollment in enrollments:
            total_paid = db.query(func.sum(Payment.amount)).filter(
                Payment.enrollment_id == enrollment.id
            ).scalar() or 0

            total_collected += total_paid

            fee = db.query(FeeStructure).filter(
                FeeStructure.session_id == session.id,
                FeeStructure.class_id == enrollment.class_id
            ).first()

            if fee:
                total_fee += fee.amount
                if total_paid >= fee.amount:
                    fully_paid += 1

        result.append({
            "session_id": session.id,
            "session_name": session.name,
            "student_count": student_count,
            "total_fee": total_fee,
            "total_collected": total_collected,
            "fully_paid_students": fully_paid,
            "collection_rate": f"{(fully_paid / student_count * 100):.1f}%" if student_count > 0 else "0%",
            "is_current": session.is_current
        })

    return result


# ============ TODAY'S PAYMENTS ============

def get_today_payments(db: Session) -> Dict:
    """Get all payments made today"""
    today = date.today()
    return get_daily_collection_report(db, today)


# ============ THIS MONTH PAYMENTS ============

def get_this_month_payments(db: Session) -> Dict:
    """Get all payments made this month"""
    today = date.today()
    return get_monthly_collection_report(db, today.year, today.month)


# ============ OUTSTANDING BY CLASS ============

def get_outstanding_by_class(db: Session, session_id: Optional[int] = None) -> List[Dict]:
    """Get outstanding balance grouped by class"""

    if not session_id:
        current_session = db.query(Session).filter(Session.is_current == True).first()
        session_id = current_session.id if current_session else None

    if not session_id:
        return []

    classes = db.query(Class).all()
    result = []

    for class_obj in classes:
        enrollments = db.query(Enrollment).filter(
            Enrollment.class_id == class_obj.id,
            Enrollment.session_id == session_id,
            Enrollment.status == "ACTIVE"
        ).all()

        total_students = len(enrollments)
        total_outstanding = 0
        total_fee = 0
        total_paid = 0

        for enrollment in enrollments:
            fee = db.query(FeeStructure).filter(
                FeeStructure.session_id == session_id,
                FeeStructure.class_id == enrollment.class_id
            ).first()

            if not fee:
                continue

            fee_amount = fee.amount
            total_fee += fee_amount

            paid = db.query(func.sum(Payment.amount)).filter(
                Payment.enrollment_id == enrollment.id
            ).scalar() or 0

            total_paid += paid
            balance = fee_amount - paid
            if balance > 0:
                total_outstanding += balance

        result.append({
            "class_name": class_obj.name,
            "total_students": total_students,
            "total_fee": total_fee,
            "total_paid": total_paid,
            "total_outstanding": total_outstanding
        })

    return result


# ============ DEFAULTERS LIST ============

def get_defaulters_list(db: Session, session_id: Optional[int] = None) -> List[Dict]:
    """Get list of all defaulters (students with any outstanding balance)"""
    return get_outstanding_report(db, session_id)