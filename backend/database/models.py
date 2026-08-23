from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, UniqueConstraint, JSON, Index
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
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================================================
# Parent
# =========================================================

class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    students = relationship("Student", back_populates="parent")

# =========================================================
# AcademicSession (RENAMED from "Session")
# =========================================================

class AcademicSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("Enrollment", back_populates="session")
    fee_structures = relationship("FeeStructure", back_populates="session")


# =========================================================
# Class
# =========================================================

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)

    parent = relationship("Parent", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student")
# =========================================================
# Fee Structure
# =========================================================

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("session_id", "class_id", name="uq_session_class_fee"),
        Index("idx_fee_session_class", "session_id", "class_id"),  # ADD
    )

    session = relationship("AcademicSession", back_populates="fee_structures")
    class_ = relationship("Class", back_populates="fee_structures")


# =========================================================
# Enrollment
# =========================================================

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    status = Column(String, nullable=False, default="ACTIVE")
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("student_id", "session_id", name="uq_student_session"),
        Index("idx_enrollment_class_session", "class_id", "session_id"),  # ADD
        Index("idx_enrollment_student_status", "student_id", "status"),  # ADD
    )

    student = relationship("Student", back_populates="enrollments")
    class_ = relationship("Class", back_populates="enrollments")
    session = relationship("AcademicSession", back_populates="enrollments")
    payments = relationship("Payment", back_populates="enrollment")


# =========================================================
# Payment
# =========================================================

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    receipt_number = Column(String, unique=True, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    method = Column(String, nullable=False)
    remarks = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # NEW FIELDS FOR PAYSTACK
    transaction_reference = Column(String, unique=True, nullable=True)
    transaction_status = Column(String, default="pending")  # pending, success, failed, refunded
    paystack_response = Column(JSON, nullable=True)  # Store full webhook payload

    enrollment = relationship("Enrollment", back_populates="payments")

    __table_args__ = (
        Index("idx_payment_enrollment", "enrollment_id"),  # ADD
        Index("idx_payment_transaction_status", "transaction_status"),  # ADD
        Index("idx_payment_date", "payment_date"),  # ADD
    )