import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPayments, getSessions } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Eye,
  Printer,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';

const Payments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    session_id: '',
    method: '',
    start_date: '',
    end_date: '',
    receipt_number: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 20;
  const methods = ['CASH', 'BANK_TRANSFER', 'CARD', 'USSD', 'VIRTUAL_ACCOUNT'];

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters, currentPage]);

  const fetchSessions = async () => {
    try {
      const response = await getSessions();
      setSessions(response.data || []);
      const current = response.data?.find((s) => s.is_current);
      setFilters((prev) => ({ ...prev, session_id: current?.id || '' }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        ...filters,
        receipt_number: searchQuery || undefined,
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      const response = await getPayments(params);
      setPayments(response.data || []);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handlePrintReceipt = (payment) => {
  if (!payment) {
    toast.error('No payment data to print');
    return;
  }

  // Create print-friendly receipt content
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Receipt - ${payment.receipt_number}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 400px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #ffffff;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px dashed #333;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .receipt-header h1 {
            font-size: 24px;
            margin: 0;
            letter-spacing: 2px;
          }
          .receipt-header p {
            margin: 4px 0;
            color: #666;
            font-size: 14px;
          }
          .receipt-details {
            margin-bottom: 16px;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dotted #eee;
            font-size: 14px;
          }
          .receipt-row .label {
            color: #666;
          }
          .receipt-row .value {
            font-weight: bold;
          }
          .receipt-amount {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            padding: 12px 0;
            margin: 12px 0;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px dashed #333;
            color: #666;
            font-size: 12px;
          }
          .receipt-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            background: #15803D;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <h1>SCHOOLPAY</h1>
          <p>Payment Receipt</p>
        </div>

        <div class="receipt-details">
          <div class="receipt-row">
            <span class="label">Receipt No.</span>
            <span class="value">${payment.receipt_number}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Date</span>
            <span class="value">${formatDate(payment.payment_date)}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Student</span>
            <span class="value">${payment.student_name}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Admission</span>
            <span class="value">${payment.admission_number}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Class</span>
            <span class="value">${payment.class_name}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Session</span>
            <span class="value">${payment.session_name}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Payment Method</span>
            <span class="value">${payment.method}</span>
          </div>
        </div>

        <div class="receipt-amount">
          Amount: ${formatCurrency(payment.amount)}
        </div>

        ${payment.remarks ? `
          <div class="receipt-row">
            <span class="label">Remarks</span>
            <span class="value">${payment.remarks}</span>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 12px;">
          <span class="receipt-status">PAID</span>
        </div>

        <div class="receipt-footer">
          <p>Thank you for your payment!</p>
          <p>This is a system-generated receipt.</p>
        </div>
      </body>
    </html>
  `;

  // Open print window
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) {
    toast.error('Please allow popups to print receipts');
    return;
  }

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();

  // Close after print or on close
  printWindow.onafterprint = () => {
    printWindow.close();
  };
};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Payments</h1>
          <p className="text-sm text-text-secondary mt-1">
            View and manage all payments
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/payments/record')}
          className="btn-accent inline-flex items-center gap-2"
        >
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="input-label">Session</label>
            <Select
              name="session_id"
              value={filters.session_id}
              onChange={handleFilterChange}
              options={sessions.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              placeholder="All Sessions"
            />
          </div>
          <div>
            <label className="input-label">Method</label>
            <Select
              name="method"
              value={filters.method}
              onChange={handleFilterChange}
              options={methods.map((m) => ({ value: m, label: m }))}
              placeholder="All Methods"
            />
          </div>
          <div>
            <label className="input-label">From</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="input"
            />
          </div>
          <div>
            <label className="input-label">To</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="input"
            />
          </div>
          <div>
            <label className="input-label">Receipt Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-text-secondary" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by receipt..."
                className="input pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Student</th>
                <th>Parent</th>
                <th>Class</th>
                <th>Session</th>
                <th>Method</th>
                <th className="text-right">Amount</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">No payments found</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-mono text-sm">{payment.receipt_number}</td>
                    <td className="text-sm">{payment.student_name}</td>
                    <td className="text-sm">{payment.parent_name}</td>
                    <td className="text-sm">{payment.class_name}</td>
                    <td className="text-sm">{payment.session_name}</td>
                    <td className="text-sm">{payment.method}</td>
                    <td className="text-left font-medium">{formatCurrency(payment.amount)}</td>
                    <td className="text-sm">{formatDate(payment.payment_date)}</td>
                    <td className="text-left">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewPayment(payment)}
                          className="p-1.5 text-text-secondary hover:text-text-primary rounded-sm hover:bg-background transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(payment)}
                          className="p-1.5 text-text-secondary hover:text-accent rounded-sm hover:bg-background transition-colors"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {payments.length} payments
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

      {/* Payment Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Payment Details"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-secondary">Receipt Number</p>
                <p className="font-mono text-sm">{selectedPayment.receipt_number}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Amount</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-secondary">Student</p>
                <p className="text-sm font-medium">{selectedPayment.student_name}</p>
                <p className="text-xs text-text-secondary">{selectedPayment.admission_number}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Parent</p>
                <p className="text-sm font-medium">{selectedPayment.parent_name}</p>
                <p className="text-xs text-text-secondary">{selectedPayment.parent_phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-secondary">Class</p>
                <p className="text-sm">{selectedPayment.class_name}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Session</p>
                <p className="text-sm">{selectedPayment.session_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-secondary">Method</p>
                <p className="text-sm">{selectedPayment.method}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Date</p>
                <p className="text-sm">{formatDate(selectedPayment.payment_date)}</p>
              </div>
            </div>

            {selectedPayment.remarks && (
              <div>
                <p className="text-xs text-text-secondary">Remarks</p>
                <p className="text-sm">{selectedPayment.remarks}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => handlePrintReceipt(selectedPayment)}
                className="btn-outline inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payments;