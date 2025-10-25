import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { invoiceAPI } from '../../services/api';
import { FiPlus, FiFileText, FiDollarSign, FiClock, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import './Dashboard.css';

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

  const stats = statsData?.stats || {};
  const invoices = invoicesData?.invoices || [];

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
    <div className="dashboard-container">
      {/* Enhanced Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening with your invoices.</p>
        </div>
        <div className="dashboard-actions">
          <Link
            to="/invoices/new"
            className="new-invoice-btn"
          >
            <FiPlus className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card-content">
            <div className="stat-icon blue">
              <FiFileText className="h-6 w-6 text-white" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Invoices</p>
              <p className="stat-value">{stats.totalInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ animationDelay: '0.2s' }}>
          <div className="stat-card-content">
            <div className="stat-icon green">
              <FiDollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ animationDelay: '0.3s' }}>
          <div className="stat-card-content">
            <div className="stat-icon yellow">
              <FiClock className="h-6 w-6 text-white" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Pending</p>
              <p className="stat-value">{formatCurrency(stats.pendingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ animationDelay: '0.4s' }}>
          <div className="stat-card-content">
            <div className="stat-icon red">
              <FiAlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Overdue</p>
              <p className="stat-value">{stats.overdueCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="recent-invoices">
        <div className="recent-invoices-header">
          <h3 className="recent-invoices-title">Recent Invoices</h3>
          <Link
            to="/invoices"
            className="view-all-link"
          >
            View all
          </Link>
        </div>
        {invoices.length === 0 ? (
          <div className="empty-state">
            <FiFileText className="empty-state-icon" />
            <h3 className="empty-state-title">No invoices yet</h3>
            <p className="empty-state-description">Get started by creating your first invoice</p>
            <Link
              to="/invoices/new"
              className="new-invoice-btn"
            >
              <FiPlus className="h-4 w-4" />
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="invoice-table-container">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>
                      <div className="invoice-number">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="invoice-date">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="client-name">{invoice.client?.name || 'N/A'}</div>
                      {invoice.client.email && (
                        <div className="client-email">{invoice.client.email}</div>
                      )}
                    </td>
                    <td>
                      <div className="invoice-amount">
                        {formatCurrency(invoice.total)}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${invoice.status}`}>
                        <span className="mr-1">{getStatusIcon(invoice.status)}</span>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="due-date">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
