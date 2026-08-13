export const formatCurrency = (amount) => {
  const naira = amount / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatAdmissionNumber = (num) => {
  return num?.toUpperCase() || '';
};

export const getStatusBadge = (status) => {
  const map = {
    'PAID': { label: 'Paid', className: 'badge-paid' },
    'PARTIAL': { label: 'Partial', className: 'badge-partial' },
    'UNPAID': { label: 'Unpaid', className: 'badge-unpaid' },
    'NOT_ENROLLED': { label: 'Not Enrolled', className: 'badge-info' },
  };
  return map[status] || { label: status, className: 'badge-info' };
};