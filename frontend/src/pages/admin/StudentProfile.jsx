import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent, deleteStudent, promoteStudent } from '../../api/admin';
import { generateStudentDVA } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  CreditCard,
  Wallet,
  Edit,
  Trash2,
  TrendingUp,
  Printer,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import PromoteForm from '../../components/students/PromoteForm';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await getStudent(id);
      setStudent(response.data);
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student details');
      navigate('/admin/students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(id);
      toast.success('Student deleted successfully');
      navigate('/admin/students');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
    setDeleteConfirm(null);
  };

  const handlePromoteSuccess = () => {
    setShowPromoteModal(false);
    fetchStudent();
    toast.success('Student promoted successfully');
  };

  const handlePrintPaymentHistory = () => {
    const payments = student.payment_history || [];
    if (payments.length === 0) {
      toast.error('No payment history to print');
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Payment History - ${student.student?.first_name} ${student.student?.last_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            h2 { font-size: 16px; font-weight: normal; color: #666; margin-top: 0; }
            .student-info { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0; }
            .student-info p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #333; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .amount { text-align: right; }
            .total { margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${student.student?.first_name} ${student.student?.last_name}</h1>
          <h2>Payment History</h2>
          <div class="student-info">
            <p><strong>Admission:</strong> ${student.student?.admission_number}</p>
            <p><strong>Class:</strong> ${student.current_enrollment?.class?.name || 'Not enrolled'}</p>
            <p><strong>Session:</strong> ${student.current_enrollment?.session?.name || '-'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Receipt</th>
                <th>Method</th>
                <th class="amount">Amount</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${formatDate(p.payment_date)}</td>
                  <td>${p.receipt_number}</td>
                  <td>${p.method}</td>
                  <td class="amount">${formatCurrency(p.amount)}</td>
                  <td>${p.remarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Total Paid: ${formatCurrency(student.payment_summary?.paid || 0)}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary">Student not found</h3>
        <button
          onClick={() => navigate('/admin/students')}
          className="btn-primary mt-4"
        >
          Back to Students
        </button>
      </div>
    );
  }

  const studentData = student.student || {};
  const parentData = student.parent || {};
  const enrollment = student.current_enrollment || {};
  const summary = student.payment_summary || {};
  const payments = student.payment_history || [];
  const status = summary.status || 'NOT_ENROLLED';
  const statusBadge = {
    PAID: 'badge-paid',
    PARTIAL: 'badge-partial',
    UNPAID: 'badge-unpaid',
    NOT_ENROLLED: 'badge-info',
  }[status] || 'badge-info';
  const statusLabel = {
    PAID: 'Paid',
    PARTIAL: 'Partial',
    UNPAID: 'Unpaid',
    NOT_ENROLLED: 'Not Enrolled',
  }[status] || status;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/students')}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {studentData.first_name} {studentData.last_name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-text-secondary">
                {studentData.admission_number}
              </span>
              <span className={statusBadge}>{statusLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/admin/payments/record?student=${id}`)}
            className="btn-accent inline-flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Record Payment
          </button>
          <button
            onClick={() => setShowPromoteModal(true)}
            className="btn-primary inline-flex items-center gap-2"
            disabled={!enrollment || status === 'NOT_ENROLLED'}
          >
            <TrendingUp className="w-4 h-4" />
            Promote
          </button>
          <button
            onClick={handlePrintPaymentHistory}
            className="btn-outline inline-flex items-center gap-2"
            disabled={payments.length === 0}
          >
            <Printer className="w-4 h-4" />
            Print History
          </button>
          <button
            onClick={() => navigate(`/admin/students/${id}/edit`)}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(id)}
            className="btn-outline text-status-unpaid border-status-unpaid/30 hover:bg-red-50 inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
            <button
              onClick={() => navigate(`/admin/enrollments?student=${id}`)}
              className="btn-outline inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Enroll
            </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-sm font-medium text-text-secondary mb-4">Personal Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Full Name</p>
                <p className="text-sm font-medium text-text-primary">
                  {studentData.first_name} {studentData.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Admission Number</p>
                <p className="text-sm font-medium text-text-primary font-mono">
                  {studentData.admission_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Registered On</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(studentData.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="card">
          <h2 className="text-sm font-medium text-text-secondary mb-4">Parent Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Parent Name</p>
                <p className="text-sm font-medium text-text-primary">
                  {parentData.first_name} {parentData.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Phone</p>
                <p className="text-sm font-medium text-text-primary">
                  {parentData.phone || '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Email</p>
                <p className="text-sm font-medium text-text-primary">
                  {parentData.email || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Account */}
        <div className="card">
          <h2 className="text-sm font-medium text-text-secondary mb-4">Virtual Account</h2>

          {student.dva ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-status-paid/20 rounded-sm p-4">
                <p className="text-sm text-status-paid font-medium">Account Generated ✅</p>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-secondary">Account Number</p>
                    <p className="text-lg font-bold text-text-primary font-mono">{student.dva}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Account Name</p>
                    <p className="text-sm font-medium text-text-primary">{student.dva_account_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Bank</p>
                    <p className="text-sm font-medium text-text-primary">{student.dva_bank_name || 'GTBank'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Status</p>
                    <p className="text-sm font-medium text-status-paid">Active</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-status-partial/20 rounded-sm p-4">
                <p className="text-sm text-status-partial">
                  No virtual account generated yet.
                </p>
                {student.parent?.nin_validated ? (
                  <p className="text-sm text-text-secondary mt-1">
                    Parent NIN is validated. Click the button below to generate an account.
                  </p>
                ) : (
                  <p className="text-sm text-text-secondary mt-1">
                    ⚠️ Parent NIN needs to be validated first. Go to the parent's profile to validate.
                  </p>
                )}
              </div>

            </div>
          )}
        </div>

      {/* Current Enrollment */}
      <div className="card">
        <h2 className="text-sm font-medium text-text-secondary mb-4">Current Enrollment</h2>
        {enrollment && enrollment.class ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-secondary">Class</p>
              <p className="text-sm font-medium text-text-primary">{enrollment.class.name}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Session</p>
              <p className="text-sm font-medium text-text-primary">{enrollment.session?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Fee</p>
              <p className="text-sm font-medium text-text-primary">{formatCurrency(summary.fee || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Enrolled On</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(enrollment.enrolled_at)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Student is not currently enrolled</p>
        )}
      </div>

      {/* Fee Summary */}
      <div className="card">
        <h2 className="text-sm font-medium text-text-secondary mb-4">Fee Summary</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-text-secondary">School Fee</p>
            <p className="text-xl font-semibold text-text-primary">{formatCurrency(summary.fee || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Amount Paid</p>
            <p className="text-xl font-semibold text-status-paid">{formatCurrency(summary.paid || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Outstanding Balance</p>
            <p className={`text-xl font-semibold ${summary.balance > 0 ? 'text-status-unpaid' : 'text-status-paid'}`}>
              {formatCurrency(summary.balance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-secondary">Payment History</h2>
          <span className="text-sm text-text-secondary">{payments.length} payments</span>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">No payments recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receipt</th>
                  <th>Method</th>
                  <th className="text-right">Amount</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="text-sm">{formatDate(payment.payment_date)}</td>
                    <td className="font-mono text-sm">{payment.receipt_number}</td>
                    <td className="text-sm">{payment.method}</td>
                    <td className="text-right font-medium">{formatCurrency(payment.amount)}</td>
                    <td className="text-sm text-text-secondary">{payment.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Student"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong>{studentData.first_name} {studentData.last_name}</strong>?
            This action cannot be undone. All associated enrollments and payments will also be removed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger"
            >
              Delete Student
            </button>
          </div>
        </div>
      </Modal>

      {/* Promote Modal */}
      <Modal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        title="Promote Student"
        size="md"
      >
        <PromoteForm
          studentId={id}
          currentEnrollment={enrollment}
          onSuccess={handlePromoteSuccess}
          onCancel={() => setShowPromoteModal(false)}
        />
      </Modal>
    </div>
  );
};

export default StudentProfile;