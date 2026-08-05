from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.models import Student, Parent, Class, Fee, Grade
from ..database.base import get_db

def get_students(db: Session = Depends(get_db)):
    db_students = db.query(Student).all()
    return db_students

def read_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

def create_student(student, db: Session):
    student = Student(**student.dict())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

def get_student_parent(student_id: int, db: Session = Depends(get_db)):
    parent = db.query(Parent).filter(Parent.student_id == student_id).first()
    return parent

def get_student_class(student_id: int, db: Session = Depends(get_db)):
    student_class = db.query(Class).filter(Class.student_id == student_id).first()
    return student_class

def get_student_fees(student_id: int, db: Session = Depends(get_db)):
    student_fees = db.query(Fee).filter(Fee.id == student_id).all()
    return student_fees

def get_student_fee(student_id: int, session_id: int, db: Session = Depends(get_db)):
    student_fee = db.query(Fee).filter(Fee.id == student_id and Fee.session_id == session_id).first()
    return student_fee

def get_student_results(student_id: int, db: Session = Depends(get_db)):
    student_results = db.query(Grade).filter(Grade.student_id == student_id).all()
    return student_results