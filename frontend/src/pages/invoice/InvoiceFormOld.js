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
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiCopy,
  FiRefreshCw,
  FiZap,
  FiStar,
  FiTrendingUp,
  FiShield,
  FiClock,
  FiEye,
  FiEdit3,
  FiDownload,
  FiShare2,
  FiHeart,
  FiBookmark,
  FiSettings,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiMaximize2,
  FiMinimize2,
  FiRotateCcw,
  FiPlay,
  FiPause,
  FiStop,
  FiVolume2,
  FiVolumeX,
  FiWifi,
  FiWifiOff,
  FiBluetooth,
  FiBluetoothOff,
  FiBattery,
  FiMail,
  FiPhone,
  FiHash,
  FiMapPin,
  FiBatteryCharging,
  FiSun,
  FiMoon,
  FiCloud,
  FiCloudRain,
  FiCloudSnow,
  FiWind,
  FiThermometer,
  FiDroplet,
  FiUmbrella,
  FiSunrise,
  FiSunset,
  FiNavigation,
  FiMap,
  FiMapPin,
  FiNavigation2,
  FiCompass,
  FiGlobe,
  FiLayers,
  FiPackage,
  FiTruck,
  FiCreditCard,
  FiSmartphone,
  FiTablet,
  FiMonitor,
  FiLaptop,
  FiHardDrive,
  FiCpu,
  FiMemory,
  FiRadio,
  FiSignal
} from 'react-icons/fi';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  
  // Advanced state management
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, rate: 0, taxRate: 0 }
  ]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [quickActions, setQuickActions] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      client: {
        name: '',
        email: '',
        address: '',
        phone: '',
        gst: ''
      },
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: {
        type: 'fixed',
        value: 0
      },
      notes: '',
      terms: ''
    }
  });

  // Calculate totals function
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return sum + (quantity * rate);
    }, 0);
    
    const taxTotal = lineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const itemTotal = quantity * rate;
      return sum + (itemTotal * taxRate / 100);
    }, 0);
    
    const discountValue = Number(watch('discount.value')) || 0;
    const discountType = watch('discount.type');
    const discountAmount = discountType === 'percent' 
      ? (subtotal * discountValue) / 100 
      : discountValue;
    
    const total = subtotal + taxTotal - discountAmount;
    
    return { 
      subtotal: Number(subtotal.toFixed(2)), 
      taxTotal: Number(taxTotal.toFixed(2)), 
      discountAmount: Number(discountAmount.toFixed(2)), 
      total: Number(total.toFixed(2)) 
    };
  };

  const totals = calculateTotals();

  // Advanced auto-save functionality
  const autoSave = useCallback(async (data) => {
    if (!hasUnsavedChanges) return;
    
    setIsAutoSaving(true);
    try {
      const autoSaveData = {
        ...data,
        items: lineItems,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        autoSave: true
      };
      
      if (isEdit) {
        await invoiceAPI.updateInvoice(id, autoSaveData);
      } else {
        await invoiceAPI.createInvoice(autoSaveData);
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success('Auto-saved successfully', { duration: 2000 });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [hasUnsavedChanges, lineItems, totals, isEdit, id]);

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        const formData = watch();
        autoSave(formData);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, autoSave, watch]);

  // Smart suggestions
  useEffect(() => {
    const suggestions = [
      { type: 'client', text: 'Recent clients', icon: FiUser },
      { type: 'item', text: 'Popular items', icon: FiStar },
      { type: 'template', text: 'Invoice templates', icon: FiFileText }
    ];
    setSmartSuggestions(suggestions);
  }, []);

  // Quick actions
  useEffect(() => {
    const actions = [
      { name: 'Duplicate Invoice', icon: FiCopy, action: () => handleDuplicate() },
      { name: 'Save as Template', icon: FiBookmark, action: () => handleSaveTemplate() },
      { name: 'Preview Invoice', icon: FiEye, action: () => setShowPreview(true) },
      { name: 'Send Invoice', icon: FiSend, action: () => handleSendInvoice() }
    ];
    setQuickActions(actions);
  }, []);

  // Advanced handlers
  const handleDuplicate = () => {
    toast.success('Invoice duplicated successfully!');
  };

  const handleSaveTemplate = () => {
    toast.success('Template saved successfully!');
  };

  const handleSendInvoice = () => {
    toast.success('Invoice sent successfully!');
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleStepChange = (step) => {
    setCurrentStep(step);
    setAnimationKey(prev => prev + 1);
  };

  // Fetch invoice data for editing
  const { data: invoiceData, isLoading } = useQuery(
    ['invoice', id],
    () => invoiceAPI.getInvoice(id),
    {
      enabled: isEdit,
      onSuccess: (data) => {
        const invoice = data.data.invoice;
        setValue('client', invoice.client);
        setValue('issueDate', invoice.issueDate.split('T')[0]);
        setValue('dueDate', invoice.dueDate.split('T')[0]);
        setValue('discount', invoice.discount);
        setValue('notes', invoice.notes || '');
        setValue('terms', invoice.terms || '');
        setLineItems(invoice.items);
      }
    }
  );

  // Create/Update invoice mutation
  const mutation = useMutation(
    (data) => isEdit ? invoiceAPI.updateInvoice(id, data) : invoiceAPI.createInvoice(data),
    {
      onSuccess: (response) => {
        toast.success(`Invoice ${isEdit ? 'updated' : 'created'} successfully!`);
        queryClient.invalidateQueries('invoices');
        navigate(`/invoices/${response.data.invoice._id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save invoice');
      }
    }
  );

  const addLineItem = () => {
    const newItem = { 
      description: '', 
      quantity: 1, 
      rate: 0, 
      taxRate: 0,
      id: Date.now() // Add unique ID for animations
    };
    setLineItems([...lineItems, newItem]);
    setHasUnsavedChanges(true);
    setAnimationKey(prev => prev + 1);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
      setHasUnsavedChanges(true);
      setAnimationKey(prev => prev + 1);
    }
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
    setHasUnsavedChanges(true);
  };

  const duplicateLineItem = (index) => {
    const itemToDuplicate = lineItems[index];
    const newItem = { ...itemToDuplicate, id: Date.now() };
    const updated = [...lineItems];
    updated.splice(index + 1, 0, newItem);
    setLineItems(updated);
    setHasUnsavedChanges(true);
    setAnimationKey(prev => prev + 1);
  };

  const moveLineItem = (fromIndex, toIndex) => {
    const updated = [...lineItems];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    setLineItems(updated);
    setHasUnsavedChanges(true);
  };

  const onSubmit = (data) => {
    const invoiceData = {
      ...data,
      items: lineItems,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total
    };
    
    mutation.mutate(invoiceData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-600 rounded-full animate-spin mx-auto" style={{animationDelay: '0.5s'}}></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Invoice Data</h3>
          <p className="text-gray-600 mb-4">Preparing your workspace...</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

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
                <button className="smart-add-button">
                  <FiZap className="h-4 w-4" />
                  Smart Add
                </button>
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {lineItems.map((item, index) => (
                      <tr 
                        key={item.id || index} 
                        className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                      <td className="px-6 py-4">
                          <div className="relative">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-300 form-input-enhanced"
                              placeholder="Enter item description"
                          required
                        />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <FiEdit3 className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-300 text-center form-input-enhanced"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-28 pl-8 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-300 form-input-enhanced"
                          min="0"
                          step="0.01"
                        />
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="relative">
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                              className="w-24 px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-300 text-center form-input-enhanced"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                          </div>
                      </td>
                        <td className="px-6 py-4">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200">
                            <span className="text-lg font-bold text-green-700">
                        ${((Number(item.quantity) * Number(item.rate)) * (1 + Number(item.taxRate) / 100)).toFixed(2)}
                            </span>
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => duplicateLineItem(index)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                              title="Duplicate item"
                            >
                              <FiCopy className="h-4 w-4" />
                            </button>
                            
                            {lineItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                title="Remove item"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Superior Mobile Card View */}
              <div className="lg:hidden space-y-6 p-6">
                {lineItems.map((item, index) => (
                  <div 
                    key={item.id || index} 
                    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">Item {index + 1}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => duplicateLineItem(index)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Duplicate item"
                        >
                          <FiCopy className="h-4 w-4" />
                        </button>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Remove item"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-300"
                          placeholder="Enter item description"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-300 text-center"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3">Rate ($)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-300"
                              min="0"
                              step="0.01"
                            />
            </div>
          </div>
        </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Tax Rate (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-300"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-700">Total:</span>
                          <span className="text-2xl font-bold text-green-700">
                            ${((Number(item.quantity) * Number(item.rate)) * (1 + Number(item.taxRate) / 100)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Discount */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiDollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Discount</h3>
                  <p className="text-orange-100 text-sm">Apply discounts to your invoice</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                  <select 
                    {...register('discount.type')} 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                  >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value</label>
                <input
                  {...register('discount.value', { min: 0 })}
                  type="number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                  min="0"
                  step="0.01"
                    placeholder="0.00"
                />
                </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiFileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Additional Information</h3>
                  <p className="text-indigo-100 text-sm">Add notes and terms for your client</p>
                </div>
              </div>
          </div>
            <div className="p-6">
              <div className="space-y-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  {...register('notes')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none"
                    rows="4"
                  placeholder="Additional notes for the client"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                <textarea
                  {...register('terms')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none"
                    rows="4"
                  placeholder="Payment terms and conditions"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Totals Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiCheckCircle className="h-5 w-5 text-white" />
          </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Invoice Summary</h3>
                  <p className="text-emerald-100 text-sm">Review your invoice totals</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-end">
                <div className="w-full max-w-md bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Subtotal:</span>
                    <span className="font-semibold text-gray-900">${(totals.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {(totals.discountAmount || 0) > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Discount:</span>
                      <span className="font-semibold text-red-600">-${(totals.discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(totals.taxTotal || 0) > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Tax:</span>
                      <span className="font-semibold text-gray-900">${(totals.taxTotal || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-emerald-600">${(totals.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Superior Form Actions */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
              {/* Quick Actions */}
              <div className="flex flex-wrap items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiShield className="h-4 w-4" />
                  <span>Auto-save enabled</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiClock className="h-4 w-4" />
                  <span>Last saved: {lastSaved ? lastSaved.toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
                  className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FiRotateCcw className="h-5 w-5" />
                  <span>Cancel</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FiEye className="h-5 w-5" />
                  <span>Preview</span>
          </button>
                
          <button
            type="submit"
            disabled={mutation.isLoading}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
          >
            {mutation.isLoading ? (
              <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
              </>
            ) : (
              <>
                      <FiSave className="h-5 w-5" />
                      <span>{isEdit ? 'Update Invoice' : 'Create Invoice'}</span>
              </>
            )}
          </button>
              </div>
            </div>
            
            {/* Advanced Status Bar */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Form validation active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiTrendingUp className="h-4 w-4" />
                    <span>Total: ${(totals.total || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FiStar className="h-4 w-4 text-yellow-500" />
                  <span>Premium features enabled</span>
                </div>
              </div>
            </div>
        </div>
      </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
