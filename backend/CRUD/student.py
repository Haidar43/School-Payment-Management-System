from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from ..database.models import Student, Parent, Enrollment, Payment, FeeStructure, AcademicSession, Class
from ..schemas.student import StudentCreate, StudentUpdate
from typing import Optional, List, Dict, Any
from .parent import get_parent_by_id


# ============ CREATE ============

def create_student(db: Session, student_data: StudentCreate) -> Student:
    """Create a new student"""
    db_student = Student(
        admission_number=student_data.admission_number,
        first_name=student_data.first_name,
        last_name=student_data.last_name,
        parent_id=student_data.parent_id
    )

    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    # If class_id is provided, auto-enroll student
    if student_data.class_id:
        from .session_crud import get_current_session
        from .enrollment import create_enrollment
        from ..schemas.enrollment import EnrollmentCreate

        current_session = get_current_session(db)
        if current_session:
            existing = db.query(Enrollment).filter(
                Enrollment.student_id == db_student.id,
                Enrollment.session_id == current_session.id
            ).first()

            if not existing:
                fee = db.query(FeeStructure).filter(
                    FeeStructure.session_id == current_session.id,
                    FeeStructure.class_id == student_data.class_id
                ).first()

                if fee:
                    enrollment_data = EnrollmentCreate(
                        student_id=db_student.id,
                        class_id=student_data.class_id,
                        session_id=current_session.id,
                        status="ACTIVE"
                    )
                    create_enrollment(db, enrollment_data)

    return db_student


# ============ READ ============

def get_student_by_admission(db: Session, admission_number: str) -> Optional[Student]:
    """Get student by admission number"""
    return db.query(Student).filter(Student.admission_number == admission_number).first()


def get_student_by_id(db: Session, student_id: int) -> Optional[Student]:
    """Get student by ID"""
    return db.query(Student).filter(Student.id == student_id).first()


def get_all_students(db: Session, skip: int = 0, limit: int = 100) -> List[Student]:
    """Get all students with pagination"""
    return db.query(Student).offset(skip).limit(limit).all()


def search_students(db: Session, query: str) -> List[Student]:
    """Search students by admission number or name"""
    return db.query(Student).filter(
        or_(
            Student.admission_number.ilike(f"%{query}%"),
            Student.first_name.ilike(f"%{query}%"),
            Student.last_name.ilike(f"%{query}%")
        )
    ).all()


def get_student_with_payment_summary(
    db: Session,
    student_id: int,
    session_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """
    Get a single student with enrollment, payment summary, and payment history in minimal queries.
    """

    # 1. Resolve session ID cleanly
    if not session_id:
        current_session = db.query(AcademicSession).filter(
            AcademicSession.is_current == True
        ).first()
        session_id = current_session.id if current_session else None

    # Build enrollment join conditions dynamically to prevent "IS NULL" SQL bugs
    enrollment_conditions = [
        Enrollment.student_id == Student.id,
        Enrollment.status == "ACTIVE"
    ]
    fee_conditions = []

    if session_id:
        enrollment_conditions.append(Enrollment.session_id == session_id)
        fee_conditions.append(FeeStructure.session_id == session_id)

    # 2. Get student with joins
    query = db.query(
        Student,
        Parent,
        Enrollment,
        Class,
        FeeStructure.amount.label('fee_amount')
    ).outerjoin(
        Parent, Student.parent_id == Parent.id
    ).outerjoin(
        Enrollment, and_(*enrollment_conditions)
    ).outerjoin(
        Class, Enrollment.class_id == Class.id
    )

    if session_id:
        fee_conditions.append(FeeStructure.class_id == Class.id)
        query = query.outerjoin(FeeStructure, and_(*fee_conditions))
    else:
        query = query.outerjoin(
            FeeStructure, FeeStructure.class_id == Class.id
        )

    student_data = query.filter(Student.id == student_id).first()

    if not student_data:
        return None

    student = student_data.Student
    parent = student_data.Parent
    enrollment = student_data.Enrollment
    class_obj = student_data.Class
    fee_amount = int(student_data.fee_amount or 0)

    # 3. Fetch ONLY successful payments for accurate balances and history
    payments = []
    total_paid = 0

    if enrollment:
        payments = db.query(Payment).filter(
            Payment.enrollment_id == enrollment.id,
            Payment.transaction_status == "success"  # Filter out pending/failed transactions
        ).order_by(
            Payment.payment_date.desc()
        ).all()

        total_paid = sum(p.amount for p in payments)

    balance = fee_amount - total_paid

    # Determine status
    if enrollment:
        if balance <= 0:
            status = "PAID"
        elif total_paid > 0:
            status = "PARTIAL"
        else:
            status = "UNPAID"
    else:
        status = "NOT_ENROLLED"

    return {
        "student": student,
        "parent": parent,
        "current_enrollment": {
            "enrollment": enrollment,
            "class": class_obj,
            "session": enrollment.session if enrollment else None,
            "fee": fee_amount
        } if enrollment else None,
        "payment_summary": {
            "fee": fee_amount,
            "paid": total_paid,
            "balance": balance,
            "status": status
        },
        "payment_history": payments
    }

# ============ UPDATE ============

def update_student(db: Session, student_id: int, student_data: StudentUpdate) -> Optional[Student]:
    """Update a student"""
    db_student = get_student_by_id(db, student_id)
    if not db_student:
        return None

    if student_data.admission_number is not None:
        db_student.admission_number = student_data.admission_number
    if student_data.first_name is not None:
        db_student.first_name = student_data.first_name
    if student_data.last_name is not None:
        db_student.last_name = student_data.last_name
    if student_data.parent_id is not None:
        db_student.parent_id = student_data.parent_id

    db.commit()
    db.refresh(db_student)
    return db_student


# ============ DELETE ============

def delete_student(db: Session, student_id: int) -> Optional[Student]:
    """Delete a student"""
    db_student = get_student_by_id(db, student_id)
    if not db_student:
        return None

    # Check if student has enrollments
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).count()
    if enrollments > 0:
        return None  # Cannot delete student with enrollments

    db.delete(db_student)
    db.commit()
    return db_student


