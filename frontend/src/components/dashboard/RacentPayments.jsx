import React from 'react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/format';
import { Clock } from 'lucide-react';

const RecentPayments = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment, index) => (
        <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {payment.student}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-secondary">{payment.receipt}</span>
              <span className="text-xs text-text-secondary">•</span>
              <span className="text-xs text-text-secondary">{formatDate(payment.date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-primary">
              {formatCurrency(payment.amount)}
            </span>
            <span className="text-xs text-text-secondary">{payment.method}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentPayments;