import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboard } from '../../api/parent';
import toast from 'react-hot-toast';
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Wallet,
  LogOut,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

const ParentDashboard = () => {
  const { user, logout } = useAuth(); // ADDED: logout from useAuth
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary">No data available</h3>
        <p className="text-sm text-text-secondary mt-1">
          Unable to load dashboard data. Please try again.
        </p>
      </div>
    );
  }

  const {
    welcome,
    children_count,
    total_outstanding,
    children,
    recent_payments,
  } = dashboardData;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome with Logout */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
            {welcome}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here's an overview of your children's payment status.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-text-secondary hover:text-status-unpaid flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 rounded-md bg-primary/10 flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary">Your Children</p>
              <p className="text-xl sm:text-2xl font-semibold text-text-primary">{children_count}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 rounded-md bg-status-unpaid/10 flex-shrink-0">
              <Wallet className="w-5 h-5 text-status-unpaid" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary">Total Outstanding</p>
              <p className={`text-xl sm:text-2xl font-semibold truncate ${total_outstanding > 0 ? 'text-status-unpaid' : 'text-status-paid'}`}>
                {formatCurrency(total_outstanding)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Children List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-secondary">Your Children</h2>
          <button
            onClick={() => navigate('/parent/children')}
            className="text-sm text-accent hover:text-accent-light font-medium inline-flex items-center gap-1 flex-shrink-0"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {children.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">No children registered</p>
        ) : (
          <div className="space-y-3">
            {children.slice(0, 5).map((child) => {
              const status = child.status || 'NOT_ENROLLED';
              const badge = getStatusBadge(status);
              const balance = child.balance || 0;

              return (
                <button
                  key={child.student.id}
                  onClick={() => navigate(`/parent/children/${child.student.id}`)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-sm hover:bg-background transition-colors border border-border gap-3 sm:gap-0"
                >
                  {/* Left - Student Info */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-sm bg-primary/5 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                      {child.student.first_name.charAt(0)}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {child.student.first_name} {child.student.last_name}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {child.class?.name || 'Not enrolled'}
                      </p>
                    </div>
                  </div>

                  {/* Right - Payment Info + Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-none">
                      <div className="text-right">
                        <p className="text-sm font-medium text-text-primary">
                          {formatCurrency(child.paid || 0)}
                        </p>
                        <p className="text-xs text-text-secondary">Paid</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${balance > 0 ? 'text-status-unpaid' : 'text-status-paid'}`}>
                          {formatCurrency(balance)}
                        </p>
                        <p className="text-xs text-text-secondary">Balance</p>
                      </div>
                      <span className={`${badge.className} flex-shrink-0`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Pay Now Button - Responsive */}
                    {balance > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/parent/pay/${child.student.id}`);
                        }}
                        className="btn-accent text-xs py-1.5 px-3 rounded-sm flex-shrink-0 w-full sm:w-auto"
                      >
                        Pay Now
                      </button>
                    )}

                    <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0 hidden sm:block" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Payments */}
      {recent_payments && recent_payments.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-text-secondary">Recent Payments</h2>
            <button
              onClick={() => navigate('/parent/payments')}
              className="text-sm text-accent hover:text-accent-light font-medium inline-flex items-center gap-1 flex-shrink-0"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recent_payments.slice(0, 5).map((payment, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border last:border-0 gap-2 sm:gap-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {payment.student}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-secondary">{payment.receipt}</span>
                    <span className="text-xs text-text-secondary">•</span>
                    <span className="text-xs text-text-secondary">{formatDate(payment.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-text-primary">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className="text-xs text-text-secondary">{payment.method}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;