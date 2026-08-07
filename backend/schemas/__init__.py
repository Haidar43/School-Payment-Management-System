# This file makes the schemas folder a Python package
# You can import all schemas from here if needed

from .admin import AdminCreate, AdminUpdate, AdminResponse, AdminLogin
from .parent import ParentCreate, ParentUpdate, ParentResponse, ParentLogin
from .student import StudentCreate, StudentUpdate, StudentResponse
from .class_schema import ClassCreate, ClassUpdate, ClassResponse
from .session_schema import SessionCreate, SessionUpdate, SessionResponse
from .fee_structure import FeeStructureCreate, FeeStructureUpdate, FeeStructureResponse
from .enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse
from .payment import PaymentCreate, PaymentUpdate, PaymentResponse