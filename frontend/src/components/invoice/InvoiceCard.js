import React from 'react';
import { Link } from 'react-router-dom';
import { FiEdit, FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import StatusBadge from '../common/StatusBadge';

const InvoiceCard = ({ invoice, onDelete }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="card hover-lift">
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
            <p className="text-sm text-gray-500">{formatDate(invoice.issueDate)}</p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="space-y-2 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-900">{invoice.client?.name || 'N/A'}</p>
            {invoice.client.email && (
              <p className="text-sm text-gray-500">{invoice.client.email}</p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Due Date:</span>
            <span className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</span>
          </div>
        </div>

        <div className="flex space-x-2 pt-4 border-t border-gray-200">
          <Link
            to={`/invoices/${invoice._id}`}
            className="flex-1 btn btn-outline btn-sm text-center"
          >
            <FiEye className="h-4 w-4 mr-1" />
            View
          </Link>
          <Link
            to={`/invoices/${invoice._id}/edit`}
            className="flex-1 btn btn-outline btn-sm text-center"
          >
            <FiEdit className="h-4 w-4 mr-1" />
            Edit
          </Link>
          <button
            onClick={() => onDelete(invoice._id)}
            className="btn btn-danger btn-sm"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;
