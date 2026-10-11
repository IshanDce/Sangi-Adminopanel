import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = (status || '').toLowerCase().trim();

  let className = 'badge badge-neutral';
  let label = status;

  switch (norm) {
    case 'approved':
    case 'completed':
    case 'paymentcompleted':
    case 'paymentsuccess':
    case 'active':
      className = 'badge badge-success';
      label = norm === 'paymentsuccess' ? 'Payment Confirmed' : status;
      break;

    case 'pending':
    case 'requested':
    case 'paymentpending':
    case 'pendingpayment':
      className = 'badge badge-warning';
      label = norm === 'pendingpayment' ? 'Awaiting Payment' : status;
      break;

    case 'ongoing':
    case 'accepted':
    case 'servicecompleted':
      className = 'badge badge-info';
      break;

    case 'rejected':
    case 'declined':
    case 'cancelled':
    case 'blocked':
    case 'failed':
      className = 'badge badge-danger';
      break;

    case 'not_submitted':
      className = 'badge badge-neutral';
      label = 'Not Submitted';
      break;

    default:
      className = 'badge badge-neutral';
  }

  return (
    <span className={className} style={{ textTransform: 'capitalize' }}>
      ● {label}
    </span>
  );
};
