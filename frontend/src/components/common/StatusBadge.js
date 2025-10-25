import React from 'react';

const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✓',
          label: 'Paid'
        };
      case 'sent':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '📤',
          label: 'Sent'
        };
      case 'draft':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '📝',
          label: 'Draft'
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌',
          label: 'Cancelled'
        };
      case 'overdue':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: '⚠️',
          label: 'Overdue'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '📄',
          label: status || 'Unknown'
        };
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.color}
        ${sizeClasses[size]}
        ${className}
        hover-lift-enhanced status-indicator
      `}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
