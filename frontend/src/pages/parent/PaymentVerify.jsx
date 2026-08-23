import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPayment } from '../../api/parent';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader,
} from 'lucide-react';
import Spinner from '../../components/common/Spinner';

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  useEffect(() => {
    if (!reference && !trxref) {
      setStatus('error');
      setError('No payment reference found');
      return;
    }

    verifyPaymentRequest(reference || trxref);
  }, [reference, trxref]);

  const verifyPaymentRequest = async (ref) => {
    try {
      const response = await verifyPayment(ref);
      const data = response.data;

      if (data.status === 'success') {
        setStatus('success');
        setPaymentData({ ...data, amount: data.amount * 100 });
        toast.success('Payment successful!');
      } else if (data.status === 'failed') {
        setStatus('failed');
        setError(data.message || 'Payment failed');
        toast.error('Payment failed');
      } else {
        setStatus('pending');
        setPaymentData(data);
        toast.info('Payment is being processed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('error');
      setError(error.response?.data?.detail || 'Failed to verify payment');
      toast.error('Failed to verify payment');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Spinner size="lg" />
        <p className="mt-4 text-text-secondary">Verifying your payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="card text-center p-8">
        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-status-paid" />
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mt-4">
              Payment Successful! 🎉
            </h2>
            <p className="text-text-secondary mt-2">
              Your payment has been confirmed and recorded.
            </p>
            {paymentData && (
              <div className="mt-4 p-4 bg-background rounded-sm text-left">
                <p className="text-sm text-text-secondary">Receipt Number</p>
                <p className="font-mono font-medium">{paymentData.receipt_number}</p>
                <p className="text-sm text-text-secondary mt-2">Amount Paid</p>
                <p className="font-semibold text-text-primary">
                  ₦{(paymentData.amount / 100).toLocaleString()}
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/parent/children')}
              className="btn-primary mt-6 w-full"
            >
              View Your Children
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-status-unpaid" />
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mt-4">
              Payment Failed
            </h2>
            <p className="text-text-secondary mt-2">
              {error || 'Your payment could not be completed.'}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Please try again or use a different payment method.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => navigate(-1)}
                className="btn-outline flex-1"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/parent/children')}
                className="btn-primary flex-1"
              >
                View Children
              </button>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Loader className="w-12 h-12 text-status-partial animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mt-4">
              Processing...
            </h2>
            <p className="text-text-secondary mt-2">
              Your payment is being processed. This may take a few moments.
            </p>
            <button
              onClick={() => navigate('/parent/children')}
              className="btn-primary mt-6 w-full"
            >
              Check Status Later
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-12 h-12 text-status-unpaid" />
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mt-4">
              Error
            </h2>
            <p className="text-text-secondary mt-2">{error}</p>
            <button
              onClick={() => navigate('/parent/children')}
              className="btn-primary mt-6 w-full"
            >
              Back to Children
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentVerify;
