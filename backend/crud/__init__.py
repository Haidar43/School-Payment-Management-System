from .reports import *  # NEW
from .dashboard import *  # NEW
from .admin import create_admin, get_admin_by_email, get_admin_by_id, get_all_admins, update_admin, delete_admin, authenticate_admin
from .parent import create_parent, get_parent_by_phone, get_parent_by_email, get_parent_by_id, get_all_parents, update_parent, delete_parent, authenticate_parent, get_parent_with_children
from .student import create_student, get_student_by_admission, get_student_by_id, get_all_students, update_student, delete_student, search_students, get_student_with_payment_summary
from .class_crud import create_class, get_class_by_id, get_class_by_name, get_all_classes, update_class, delete_class, get_class_with_stats, get_all_classes_with_stats
from .session_crud import create_session, get_session_by_id, get_session_by_name, get_all_sessions, get_current_session, update_session, delete_session, set_current_session, get_session_stats
from .fee_structure import create_fee_structure, get_fee_structure_by_id, get_fee_structure_by_session_class, get_all_fee_structures, update_fee_structure, delete_fee_structure, get_fee_structures_by_session, get_current_session_fees
from .enrollment import create_enrollment, get_enrollment_by_id, get_enrollment_by_student_session, get_all_enrollments, update_enrollment, delete_enrollment, get_student_current_enrollment, get_class_enrollments, get_enrollment_with_details
from .payment import create_payment, get_payment_by_id, get_payment_by_receipt, get_all_payments, update_payment, delete_payment, get_payments_by_student, get_payments_by_enrollment, get_payments_filtered