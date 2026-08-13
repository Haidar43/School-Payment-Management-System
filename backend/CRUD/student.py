from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from ..database.models import Student, Parent, Enrollment, Payment, FeeStructure, AcademicSession, Class
from ..schemas.student import StudentCreate, StudentUpdate
from typing import Optional, List


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


def get_student_with_payment_summary(db: Session, student_id: int, session_id: Optional[int] = None) -> Optional[dict]:
    """Get student with current enrollment and payment summary"""
    student = get_student_by_id(db, student_id)
    if not student:
        return None

    # If no session_id provided, get current session
    if not session_id:
        current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
        session_id = current_session.id if current_session else None

    result = {
        "student": student,
        "parent": student.parent,
        "current_enrollment": None,
        "payment_summary": {
            "fee": 0,
            "paid": 0,
            "balance": 0,
            "status": "NOT_ENROLLED"
        },
        "payment_history": []
    }

    if session_id:
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.session_id == session_id,
            Enrollment.status == "ACTIVE"
        ).first()

        if enrollment:
            fee = db.query(FeeStructure).filter(
                FeeStructure.session_id == session_id,
                FeeStructure.class_id == enrollment.class_id
            ).first()

            payments = db.query(Payment).filter(
                Payment.enrollment_id == enrollment.id
            ).order_by(Payment.payment_date.desc()).all()

            total_paid = sum(p.amount for p in payments) if payments else 0
            fee_amount = fee.amount if fee else 0
            balance = fee_amount - total_paid

            result["current_enrollment"] = {
                "enrollment": enrollment,
                "class": enrollment.class_,
                "session": enrollment.session,
                "fee": fee_amount
            }

            result["payment_summary"] = {
                "fee": fee_amount,
                "paid": total_paid,
                "balance": balance,
                "status": "PAID" if balance <= 0 else "PARTIAL" if total_paid > 0 else "UNPAID"
            }

            result["payment_history"] = payments

    return result


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


def get_all_students_with_details(db: Session, skip: int = 0, limit: int = 100, session_id: Optional[int] = None) -> \
List[dict]:
    """Get all students with payment summary for a session"""
    students = get_all_students(db, skip, limit)

    if not session_id:
        current_session = db.query(Session).filter(Session.is_current == True).first()
        session_id = current_session.id if current_session else None

    result = []
    for student in students:
        student_data = get_student_with_payment_summary(db, student.id, session_id)
        if student_data:
            result.append(student_data)
        else:
            result.append({
                "student": student,
                "parent": student.parent,
                "current_enrollment": None,
                "payment_summary": {
                    "fee": 0,
                    "paid": 0,
                    "balance": 0,
                    "status": "NOT_ENROLLED"
                },
                "payment_history": []
            })

    return result