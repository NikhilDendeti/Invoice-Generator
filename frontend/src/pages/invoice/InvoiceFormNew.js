import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { invoiceAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './InvoiceForm.css';
import { 
  FiPlus, 
  FiTrash2, 
  FiSave, 
  FiSend, 
  FiUser, 
  FiCalendar, 
  FiDollarSign, 
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiDownload,
  FiMaximize2,
  FiMinimize2,
  FiMail,
  FiPhone,
  FiHash,
  FiMapPin,
} from 'react-icons/fi';

const InvoiceFormNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [lineItems, setLineItems] = useState([
    { id: 1, description: '', quantity: 1, rate: 0, taxRate: 0 }
  ]);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      client: {
        name: '',
        email: '',
        phone: '',
        gst: '',
        address: ''
      },
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lineItems: []
    }
  });

  // Auto-save functionality
  const autoSave = useCallback(async (data) => {
    if (!data.client?.name) return;
    
    setIsAutoSaving(true);
    try {
      // Simulate auto-save API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, []);

  // Watch form changes for auto-save
  const watchedFields = watch();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoSave(watchedFields);
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [watchedFields, autoSave]);

  // Fetch invoice for editing
  const { data: invoiceData, isLoading } = useQuery(
    ['invoice', id],
    () => invoiceAPI.get(`/invoices/${id}`),
    {
      enabled: isEdit,
      onSuccess: (data) => {
        const invoice = data.data.invoice;
        setValue('client', invoice.client);
        setValue('issueDate', invoice.issueDate);
        setValue('dueDate', invoice.dueDate);
        setLineItems(invoice.lineItems || []);
      }
    }
  );

  // Create/Update mutation
  const mutation = useMutation(
    (data) => isEdit ? invoiceAPI.put(`/invoices/${id}`, data) : invoiceAPI.post('/invoices', data),
    {
      onSuccess: (data) => {
        toast.success(isEdit ? 'Invoice updated successfully!' : 'Invoice created successfully!');
        queryClient.invalidateQueries('invoices');
        navigate('/invoices');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save invoice');
      }
    }
  );

  const addLineItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      rate: 0,
      taxRate: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index, field, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
  };

  const calculateLineTotal = (item) => {
    const subtotal = item.quantity * item.rate;
    const tax = subtotal * (item.taxRate / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalTax = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate * item.taxRate / 100), 0);
    const total = subtotal + totalTax;
    return { subtotal, totalTax, total };
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const onSubmit = (data) => {
    const totals = calculateTotals();
    const invoiceData = {
      ...data,
      lineItems,
      subtotal: totals.subtotal,
      totalTax: totals.totalTax,
      total: totals.total,
      status: 'draft'
    };
    mutation.mutate(invoiceData);
  };

  if (isLoading) {
    return (
      <div className="invoice-form-container">
        <div className="invoice-form-content">
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner"></div>
            <span className="ml-3">Loading invoice...</span>
          </div>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className={`invoice-form-container ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Animated background */}
      <div className="invoice-form-background">
        <div className="invoice-form-orb invoice-form-orb-1"></div>
        <div className="invoice-form-orb invoice-form-orb-2"></div>
        <div className="invoice-form-orb invoice-form-orb-3"></div>
      </div>

      <div className="invoice-form-content">
        {/* Enhanced Header */}
        <div className="invoice-form-header">
          <div className="invoice-form-header-content">
            <div className="invoice-form-title-section">
              <div className="invoice-form-icon">
                <FiFileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="invoice-form-title">
                  {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
                </h1>
                <p className="invoice-form-subtitle">
                  {isEdit ? 'Update invoice details and save changes' : 'Fill in the details to create a professional invoice'}
                </p>
              </div>
            </div>

            <div className="invoice-form-actions">
              {/* Auto-save indicator */}
              {isAutoSaving && (
                <div className="status-indicator auto-saving">
                  <div className="status-spinner"></div>
                  <span>Auto-saving...</span>
                </div>
              )}
              
              {lastSaved && !isAutoSaving && (
                <div className="status-indicator saved">
                  <FiCheckCircle className="h-4 w-4" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="action-buttons">
                <button
                  onClick={handleFullscreen}
                  className="action-button"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <FiMinimize2 className="h-5 w-5" /> : <FiMaximize2 className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="action-button"
                  title="Preview Invoice"
                >
                  <FiEye className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="action-button"
                  title="Print Invoice"
                >
                  <FiDownload className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
            
          {/* Enhanced Progress Steps */}
          <div className="progress-steps">
            {[
              { step: 1, label: 'Client Info', icon: FiUser, color: 'blue' },
              { step: 2, label: 'Items & Pricing', icon: FiDollarSign, color: 'purple' },
              { step: 3, label: 'Review & Save', icon: FiCheckCircle, color: 'green' }
            ].map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`progress-step ${
                  currentStep >= step.step 
                    ? currentStep > step.step ? 'completed' : 'active'
                    : 'pending'
                }`}>
                  <div className="progress-step-icon">
                    {currentStep > step.step ? (
                      <FiCheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span>{step.label}</span>
                </div>
                {index < 2 && (
                  <div className={`progress-connector ${
                    currentStep > step.step ? 'completed' : ''
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Client Information */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon blue">
                <FiUser className="h-6 w-6" />
              </div>
              <div>
                <h3 className="form-section-title">Client Information</h3>
                <p className="form-section-subtitle">Enter your client's details</p>
              </div>
            </div>
            <div className="form-section-content">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    <FiUser className="h-4 w-4" />
                    Client Name
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    {...register('client.name', { required: 'Client name is required' })}
                    className={`form-input ${errors.client?.name ? 'error' : ''}`}
                    placeholder="Enter client name"
                  />
                  {errors.client?.name && (
                    <div className="form-error">
                      <FiAlertCircle className="h-4 w-4" />
                      <span>{errors.client.name.message}</span>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <FiMail className="h-4 w-4" />
                    Email Address
                  </label>
                  <input
                    {...register('client.email')}
                    type="email"
                    className="form-input"
                    placeholder="client@example.com"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <FiPhone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <input
                    {...register('client.phone')}
                    className="form-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <FiHash className="h-4 w-4" />
                    GST Number
                  </label>
                  <input
                    {...register('client.gst')}
                    className="form-input"
                    placeholder="GST number"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <FiMapPin className="h-4 w-4" />
                    Address
                  </label>
                  <textarea
                    {...register('client.address')}
                    className="form-input form-textarea"
                    rows="4"
                    placeholder="Enter complete address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon green">
                <FiCalendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="form-section-title">Invoice Details</h3>
                <p className="form-section-subtitle">Set invoice dates and timeline</p>
              </div>
            </div>
            <div className="form-section-content">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    <FiCalendar className="h-4 w-4" />
                    Issue Date
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    {...register('issueDate', { required: 'Issue date is required' })}
                    type="date"
                    className={`form-input ${errors.issueDate ? 'error' : ''}`}
                  />
                  {errors.issueDate && (
                    <div className="form-error">
                      <FiAlertCircle className="h-4 w-4" />
                      <span>{errors.issueDate.message}</span>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <FiCalendar className="h-4 w-4" />
                    Due Date
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    {...register('dueDate', { required: 'Due date is required' })}
                    type="date"
                    className={`form-input ${errors.dueDate ? 'error' : ''}`}
                  />
                  {errors.dueDate && (
                    <div className="form-error">
                      <FiAlertCircle className="h-4 w-4" />
                      <span>{errors.dueDate.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="line-items-section">
            <div className="line-items-header">
              <div className="line-items-title-section">
                <div className="line-items-icon">
                  <FiDollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="line-items-title">Line Items</h3>
                  <p className="line-items-subtitle">Add products or services to your invoice</p>
                </div>
              </div>
              <div className="line-items-actions">
                <button
                  type="button"
                  onClick={addLineItem}
                  className="add-item-button"
                >
                  <FiPlus className="h-5 w-5" />
                  Add Item
                </button>
              </div>
            </div>
            
            <div className="line-items-table-container">
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Tax %</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="line-item-input"
                          placeholder="Enter item description"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="line-item-input"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="line-item-input"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="line-item-input"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <div className="line-item-total">
                          ${calculateLineTotal(item).toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <div className="line-item-actions">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="line-item-action delete"
                            disabled={lineItems.length === 1}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="totals-summary">
            <div className="totals-summary-header">
              <div className="totals-summary-icon">
                <FiDollarSign className="h-6 w-6" />
              </div>
              <div>
                <h3 className="totals-summary-title">Invoice Summary</h3>
                <p className="totals-summary-subtitle">Review your invoice totals</p>
              </div>
            </div>
            <div className="totals-summary-content">
              <div className="totals-summary-card">
                <div className="totals-summary-row">
                  <span className="totals-summary-label">Subtotal</span>
                  <span className="totals-summary-value">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="totals-summary-row">
                  <span className="totals-summary-label">Tax</span>
                  <span className="totals-summary-value">${totals.totalTax.toFixed(2)}</span>
                </div>
                <div className="totals-summary-row">
                  <span className="totals-summary-label">Total</span>
                  <span className="totals-summary-value totals-summary-total">${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <div className="form-actions-content">
              <div className="form-actions-info">
                <div className="form-actions-status">
                  <FiCheckCircle className="h-4 w-4 text-green-500" />
                  <span>Ready to save</span>
                </div>
              </div>
              <div className="form-actions-buttons">
                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="form-button cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="form-button submit"
                >
                  {mutation.isLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FiSave className="h-4 w-4" />
                      {isEdit ? 'Update Invoice' : 'Create Invoice'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceFormNew;
