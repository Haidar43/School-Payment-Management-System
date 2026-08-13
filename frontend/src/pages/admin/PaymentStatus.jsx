import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaymentStatus, getCurrentSession } from '../../api/admin';
import { getSessions } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  Search,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import ClassCard from '../../components/payment-status/ClassCard';
import Spinner from '../../components/common/Spinner';
import Select from '../../components/common/Select';

const PaymentStatus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSessionName, setCurrentSessionName] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession || sessions.length > 0) {
      fetchPaymentStatus();
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await getSessions();
      const sessionList = response.data || [];
      setSessions(sessionList);

      // Get current session
      const currentResponse = await getCurrentSession();
      if (currentResponse.data) {
        setCurrentSessionName(currentResponse.data.name);
        setSelectedSession(currentResponse.data.id);
      } else if (sessionList.length > 0) {
        setSelectedSession(sessionList[0].id);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  const fetchPaymentStatus = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);
      const response = await getPaymentStatus({ session_id: selectedSession });
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching payment status:', error);
      toast.error('Failed to load payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPaymentStatus();
    toast.success('Refreshed successfully');
  };

  const handleSessionChange = (e) => {
    setSelectedSession(Number(e.target.value));
  };

  // Filter classes by search query
  const filteredClasses = classes.filter((cls) =>
    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totals = classes.reduce(
    (acc, cls) => ({
      students: acc.students + cls.students,
      paid: acc.paid + cls.paid,
      partial: acc.partial + cls.partial,
      unpaid: acc.unpaid + cls.unpaid,
      outstanding: acc.outstanding + cls.outstanding,
    }),
    { students: 0, paid: 0, partial: 0, unpaid: 0, outstanding: 0 }
  );

  if (loading && classes.length === 0) {
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
          <h1 className="text-2xl font-semibold text-text-primary">Payment Status</h1>
          <p className="text-sm text-text-secondary mt-1">
            Overview of fee payment status by class
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Session Selector */}
          <div className="w-48">
            <Select
              value={selectedSession}
              onChange={handleSessionChange}
              options={sessions.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              className="w-full"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="btn-outline inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      {classes.length > 0 && (
        <div className="card bg-primary/5 border-primary/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-sm text-text-secondary">Total Students</span>
                <p className="text-xl font-semibold text-text-primary">{totals.students}</p>
              </div>
              <div>
                <span className="text-sm text-text-secondary">Paid</span>
                <p className="text-xl font-semibold text-status-paid">{totals.paid}</p>
              </div>
              <div>
                <span className="text-sm text-text-secondary">Partial</span>
                <p className="text-xl font-semibold text-status-partial">{totals.partial}</p>
              </div>
              <div>
                <span className="text-sm text-text-secondary">Unpaid</span>
                <p className="text-xl font-semibold text-status-unpaid">{totals.unpaid}</p>
              </div>
              <div>
                <span className="text-sm text-text-secondary">Total Outstanding</span>
                <p className="text-xl font-semibold text-status-unpaid">
                  {formatCurrency(totals.outstanding)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Session:</span>
              <span className="font-medium text-text-primary">
                {sessions.find((s) => s.id === selectedSession)?.name || currentSessionName}
              </span>
              {sessions.find((s) => s.id === selectedSession)?.is_current && (
                <span className="badge-info text-xs">Current</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-text-secondary" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search classes..."
          className="input pl-9"
        />
      </div>

      {/* Class Cards Grid */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No classes found</h3>
          <p className="text-sm text-text-secondary mt-1">
            {searchQuery
              ? `No classes matching "${searchQuery}"`
              : 'No classes with fee structures in this session'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClasses.map((cls) => (
            <ClassCard
              key={cls.class_id}
              classData={cls}
              onClick={() => navigate(`/admin/payment-status/${cls.class_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;