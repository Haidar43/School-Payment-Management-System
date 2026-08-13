import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPayment, getStudent, getStudents } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CreditCard,
  User,
  School,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

const RecordPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student');

  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    method: 'CASH',
    remarks: '',
  });
  const [errors, setErrors] = useState({});

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Card' },
    { value: 'USSD', label: 'USSD' },
    { value: 'VIRTUAL_ACCOUNT', label: 'Virtual Account' },
  ];

  useEffect(() => {
  if (studentId) {
    fetchStudent();
  } else {
    fetchStudents();
    setLoadingStudent(false);
  }
}, [studentId]);

const fetchStudents = async () => {
  try {
    setLoadingStudents(true);
    const response = await getStudents({ limit: 1000 });
    setStudents(response.data || []);
  } catch (error) {
    console.error('Error fetching students:', error);
    toast.error('Failed to load students');
  } finally {
    setLoadingStudents(false);
  }
};

  const fetchStudent = async () => {
    try {
      setLoadingStudent(true);
      const response = await getStudent(studentId);
      setStudent(response.data);
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student details');
      navigate('/admin/students');
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await createPayment({
        student_id: Number(studentId),
        amount: Number(formData.amount),
        method: formData.method,
        remarks: formData.remarks || undefined,
      });
      toast.success('Payment recorded successfully!');
      navigate(`/admin/students/${studentId}`);
    } catch (error) {
      console.error('Error recording payment:', error);
      const message = error.response?.data?.detail || 'Failed to record payment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingStudent) {
  return (
    <div className="flex items-center justify-center h-96">
      <Spinner size="lg" />
    </div>
  );
}

// If no student ID and we're not loading, show student selector
if (!studentId && !loadingStudent) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/payments')}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Payments
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Record Payment</h1>
        <p className="text-sm text-text-secondary mt-1">
          Select a student to record a payment
        </p>
      </div>

      {/* Student Selector */}
      <div className="card">
        <div className="space-y-4">
          <Select
            label="Select Student"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            options={students.map((item) => {
              const s = item.student || item;
              const parent = item.parent || {};
              return {
                value: s.id,
                label: `${s.first_name} ${s.last_name} (${s.admission_number}) - ${parent.first_name || ''} ${parent.last_name || ''}`
              };
            })}
            placeholder="Search and select a student..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => navigate('/admin/payments')}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedStudentId) {
                  navigate(`/admin/payments/record?student=${selectedStudentId}`);
                } else {
                  toast.error('Please select a student');
                }
              }}
              className="btn-accent inline-flex items-center gap-2"
              disabled={!selectedStudentId}
            >
              <CreditCard className="w-4 h-4" />
              Continue
            </button>
          </div>
        </div>
      </div>
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

  const summary = student.payment_summary || {};
  const fee = summary.fee || 0;
  const paid = summary.paid || 0;
  const balance = summary.balance || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/admin/students/${studentId}`)}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Student Profile
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Record Payment</h1>
        <p className="text-sm text-text-secondary mt-1">
          Record a new payment for a student
        </p>
      </div>

      {/* Student Info Card */}
      <div className="card bg-primary/5 border-primary/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary">
              {student.student?.first_name} {student.student?.last_name}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1">
              <p className="text-sm text-text-secondary">
                Admission: {student.student?.admission_number}
              </p>
              <p className="text-sm text-text-secondary">
                Class: {student.current_enrollment?.class?.name || 'Not enrolled'}
              </p>
              <p className="text-sm text-text-secondary">
                Parent: {student.parent?.first_name} {student.parent?.last_name}
              </p>
              <p className="text-sm text-text-secondary">
                Session: {student.current_enrollment?.session?.name || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="card">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Payment Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-secondary">School Fee</p>
            <p className="text-lg font-semibold text-text-primary">{formatCurrency(fee)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Already Paid</p>
            <p className="text-lg font-semibold text-status-paid">{formatCurrency(paid)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Outstanding</p>
            <p className="text-lg font-semibold text-status-unpaid">{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Amount to Pay"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            required
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
          />

          <Select
            label="Payment Method"
            name="method"
            value={formData.method}
            onChange={handleChange}
            options={paymentMethods}
            required
          />

          <Input
            label="Remarks (Optional)"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="e.g., First installment, Full payment, etc."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(`/admin/students/${studentId}`)}
              className="btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-accent inline-flex items-center gap-2"
              disabled={loading || balance <= 0}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Record Payment
                </>
              )}
            </button>
          </div>

          {balance <= 0 && (
            <div className="rounded-sm bg-green-50 border border-status-paid/20 p-3">
              <p className="text-sm text-status-paid">
                This student has no outstanding balance.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default RecordPayment;