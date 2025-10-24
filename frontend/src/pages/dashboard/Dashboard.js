import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { invoiceAPI } from '../../services/api';
import { FiPlus, FiFileText, FiDollarSign, FiClock, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

const Dashboard = () => {
  // Fetch invoice stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'invoiceStats',
    () => invoiceAPI.getInvoiceStats('30d'),
    {
      onError: (error) => {
        toast.error('Failed to load dashboard stats');
      }
    }
  );

  // Fetch recent invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery(
    'recentInvoices',
    () => invoiceAPI.getInvoices({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    {
      onError: (error) => {
        toast.error('Failed to load recent invoices');
      }
    }
  );

  const stats = statsData?.data?.stats || {};
  const invoices = invoicesData?.data?.invoices || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
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

  if (statsLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your invoices.</p>
        </div>
        <Link
          to="/invoices/new"
          className="btn btn-primary hover-lift self-start sm:self-auto"
        >
          <FiPlus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="card hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiDollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover-lift animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FiClock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover-lift animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiAlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <Link
              to="/invoices"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="card-body p-0">
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No invoices yet</p>
              <Link
                to="/invoices/new"
                className="btn btn-primary mt-4"
              >
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(invoice.issueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.client?.name || 'N/A'}</div>
                        {invoice.client.email && (
                          <div className="text-sm text-gray-500">{invoice.client.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          <span className="mr-1">{getStatusIcon(invoice.status)}</span>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
