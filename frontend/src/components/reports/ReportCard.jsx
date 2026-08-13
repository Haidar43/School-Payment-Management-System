import React from 'react';
import { formatCurrency, formatDate } from '../../utils/format';

const ReportCard = ({ reportType, data }) => {
  if (!data) return null;

  const renderPaymentReport = () => {
    if (data.error) return <p className="text-status-unpaid">{data.error}</p>;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Total Students</p>
            <p className="text-2xl font-semibold text-text-primary">{data.student_count || 0}</p>
          </div>
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Total Fee</p>
            <p className="text-lg font-semibold text-text-primary">{formatCurrency(data.total_fee || 0)}</p>
          </div>
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Total Collected</p>
            <p className="text-lg font-semibold text-status-paid">{formatCurrency(data.total_paid || 0)}</p>
          </div>
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Total Outstanding</p>
            <p className="text-lg font-semibold text-status-unpaid">{formatCurrency(data.total_outstanding || 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Paid Students</p>
            <p className="text-lg font-semibold text-status-paid">{data.paid_students || 0}</p>
          </div>
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Partial Students</p>
            <p className="text-lg font-semibold text-status-partial">{data.partial_students || 0}</p>
          </div>
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Unpaid Students</p>
            <p className="text-lg font-semibold text-status-unpaid">{data.unpaid_students || 0}</p>
          </div>
        </div>

        {data.payment_details && data.payment_details.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission</th>
                  <th>Parent</th>
                  <th className="text-right">Fee</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.payment_details.map((item, i) => (
                  <tr key={i}>
                    <td className="text-sm">{item.student}</td>
                    <td className="text-sm font-mono">{item.admission}</td>
                    <td className="text-sm">{item.parent}</td>
                    <td className="text-right">{formatCurrency(item.fee)}</td>
                    <td className="text-right">{formatCurrency(item.paid)}</td>
                    <td className="text-right font-medium text-status-unpaid">{formatCurrency(item.balance)}</td>
                    <td>
                      <span className={
                        item.status === 'PAID' ? 'badge-paid' :
                        item.status === 'PARTIAL' ? 'badge-partial' : 'badge-unpaid'
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderOutstandingReport = () => {
    if (!data || data.length === 0) {
      return <p className="text-text-secondary text-center py-4">No outstanding students found</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Student</th>
              <th>Admission</th>
              <th>Parent</th>
              <th>Phone</th>
              <th className="text-right">Fee</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td className="text-sm">{item.class_name}</td>
                <td className="text-sm">{item.student_name}</td>
                <td className="text-sm font-mono">{item.admission_number}</td>
                <td className="text-sm">{item.parent_name}</td>
                <td className="text-sm">{item.parent_phone}</td>
                <td className="text-right">{formatCurrency(item.fee)}</td>
                <td className="text-right">{formatCurrency(item.paid)}</td>
                <td className="text-right font-medium text-status-unpaid">{formatCurrency(item.balance)}</td>
                <td>
                  <span className={item.status === 'PARTIAL' ? 'badge-partial' : 'badge-unpaid'}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDailyCollection = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Date</p>
            <p className="text-lg font-semibold text-text-primary">{formatDate(data.date)}</p>
          </div>
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Total Amount</p>
            <p className="text-lg font-semibold text-status-paid">{formatCurrency(data.total_amount || 0)}</p>
          </div>
          <div className="bg-background rounded-sm p-4 text-center">
            <p className="text-xs text-text-secondary">Payments</p>
            <p className="text-lg font-semibold text-text-primary">{data.payment_count || 0}</p>
          </div>
        </div>

        {data.method_breakdown && Object.keys(data.method_breakdown).length > 0 && (
          <div className="bg-background rounded-sm p-4">
            <p className="text-sm font-medium text-text-primary mb-2">Method Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(data.method_breakdown).map(([method, count]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{method}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.students_paid && data.students_paid.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission</th>
                  <th className="text-right">Amount</th>
                  <th>Receipt</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {data.students_paid.map((item, i) => (
                  <tr key={i}>
                    <td className="text-sm">{item.student}</td>
                    <td className="text-sm font-mono">{item.admission}</td>
                    <td className="text-right">{formatCurrency(item.amount)}</td>
                    <td className="text-sm font-mono">{item.receipt}</td>
                    <td className="text-sm">{item.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSessionCollections = () => {
    if (!data || data.length === 0) {
      return <p className="text-text-secondary text-center py-4">No session data available</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Students</th>
              <th className="text-right">Total Fee</th>
              <th className="text-right">Collected</th>
              <th>Fully Paid</th>
              <th>Collection Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td className="font-medium">{item.session_name}</td>
                <td className="text-center">{item.student_count || 0}</td>
                <td className="text-right">{formatCurrency(item.total_fee || 0)}</td>
                <td className="text-right text-status-paid">{formatCurrency(item.total_collected || 0)}</td>
                <td className="text-center">{item.fully_paid_students || 0}</td>
                <td className="font-medium">{item.collection_rate}</td>
                <td>
                  {item.is_current ? (
                    <span className="badge-paid">Current</span>
                  ) : (
                    <span className="badge-info">Archived</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOutstandingByClass = () => {
    if (!data || data.length === 0) {
      return <p className="text-text-secondary text-center py-4">No class data available</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item, i) => (
          <div key={i} className="bg-background rounded-sm p-4">
            <h3 className="font-semibold text-text-primary">{item.class_name}</h3>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Students</span>
                <span className="font-medium">{item.total_students || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Fee</span>
                <span className="font-medium">{formatCurrency(item.total_fee || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Collected</span>
                <span className="font-medium text-status-paid">{formatCurrency(item.total_paid || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 mt-1">
                <span className="text-text-secondary font-medium">Outstanding</span>
                <span className="font-medium text-status-unpaid">{formatCurrency(item.total_outstanding || 0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDefaulters = () => {
    if (!data || data.length === 0) {
      return <p className="text-text-secondary text-center py-4">No defaulters found</p>;
    }
    return renderOutstandingReport();
  };

  switch (reportType) {
    case 'payment':
      return renderPaymentReport();
    case 'outstanding':
      return renderOutstandingReport();
    case 'today':
      return renderDailyCollection();
    case 'monthly':
      return renderDailyCollection();
    case 'session-collections':
      return renderSessionCollections();
    case 'outstanding-by-class':
      return renderOutstandingByClass();
    case 'defaulters':
      return renderDefaulters();
    default:
      return renderPaymentReport();
  }
};

export default ReportCard;