import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const ClassCard = ({ classData, onClick }) => {
  const {
    class_name,
    students,
    paid,
    partial,
    unpaid,
    outstanding,
    fee,
  } = classData;

  // Calculate percentages
  const paidPercentage = students > 0 ? (paid / students) * 100 : 0;
  const partialPercentage = students > 0 ? (partial / students) * 100 : 0;
  const unpaidPercentage = students > 0 ? (unpaid / students) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="card hover:border-accent transition-colors duration-200 text-left w-full group"
    >
      {/* Class Name */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-text-primary">{class_name}</h3>
        <div className="w-8 h-8 rounded-sm bg-primary/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors" />
        </div>
      </div>

      {/* Students Count */}
      <p className="text-sm text-text-secondary mb-3">
        {students} student{students !== 1 ? 's' : ''}
      </p>

      {/* Status Bars */}
      <div className="space-y-2 mb-3">
        {/* Paid Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary w-12">Paid</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-status-paid rounded-full transition-all duration-500"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-text-primary w-8 text-right">
            {paid}
          </span>
        </div>

        {/* Partial Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary w-12">Partial</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-status-partial rounded-full transition-all duration-500"
              style={{ width: `${partialPercentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-text-primary w-8 text-right">
            {partial}
          </span>
        </div>

        {/* Unpaid Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary w-12">Unpaid</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-status-unpaid rounded-full transition-all duration-500"
              style={{ width: `${unpaidPercentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-text-primary w-8 text-right">
            {unpaid}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <p className="text-xs text-text-secondary">Fee</p>
          <p className="text-sm font-medium text-text-primary">{formatCurrency(fee)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary">Outstanding</p>
          <p className="text-sm font-medium text-status-unpaid">
            {formatCurrency(outstanding)}
          </p>
        </div>
      </div>
    </button>
  );
};

export default ClassCard;