def promote_student(
    db: Session,
    student_id: int,
    new_class_id: int,
    new_session_id: Optional[int] = None
) -> Optional[dict]:
    """Move a student to a class in the selected or current session."""
    student = get_student_by_id(db, student_id)
    if not student:
        return None

    target_class = db.query(Class).filter(Class.id == new_class_id).first()
    if not target_class:
        return {"error": "Class not found"}

    if new_session_id is None:
        target_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
        if not target_session:
            return {"error": "No current session set"}
    else:
        target_session = db.query(AcademicSession).filter(AcademicSession.id == new_session_id).first()
        if not target_session:
            return {"error": "Session not found"}

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.session_id == target_session.id
    ).first()

    if enrollment:
        enrollment.class_id = new_class_id
        enrollment.status = "ACTIVE"
    else:
        enrollment = Enrollment(
            student_id=student_id,
            class_id=new_class_id,
            session_id=target_session.id,
            status="ACTIVE"
        )
        db.add(enrollment)

    db.commit()
    db.refresh(enrollment)

    return {
        "message": "Student promoted successfully",
        "student": student,
        "enrollment": enrollment,
        "class": target_class,
        "session": target_session
    }


def get_all_students_with_details(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        session_id: Optional[int] = None,
        search: Optional[str] = None
) -> List[dict]:
    """
    OPTIMIZED: Get all students with parent, enrollment, and payment summary in minimal queries.
    Uses joins and aggregations to eliminate N+1 queries.
    """

    # If no session_id provided, get current session
    if not session_id:
        current_session = db.query(AcademicSession).filter(
            AcademicSession.is_current == True
        ).first()
        session_id = current_session.id if current_session else None

    # Build base query with joins
    query = db.query(
        Student,
        Parent,
        Enrollment,
        Class,
        FeeStructure.amount.label('fee_amount')
    ).outerjoin(
        Parent, Student.parent_id == Parent.id
    ).outerjoin(
        Enrollment, and_(
            Enrollment.student_id == Student.id,
            Enrollment.session_id == session_id if session_id else None,
            Enrollment.status == "ACTIVE"
        )
    ).outerjoin(
        Class, Enrollment.class_id == Class.id
    ).outerjoin(
        FeeStructure, and_(
            FeeStructure.session_id == session_id if session_id else None,
            FeeStructure.class_id == Class.id
        )
    )

    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Student.admission_number.ilike(search_term),
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term)
            )
        )

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    results = query.all()

    if not results:
        return []

    # Get all student IDs for payment aggregation
    student_ids = [r.Student.id for r in results]

    # OPTIMIZED: Get payment totals in ONE query for all students
    payment_totals = db.query(
        Enrollment.student_id,
        func.sum(Payment.amount).label('total_paid')
    ).join(
        Payment, Payment.enrollment_id == Enrollment.id
    ).filter(
        Enrollment.student_id.in_(student_ids),
        Enrollment.session_id == session_id if session_id else None,
        Enrollment.status == "ACTIVE"
    ).group_by(
        Enrollment.student_id
    ).all()

    # Create payment lookup dict
    payment_lookup = {pt.student_id: pt.total_paid for pt in payment_totals}

    # Build response
    result = []
    for row in results:
        student = row.Student
        parent = row.Parent
        enrollment = row.Enrollment
        class_obj = row.Class
        fee_amount = row.fee_amount or 0

        total_paid = payment_lookup.get(student.id, 0)
        balance = fee_amount - total_paid

        # Determine status
        if enrollment:
            if balance <= 0:
                status = "PAID"
            elif total_paid > 0:
                status = "PARTIAL"
            else:
                status = "UNPAID"
        else:
            status = "NOT_ENROLLED"

        result.append({
            "student": student,
            "parent": parent,
            "current_enrollment": {
                "enrollment": enrollment,
                "class": class_obj,
                "fee": fee_amount
            } if enrollment else None,
            "payment_summary": {
                "fee": fee_amount,
                "paid": total_paid,
                "balance": balance,
                "status": status
            },
            "payment_history": []  # We don't load payment history for list view
        })

    return result


def search_students_optimized(
        db: Session,
        query: str,
        session_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 50
) -> List[dict]:
    """
    OPTIMIZED: Search students with details in minimal queries.
    """
    return get_all_students_with_details(
        db,
        skip=skip,
        limit=limit,
        session_id=session_id,
        search=query
    )