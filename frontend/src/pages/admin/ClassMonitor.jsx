import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getClassPaymentMonitor,
  getCurrentSession,
  getSessions,
  getClasses,
  promoteAllStudents,
} from '../../api/admin';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import {
  ArrowLeft,
  Users,
  CreditCard,
  AlertCircle,
  Printer,
  Download,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Select from '../../components/common/Select';

const ClassMonitor = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [classes, setClasses] = useState([]); // Added state
  const [selectedSession, setSelectedSession] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('filter') || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteData, setPromoteData] = useState({
    target_class_id: '',
    target_session_id: '',
  });

  const statusOptions = [
    { value: 'ALL', label: 'All Students' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'UNPAID', label: 'Unpaid' },
    { value: 'DEFAULTERS', label: 'Defaulters' },
  ];

  useEffect(() => {
    fetchSessions();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClassData();
    }
  }, [selectedSession, statusFilter]);

  const fetchClasses = async () => {
    try {
      const response = await getClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await getSessions();
      const sessionList = response.data || [];
      setSessions(sessionList);

      const currentResponse = await getCurrentSession();
      if (currentResponse.data) {
        setSelectedSession(currentResponse.data.id);
      } else if (sessionList.length > 0) {
        setSelectedSession(sessionList[0].id);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  const handlePromoteAll = async () => {
    if (!promoteData.target_class_id) {
      toast.error('Please select a target class');
      return;
    }

    setPromoteLoading(true);
    try {
      const response = await promoteAllStudents(
        classId,
        promoteData.target_class_id,
        promoteData.target_session_id || undefined
      );

      toast.success(response.data.message);
      setShowPromoteModal(false);
      fetchClassData(); // Refresh the page
    } catch (error) {
      console.error('Error promoting students:', error);
      const message =
        error.response?.data?.detail || 'Failed to promote students';
      toast.error(message);
    } finally {
      setPromoteLoading(false);
    }
  };

  const fetchClassData = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);
      const response = await getClassPaymentMonitor(classId, {
        session_id: selectedSession,
        status_filter: statusFilter,
      });
      setClassData(response.data);
    } catch (error) {
      console.error('Error fetching class data:', error);
      toast.error('Failed to load class data');
      navigate('/admin/payment-status');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    setSearchParams({ filter: value });
  };

  const handleSessionChange = (e) => {
    setSelectedSession(Number(e.target.value));
  };

      const handlePrintUnpaid = () => {
      const unpaidStudents = classData?.students?.filter(
        (s) => s.status === 'UNPAID' || s.status === 'PARTIAL'
      );

      if (!unpaidStudents || unpaidStudents.length === 0) {
        toast.error('No unpaid students to print');
        return;
      }

      // Safe helper to strip strings/commas and enforce numerical values
      const safeNum = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;

        // Convert to string
        let cleaned = String(val);

        // Remove currency symbols, commas, and spaces
        cleaned = cleaned.replace(/[₦$,]/g, '').trim();
        cleaned = cleaned.replace(/,/g, '');

        // Parse as float
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Convert kobo to Naira and format
      const formatNaira = (amountInKobo) => {
        const amountInNaira = amountInKobo / 100;
        return Math.round(amountInNaira).toLocaleString('en-US');
      };

      const printContent = `
        <html>
          <head>
            <title>Unpaid Students - ${classData?.class_name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { font-size: 24px; margin-bottom: 4px; }
              h2 { font-size: 18px; font-weight: normal; color: #666; margin-top: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #333; }
              td { padding: 8px; border-bottom: 1px solid #ddd; }
              .amount { text-align: right; font-family: monospace; }
              .total { margin-top: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>${classData?.class_name}</h1>
            <h2>Unpaid Students List - ${
              sessions.find((s) => s.id === selectedSession)?.name || ''
            }</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Admission</th>
                  <th>Student Name</th>
                  <th>Parent Name</th>
                  <th class="amount">Fee</th>
                  <th class="amount">Paid</th>
                  <th class="amount">Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${unpaidStudents
                  .map((s, i) => {
                    // Convert kobo to naira
                    const paid = safeNum(s.paid) / 100;
                    const balance = safeNum(s.balance) / 100;
                    const fee = paid + balance;

                    return `
                      <tr>
                        <td>${i + 1}</td>
                        <td>${s.admission_number || ''}</td>
                        <td>${s.student_name || ''}</td>
                        <td>${s.parent_name || ''}</td>
                        <td class="amount">₦${Math.round(fee).toLocaleString('en-US')}</td>
                        <td class="amount">₦${Math.round(paid).toLocaleString('en-US')}</td>
                        <td class="amount">₦${Math.round(balance).toLocaleString('en-US')}</td>
                        <td>${s.status || ''}</td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
            <div class="total">
              Total Unpaid Students: ${unpaidStudents.length}
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

  if (!classData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary">
          Class not found
        </h3>
        <button
          onClick={() => navigate('/admin/payment-status')}
          className="btn-primary mt-4"
        >
          Back to Payment Status
        </button>
      </div>
    );
  }

  const students = classData.students || [];
  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.status === 'PAID').length;
  const partialCount = students.filter((s) => s.status === 'PARTIAL').length;
  const unpaidCount = students.filter((s) => s.status === 'UNPAID').length;
  const totalBalance = students.reduce((sum, s) => sum + s.balance, 0);

  const filteredStudents = students.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/payment-status')}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Payment Status
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {classData.class_name}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {classData.session_name} • Fee: {formatCurrency(classData.fee)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePrintUnpaid}
            className="btn-danger inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Unpaid List
          </button>

          <button
            onClick={() => setShowPromoteModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Promote All Students
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card">
          <p className="text-xs text-text-secondary">Total Students</p>
          <p className="text-lg font-semibold text-text-primary">
            {totalStudents}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-text-secondary">Paid</p>
          <p className="text-lg font-semibold text-status-paid">{paidCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-text-secondary">Partial</p>
          <p className="text-lg font-semibold text-status-partial">
            {partialCount}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-text-secondary">Unpaid</p>
          <p className="text-lg font-semibold text-status-unpaid">
            {unpaidCount}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-text-secondary">Total Outstanding</p>
          <p className="text-lg font-semibold text-status-unpaid">
            {formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-48">
          <Select
            value={selectedSession}
            onChange={handleSessionChange}
            options={sessions.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
          />
        </div>
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={handleFilterChange}
            options={statusOptions}
          />
        </div>
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Admission</th>
                <th>Student</th>
                <th>Parent</th>
                <th>Parent Phone</th>
                <th className="text-left">Paid</th>
                <th className="text-left">Balance</th>
                <th>Status</th>
                <th className="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-8 text-text-secondary"
                  >
                    {searchQuery
                      ? 'No students matching search'
                      : 'No students in this class'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const badge = getStatusBadge(student.status);
                  return (
                    <tr key={student.student_id}>
                      <td className="font-mono text-sm">
                        {student.admission_number}
                      </td>
                      <td className="font-medium">{student.student_name}</td>
                      <td className="text-sm">{student.parent_name}</td>
                      <td className="text-sm">{student.parent_phone}</td>
                      <td className="text-left">
                        {formatCurrency(student.paid)}
                      </td>
                      <td className="text-left font-medium text-status-unpaid">
                        {formatCurrency(student.balance)}
                      </td>
                      <td>
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td className="text-left">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/payments/record?student=${student.student_id}`
                            )
                          }
                          className="text-sm text-accent hover:text-accent-light font-medium"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promote All Modal */}
      <Modal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        title={`Promote All Students from ${classData?.class_name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will promote all active students from{' '}
            <strong>{classData?.class_name}</strong> to the selected class for
            the selected session.
          </p>

          <Select
            label="Target Class"
            value={promoteData.target_class_id}
            onChange={(e) =>
              setPromoteData((prev) => ({
                ...prev,
                target_class_id: e.target.value,
              }))
            }
            options={classes
              .filter(
                (c) =>
                  String(c.id || c.class?.id) !== String(classId)
              )
              .map((c) => ({
                value: c.id || c.class?.id,
                label: c.name || c.class?.name,
              }))}
            placeholder="Select target class"
            required
          />

          <Select
              label="Target Session"
              name="target_session_id"
              value={promoteData.target_session_id}
              onChange={(e) => setPromoteData(prev => ({
                ...prev,
                target_session_id: e.target.value
              }))}
              options={sessions
                .filter(s => s.id !== currentSessionId)  // Remove current session
                .map(s => ({
                  value: s.id,
                  label: s.name,
                }))}
              placeholder="Select target session"
              required
            />

          <div className="rounded-sm bg-amber-50 border border-status-partial/20 p-3">
            <p className="text-sm text-status-partial">
              ⚠️ This action will:
              <br />• Close all current enrollments
              <br />• Create new enrollments in target class
              <br />• All students will be promoted at once
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => setShowPromoteModal(false)}
              className="btn-outline"
              disabled={promoteLoading}
            >
              Cancel
            </button>
            <button
              onClick={handlePromoteAll}
              className="btn-primary inline-flex items-center gap-2"
              disabled={promoteLoading || !promoteData.target_class_id}
            >
              {promoteLoading ? (
                <>
                  <Spinner size="sm" />
                  Promoting...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Promote All
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClassMonitor;