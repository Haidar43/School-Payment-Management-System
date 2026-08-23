import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChildren } from '../../api/parent';
import toast from 'react-hot-toast';
import {
  Users,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import { formatCurrency, getStatusBadge } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

const Children = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await getChildren();
      const data = response.data || {};
      setChildren(data.children || []);
      setTotalOutstanding(data.total_outstanding || 0);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to load children');
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

  return (
    <div className="space-y-6">
        {/* Back Button */}
      <button
        onClick={() => navigate('/parent/dashboard')}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Children</h1>
          <p className="text-sm text-text-secondary mt-1">
            View payment status for all your children
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card py-2 px-4">
            <p className="text-xs text-text-secondary">Total Outstanding</p>
            <p className={`text-lg font-semibold ${totalOutstanding > 0 ? 'text-status-unpaid' : 'text-status-paid'}`}>
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
        </div>
      </div>

      {/* Children List */}
      {children.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No children registered</h3>
          <p className="text-sm text-text-secondary mt-1">
            Contact your school to add your children to the system.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => {
            const student = child.student;
            const status = child.status || 'NOT_ENROLLED';
            const badge = getStatusBadge(status);
            const balance = child.balance || 0;
            const paid = child.paid || 0;
            const fee = child.fee || 0;

            return (
              <button
                key={student.id}
                onClick={() => navigate(`/parent/children/${student.id}`)}
                className="card hover:border-accent transition-colors text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {student.first_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {child.class?.name || 'Not enrolled'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-secondary">
                          {child.session?.name || '-'}
                        </span>
                        <span className={badge.className}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {balance > 0 && (
                  <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/parent/pay/${child.student.id}`);
                        }}
                        className="btn-accent text-xs py-1.5 px-3 rounded-sm"
                      >
                        Pay Now
                      </button>
                    )}
                  <ChevronRight className="w-5 h-5 text-text-secondary" />
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-text-secondary">School Fee</p>
                    <p className="text-sm font-medium text-text-primary">{formatCurrency(fee)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Amount Paid</p>
                    <p className="text-sm font-medium text-status-paid">{formatCurrency(paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Balance</p>
                    <p className={`text-sm font-medium ${balance > 0 ? 'text-status-unpaid' : 'text-status-paid'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-paid rounded-full transition-all"
                        style={{ width: `${fee > 0 ? (paid / fee) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary">
                      {fee > 0 ? Math.round((paid / fee) * 100) : 0}% paid
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Children;