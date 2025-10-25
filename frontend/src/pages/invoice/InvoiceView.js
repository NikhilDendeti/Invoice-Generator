import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { invoiceAPI, pdfAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiDownload, FiMail, FiArrowLeft } from 'react-icons/fi';

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch invoice data
  const { data, isLoading, error } = useQuery(
    ['invoice', id],
    () => invoiceAPI.getInvoice(id),
    {
      onError: (error) => {
        toast.error('Failed to load invoice');
      }
    }
  );

  // Delete invoice mutation
  const deleteMutation = useMutation(
    () => invoiceAPI.deleteInvoice(id),
    {
      onSuccess: () => {
        toast.success('Invoice deleted successfully');
        queryClient.invalidateQueries('invoices');
        navigate('/invoices');
      },
      onError: (error) => {
        toast.error('Failed to delete invoice');
      }
    }
  );

  // Update status mutation
  const statusMutation = useMutation(
    (status) => invoiceAPI.updateInvoiceStatus(id, status),
    {
      onSuccess: () => {
        toast.success('Invoice status updated');
        queryClient.invalidateQueries(['invoice', id]);
        queryClient.invalidateQueries('invoices');
      },
      onError: (error) => {
        toast.error('Failed to update status');
      }
    }
  );

  const invoice = data?.invoice;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'sent':
        return 'text-blue-600 bg-blue-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'sent':
        return '📤';
      case 'draft':
        return '📝';
      case 'cancelled':
        return '❌';
      default:
        return '📄';
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const response = await pdfAPI.generatePDF(id);
      if (response.data.success) {
        toast.success('PDF generated successfully');
        // Open PDF in new tab
        window.open(response.data.pdfUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await pdfAPI.downloadPDF(invoice.invoiceNumber + '.pdf');
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate();
    }
  };

  const handleStatusChange = (newStatus) => {
    if (window.confirm(`Are you sure you want to mark this invoice as ${newStatus}?`)) {
      statusMutation.mutate(newStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invoice not found</p>
        <Link to="/invoices" className="btn btn-primary mt-4">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/invoices')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="text-gray-600">Invoice Details</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
            <span className="mr-1">{getStatusIcon(invoice.status)}</span>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/invoices/${id}/edit`}
              className="btn btn-outline"
            >
              <FiEdit className="h-4 w-4" />
              Edit
            </Link>
            
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="btn btn-primary"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="loading"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FiDownload className="h-4 w-4" />
                  Generate PDF
                </>
              )}
            </button>
            
            <button
              onClick={handleDownloadPDF}
              className="btn btn-secondary"
            >
              <FiDownload className="h-4 w-4" />
              Download PDF
            </button>
            
            <button
              onClick={() => handleStatusChange('sent')}
              disabled={invoice.status === 'sent' || invoice.status === 'paid'}
              className="btn btn-success"
            >
              <FiMail className="h-4 w-4" />
              Mark as Sent
            </button>
            
            <button
              onClick={() => handleStatusChange('paid')}
              disabled={invoice.status === 'paid'}
              className="btn btn-success"
            >
              Mark as Paid
            </button>
            
            <button
              onClick={handleDelete}
              className="btn btn-danger"
            >
              <FiTrash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Bill To</h3>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">{invoice.client?.name || 'N/A'}</h4>
              {invoice.client.email && (
                <p className="text-gray-600">{invoice.client.email}</p>
              )}
              {invoice.client.phone && (
                <p className="text-gray-600">{invoice.client.phone}</p>
              )}
              {invoice.client.address && (
                <p className="text-gray-600 whitespace-pre-line">{invoice.client.address}</p>
              )}
              {invoice.client.gst && (
                <p className="text-gray-600">GST: {invoice.client.gst}</p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Information</h3>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${getStatusColor(invoice.status)} px-2 py-1 rounded`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.rate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.taxRate}%</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(item.quantity * item.rate * (1 + item.taxRate / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="card">
        <div className="card-body">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount.value > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Discount ({invoice.discount.type === 'percent' ? `${invoice.discount.value}%` : 'Fixed'}):
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(invoice.discount.type === 'percent' 
                      ? (invoice.subtotal * invoice.discount.value) / 100 
                      : invoice.discount.value)}
                  </span>
                </div>
              )}
              {invoice.taxTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{formatCurrency(invoice.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {invoice.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                  <p className="text-gray-600 whitespace-pre-line">{invoice.terms}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceView;
