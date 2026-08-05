from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from .session import Base


# =========================================================
# Admin
# =========================================================

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)

    password = Column(String, nullable=False)


# =========================================================
# Parent
# =========================================================

class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    password = Column(String, nullable=False)

    students = relationship("Student", back_populates="parent")


# =========================================================
# Session
# =========================================================

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, unique=True, nullable=False)

    start_date = Column(Date)
    end_date = Column(Date)

    is_current = Column(Boolean, default=False)

    enrollments = relationship("Enrollment", back_populates="session")
    fee_structures = relationship("FeeStructure", back_populates="session")


# =========================================================
# Class
# =========================================================

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, unique=True, nullable=False)

    enrollments = relationship("Enrollment", back_populates="class_")
    fee_structures = relationship("FeeStructure", back_populates="class_")


# =========================================================
# Student
# =========================================================

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    admission_number = Column(String, unique=True, nullable=False)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=False)

    parent = relationship("Parent", back_populates="students")

    enrollments = relationship("Enrollment", back_populates="student")


# =========================================================
# Fee Structure
# =========================================================

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "class_id",
            name="uq_session_class_fee",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    amount = Column(Integer, nullable=False)

    session_id = Column(
        Integer,
        ForeignKey("sessions.id"),
        nullable=False,
    )

    class_id = Column(
        Integer,
        ForeignKey("classes.id"),
        nullable=False,
    )

    session = relationship("Session", back_populates="fee_structures")
    class_ = relationship("Class", back_populates="fee_structures")


# =========================================================
# Enrollment
# =========================================================

class Enrollment(Base):
    __tablename__ = "enrollments"

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "session_id",
            name="uq_student_session",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False,
    )

    class_id = Column(
        Integer,
        ForeignKey("classes.id"),
        nullable=False,
    )

    session_id = Column(
        Integer,
        ForeignKey("sessions.id"),
        nullable=False,
    )

    status = Column(String, nullable=False, default="ACTIVE")

    enrolled_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="enrollments")
    class_ = relationship("Class", back_populates="enrollments")
    session = relationship("Session", back_populates="enrollments")

    payments = relationship("Payment", back_populates="enrollment")


# =========================================================
# Payment
# =========================================================

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    enrollment_id = Column(
        Integer,
        ForeignKey("enrollments.id"),
        nullable=False,
    )

    amount = Column(Integer, nullable=False)

    receipt_number = Column(
        String,
        unique=True,
        nullable=False,
    )

    payment_date = Column(
        DateTime,
        default=datetime.utcnow,
    )

    method = Column(String, nullable=False)

    enrollment = relationship(
        "Enrollment",
        back_populates="payments",
    )