import React from 'react';

const Badge = ({ status, children, className = '' }) => {
  const statusMap = {
    paid: 'badge-paid',
    partial: 'badge-partial',
    unpaid: 'badge-unpaid',
    info: 'badge-info',
  };

  const badgeClass = statusMap[status] || 'badge-info';

  return <span className={`${badgeClass} ${className}`}>{children}</span>;
};

export default Badge;