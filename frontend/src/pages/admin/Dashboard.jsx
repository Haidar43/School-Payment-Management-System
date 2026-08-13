import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboard } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  Users,
  UserCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronRight,
  Download,
  Printer,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/format';
import StatCard from '../../components/dashboard/StatCard';
import PaymentChart from '../../components/dashboard/PaymentChart';
import RecentPayments from '../../components/dashboard/RecentPayments';
import ClassSummaryList from '../../components/dashboard/ClassSummaryList';
import Spinner from '../../components/common/Spinner';

const Dashboard = () => {
  const { user } = useAuth();
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
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
    current_session,
    total_students,
    total_parents,
    total_collected,
    total_outstanding,
    paid_students,
    partial_students,
    unpaid_students,
    defaulters,
    recent_payments,
    class_summary,
  } = dashboardData;

  // Calculate collection rate
  const totalFee = total_collected + total_outstanding;
  const collectionRate = totalFee > 0 ? (total_collected / totalFee) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.first_name}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here's your school's payment overview for {current_session || 'current session'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('Export feature coming soon!')}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => window.print()}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={total_students}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Parents"
          value={total_parents}
          icon={UserCircle}
          color="primary"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(total_collected)}
          icon={CreditCard}
          color="accent"
        />
        <StatCard
          title="Collection Rate"
          value={`${collectionRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="accent"
          subtitle={`${formatCurrency(total_outstanding)} outstanding`}
        />
      </div>

      {/* Payment Status Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Payment Overview</h2>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-status-paid"></span>
              <span className="text-text-secondary">Paid ({paid_students})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-status-partial"></span>
              <span className="text-text-secondary">Partial ({partial_students})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-status-unpaid"></span>
              <span className="text-text-secondary">Unpaid ({unpaid_students})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>
              <span className="text-text-secondary font-medium text-status-unpaid">
                Defaulters ({defaulters})
              </span>
            </div>
          </div>
        </div>
        <PaymentChart
          paid={paid_students}
          partial={partial_students}
          unpaid={unpaid_students}
          total={paid_students + partial_students + unpaid_students}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Class Summary */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Classes with Outstanding Payments
              </h2>
              <button
                onClick={() => navigate('/admin/payment-status')}
                className="text-sm text-accent hover:text-accent-light font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <ClassSummaryList classes={class_summary} />
          </div>
        </div>

        {/* Right Column - Recent Payments */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Recent Payments
              </h2>
              <button
                onClick={() => navigate('/admin/payments')}
                className="text-sm text-accent hover:text-accent-light font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <RecentPayments payments={recent_payments} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => navigate('/admin/payments/record')}
            className="p-4 text-left border border-border rounded-sm hover:bg-background transition-colors"
          >
            <CreditCard className="w-5 h-5 text-accent mb-2" />
            <p className="text-sm font-medium text-text-primary">Record Payment</p>
          </button>
          <button
            onClick={() => navigate('/admin/students')}
            className="p-4 text-left border border-border rounded-sm hover:bg-background transition-colors"
          >
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium text-text-primary">Register Student</p>
          </button>
          <button
            onClick={() => navigate('/admin/parents')}
            className="p-4 text-left border border-border rounded-sm hover:bg-background transition-colors"
          >
            <UserCircle className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium text-text-primary">Register Parent</p>
          </button>
          <button
            onClick={() => navigate('/admin/sessions')}
            className="p-4 text-left border border-border rounded-sm hover:bg-background transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium text-text-primary">Create Session</p>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="p-4 text-left border border-border rounded-sm hover:bg-background transition-colors"
          >
            <TrendingDown className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium text-text-primary">View Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;