import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChildDetails } from '../../api/parent';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  BookOpen,
  Calendar,
  CreditCard,
  Wallet,
  TrendingUp,
  Printer,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

const ChildDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);

  useEffect(() => {
    fetchChildDetails();
  }, [id]);

  const fetchChildDetails = async () => {
    try {
      setLoading(true);
      const response = await getChildDetails(id);
      setChild(response.data);
    } catch (error) {
      console.error('Error fetching child details:', error);
      toast.error('Failed to load child details');
      navigate('/parent/children');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintHistory = () => {
    const payments = child?.payment_history || [];
    if (payments.length === 0) {
      toast.error('No payment history to print');
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Payment History - ${child?.student?.first_name} ${child?.student?.last_name}</title>
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
          <h1>${child?.student?.first_name} ${child?.student?.last_name}</h1>
          <h2>Payment History</h2>
          <div class="student-info">
            <p><strong>Admission:</strong> ${child?.student?.admission_number}</p>
            <p><strong>Class:</strong> ${child?.current_enrollment?.class?.name || 'Not enrolled'}</p>
            <p><strong>Session:</strong> ${child?.current_enrollment?.session?.name || '-'}</p>
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
            Total Paid: ${formatCurrency(child?.payment_summary?.paid || 0)}
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

  if (!child) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary">Child not found</h3>
        <button onClick={() => navigate('/parent/children')} className="btn-primary mt-4">
          Back to Children
        </button>
      </div>
    );
  }

  const student = child.student || {};
  const enrollment = child.current_enrollment || {};
  const summary = child.payment_summary || {};
  const payments = child.payment_history || [];
  const status = summary.status || 'NOT_ENROLLED';
  const badge = getStatusBadge(status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/parent/children')}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Children
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {student.first_name} {student.last_name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-text-secondary">
                {student.admission_number}
              </span>
              <span className={badge.className}>{badge.label}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handlePrintHistory}
          className="btn-outline inline-flex items-center gap-2"
          disabled={payments.length === 0}
        >
          <Printer className="w-4 h-4" />
          Print History
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-medium text-text-secondary mb-4">Student Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Full Name</p>
                <p className="text-sm font-medium text-text-primary">
                  {student.first_name} {student.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Admission Number</p>
                <p className="text-sm font-medium text-text-primary font-mono">
                  {student.admission_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Registered On</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(student.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-medium text-text-secondary mb-4">Current Enrollment</h2>
          {enrollment && enrollment.class ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-secondary">Class</p>
                  <p className="text-sm font-medium text-text-primary">{enrollment.class.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-secondary">Session</p>
                  <p className="text-sm font-medium text-text-primary">{enrollment.session?.name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-secondary">School Fee</p>
                  <p className="text-sm font-medium text-text-primary">{formatCurrency(summary.fee || 0)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Student is not currently enrolled</p>
          )}
        </div>
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

        {summary.fee > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-text-secondary">Payment Progress</span>
              <span className="font-medium">{Math.round((summary.paid / summary.fee) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-status-paid rounded-full transition-all"
                style={{ width: `${Math.min((summary.paid / summary.fee) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
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
    </div>
  );
};

export default ChildDetails;