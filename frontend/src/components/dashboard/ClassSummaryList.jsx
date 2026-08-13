import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const ClassSummaryList = ({ classes }) => {
  const navigate = useNavigate();

  if (!classes || classes.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p className="text-sm">No classes with outstanding payments</p>
      </div>
    );
  }

  // Sort by outstanding amount (highest first)
  const sortedClasses = [...classes].sort((a, b) => b.outstanding - a.outstanding);

  return (
    <div className="space-y-2">
      {sortedClasses.map((cls) => (
        <button
          key={cls.class_id}
          onClick={() => navigate(`/admin/payment-status/${cls.class_id}`)}
          className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-background transition-colors border border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-primary/5 flex items-center justify-center text-primary font-semibold text-sm">
              {cls.class_name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">{cls.class_name}</p>
              <p className="text-xs text-text-secondary">
                {cls.students} students • {formatCurrency(cls.fee)} fee
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-status-paid"></span>
                <span className="text-xs text-text-secondary">{cls.paid} paid</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-status-partial"></span>
                <span className="text-xs text-text-secondary">{cls.partial} partial</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-status-unpaid"></span>
                <span className="text-xs text-text-secondary">{cls.unpaid} unpaid</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-status-unpaid">
                {formatCurrency(cls.outstanding)}
              </p>
              <p className="text-xs text-text-secondary">outstanding</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default ClassSummaryList;