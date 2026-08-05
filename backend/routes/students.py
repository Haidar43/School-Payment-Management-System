from typing import List
from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session
from ..database.base import get_db
from ..schema import StudentBase, StudentRead, ParentRead, FeeRead, GradeRead
from ..CRUD.students import get_students, read_student, get_student_parent, get_student_fees, get_student_fee, get_student_results
router = APIRouter(
    prefix="/student",
    tags=["Students"]
)

@router.get("/", response_model=List[StudentRead])
async def get_all(db: Session = Depends(get_db)):
    return get_students(db=db)

@router.get("/{id}", response_model=StudentRead)
async def get_student(id: int, db: Session = Depends(get_db)):
    return read_student(student_id=id, db=db)

@router.post("/", response_model=List[StudentRead])
async def create_student(student: StudentBase, db: Session = Depends(get_db)):
    return create_student(student=student, db=db)

@router.get("/parent/{id}", response_model=ParentRead)
async def get_parent(id: int, db: Session = Depends(get_db)):
    return get_student_parent(student_id=id, db=db)

@router.get("/fee/{id}", response_model=List[FeeRead])
async def get_fee(id: int, db: Session = Depends(get_db)):
    return get_student_fees(student_id=id, db=db)

@router.get("/fee/{id}", response_model=FeeRead)
async def get_fee(id: int, db: Session = Depends(get_db)):
    return get_student_fee(student_id=id, db=db)

@router.get("/result/{id}", response_model=List[GradeRead])
async def get_result(id: int, db: Session = Depends(get_db)):
    get_student_results(student_id=id, db=db)
