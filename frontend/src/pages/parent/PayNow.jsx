import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getChildDetails, initializePayment } from '../../api/parent';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CreditCard,
  User,
  BookOpen,
  Wallet,
  AlertCircle,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { formatCurrency, getStatusBadge } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';

const PayNow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [child, setChild] = useState(null);
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});
  const [outstanding, setOutstanding] = useState(0);

  useEffect(() => {
    fetchChildDetails();
  }, [id]);

  const fetchChildDetails = async () => {
    try {
      setLoading(true);
      const response = await getChildDetails(id);
      setChild(response.data);

      const summary = response.data?.payment_summary || {};
      const balance = summary.balance || 0;
      setOutstanding(balance);

      // Pre-fill amount with full balance
      if (balance > 0) {
        setAmount((balance / 100).toString());
      }
    } catch (error) {
      console.error('Error fetching child details:', error);
      toast.error('Failed to load child details');
      navigate('/parent/children');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (errors.amount) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amountNum < 1000) {
      newErrors.amount = 'Minimum payment amount is ₦1,000';
    } else if (amountNum > (outstanding / 100)) {
      newErrors.amount = `Amount cannot exceed outstanding balance (${formatCurrency(outstanding)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setSubmitting(true);
  try {
    const amountNum = parseFloat(amount); // In Naira, NOT kobo
    const studentId = parseInt(id);

    console.log('Sending payment request:', { student_id: studentId, amount: amountNum });

    const response = await initializePayment(studentId, amountNum);

    console.log('Payment response:', response.data);

    // Redirect to Paystack
    const { authorization_url } = response.data;
    if (authorization_url) {
      window.location.href = authorization_url;
    } else {
      toast.error('Failed to initialize payment');
    }
  } catch (error) {
    console.error('Error initializing payment:', error);
    console.error('Error response:', error.response?.data);
    const message = error.response?.data?.detail || 'Failed to start payment';
    toast.error(message);
    setErrors({ general: message });
  } finally {
    setSubmitting(false);
  }
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
  const status = summary.status || 'NOT_ENROLLED';
  const badge = getStatusBadge(status);
  const fee = summary.fee || 0;
  const paid = summary.paid || 0;
  const balance = summary.balance || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Pay School Fees</h1>
        <p className="text-sm text-text-secondary mt-1">
          Secure payment via Paystack
        </p>
      </div>

      {/* Student Info */}
      <div className="card bg-primary/5 border-primary/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary">
              {student.first_name} {student.last_name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-text-secondary">
                {student.admission_number}
              </span>
              <span className="text-sm text-text-secondary">•</span>
              <span className="text-sm text-text-secondary">
                {enrollment?.class?.name || 'Not enrolled'}
              </span>
              <span className={badge.className}>{badge.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Summary */}
      <div className="card">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Fee Summary</h2>
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
            <p className={`text-lg font-semibold ${balance > 0 ? 'text-status-unpaid' : 'text-status-paid'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {fee > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-text-secondary">Payment Progress</span>
              <span className="font-medium">{Math.round((paid / fee) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-status-paid rounded-full transition-all"
                style={{ width: `${Math.min((paid / fee) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Amount to Pay (₦)"
            name="amount"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            error={errors.amount}
            required
            placeholder="Enter amount"
            min="1000"
            step="100"
            helperText={`Minimum: ₦1,000 | Outstanding: ${formatCurrency(balance)}`}
          />

          {balance > 0 && (
            <button
              type="button"
              onClick={() => {
                setAmount((balance / 100).toString());
                setErrors({});
              }}
              className="text-sm text-accent hover:text-accent-light font-medium"
            >
              Pay full balance ({formatCurrency(balance)})
            </button>
          )}

          <div className="rounded-sm bg-blue-50 border border-status-info/20 p-3 flex items-start gap-3">
            <Lock className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-status-info font-medium">Secure Payment</p>
              <p className="text-sm text-status-info/80">
                You will be redirected to Paystack secure payment page. Your card details are safe.
              </p>
            </div>
          </div>

          {errors.general && (
            <div className="rounded-sm bg-red-50 border border-status-unpaid/20 p-3">
              <p className="text-sm text-status-unpaid">{errors.general}</p>
            </div>
          )}

          {balance <= 0 && (
            <div className="rounded-sm bg-green-50 border border-status-paid/20 p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-status-paid" />
              <p className="text-sm text-status-paid">
                This student has no outstanding balance. No payment needed.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(`/parent/children/${id}`)}
              className="btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-accent inline-flex items-center gap-2"
              disabled={submitting || balance <= 0}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayNow;