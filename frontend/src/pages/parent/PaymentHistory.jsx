import React, { useState, useEffect } from 'react';
import { getPaymentHistory } from '../../api/parent';
import toast from 'react-hot-toast';
import {
  Search,
  AlertCircle,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

const PaymentHistory = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchPayments();
  }, [currentPage]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await getPaymentHistory({
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
      });
      const data = response.data || {};
      setPayments(data.payments || []);
      setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (payments.length === 0) {
      toast.error('No payments to print');
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Payment History</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            h2 { font-size: 16px; font-weight: normal; color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #333; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .amount { text-align: right; }
            .total { margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>My Payment History</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Receipt</th>
                <th>Method</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${formatDate(p.date)}</td>
                  <td>${p.student}</td>
                  <td>${p.receipt}</td>
                  <td>${p.method}</td>
                  <td class="amount">${formatCurrency(p.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Total: ${formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredPayments = payments.filter(p =>
    p.student?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.receipt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Payment History</h1>
          <p className="text-sm text-text-secondary mt-1">
            View all payments made for your children
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="btn-outline inline-flex items-center gap-2"
          disabled={payments.length === 0}
        >
          <Printer className="w-4 h-4" />
          Print History
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-text-secondary" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student or receipt..."
          className="input pl-9"
        />
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary">No payments found</h3>
            <p className="text-sm text-text-secondary mt-1">
              {searchQuery ? 'No payments matching your search' : 'No payments have been recorded yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Receipt</th>
                  <th>Method</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr key={index}>
                    <td className="text-sm">{formatDate(payment.date)}</td>
                    <td className="text-sm font-medium">{payment.student}</td>
                    <td className="font-mono text-sm">{payment.receipt}</td>
                    <td className="text-sm">{payment.method}</td>
                    <td className="text-right font-medium">{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="text-right font-medium">Total</td>
                  <td className="text-right font-semibold text-text-primary">
                    {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {filteredPayments.length} payments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;