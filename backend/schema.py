from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr


class AdminBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr


class AdminCreate(AdminBase):
    password: str


class AdminRead(AdminBase):
    id: int

    class Config:
        orm_mode = True


class ParentBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[EmailStr] = None


class ParentCreate(ParentBase):
    password: str


class ParentRead(ParentBase):
    id: int

    class Config:
        orm_mode = True


class TeacherBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[EmailStr] = None


class TeacherCreate(TeacherBase):
    password: str


class TeacherRead(TeacherBase):
    id: int

    class Config:
        orm_mode = True


class SessionBase(BaseModel):
    name: str
    is_current: Optional[bool] = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SessionRead(SessionBase):
    id: int

    class Config:
        orm_mode = True

class TermBase(BaseModel):
    name: str
    term_number: int
    is_current: Optional[bool] = False
    session_id: int


class TermCreate(TermBase):
    pass


class TermRead(TermBase):
    id: int

    class Config:
        from_attributes = True


class SchoolClassBase(BaseModel):
    level: str
    school_fee: int


class SchoolClassCreate(SchoolClassBase):
    pass


class SchoolClassRead(SchoolClassBase):
    id: int

    class Config:
        orm_mode = True


class StudentBase(BaseModel):
    first_name: str
    last_name: str
    class_id: int
    parent_id: int

class StudentRead(StudentBase):
    id: int

    class Config:
        orm_mode = True


class SubjectBase(BaseModel):
    name: str
    class_id: int


class SubjectCreate(SubjectBase):
    pass


class SubjectRead(SubjectBase):
    id: int

    class Config:
        orm_mode = True


class GradeBase(BaseModel):
    ca1: Optional[int] = None
    ca2: Optional[int] = None
    exam: Optional[int] = None
    total: Optional[int] = None
    remark: Optional[str] = None
    student_id: int
    session_id: int
    subject_id: int
    term_id: int


class GradeCreate(GradeBase):
    pass


class GradeRead(GradeBase):
    id: int

    class Config:
        orm_mode = True


class FeeBase(BaseModel):
    amount: int
    status: Optional[str] = "pending"
    student_id: int
    date: date
    session_id: int
    term_id: int
    class_id: int


class FeeCreate(FeeBase):
    pass


class FeeRead(FeeBase):
    id: int

    class Config:
        orm_mode = True
