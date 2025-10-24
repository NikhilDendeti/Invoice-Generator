import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave } from 'react-icons/fi';

const Settings = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Fetch user profile
  const { data: profileData, isLoading } = useQuery(
    'userProfile',
    () => authAPI.get('/auth/profile'),
    {
      onSuccess: (data) => {
        // Set form values when data is loaded
        const user = data.data.user;
        if (user) {
          Object.keys(user).forEach(key => {
            if (user[key] && typeof user[key] === 'object') {
              Object.keys(user[key]).forEach(subKey => {
                register(`${key}.${subKey}`, { value: user[key][subKey] });
              });
            } else {
              register(key, { value: user[key] });
            }
          });
        }
      }
    }
  );

  // Update profile mutation
  const updateMutation = useMutation(
    (data) => authAPI.put('/auth/profile', data),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully');
        queryClient.invalidateQueries('userProfile');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update settings');
      }
    }
  );

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  const user = profileData?.data?.user;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <label className="form-label">Company Name</label>
                <input
                  {...register('company.name')}
                  className="form-input"
                  placeholder="Your company name"
                />
              </div>
              
              <div>
                <label className="form-label">Address</label>
                <textarea
                  {...register('company.address')}
                  className="form-input"
                  rows="3"
                  placeholder="Company address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    {...register('company.phone')}
                    className="form-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="form-label">GST Number</label>
                  <input
                    {...register('company.gst')}
                    className="form-input"
                    placeholder="GST number"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Settings</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Currency</label>
                  <select {...register('settings.currency')} className="form-input">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Default Tax Rate (%)</label>
                  <input
                    {...register('settings.defaultTax', { min: 0, max: 100 })}
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Invoice Prefix</label>
                  <input
                    {...register('settings.invoicePrefix')}
                    className="form-input"
                    placeholder="INV"
                  />
                </div>
                
                <div>
                  <label className="form-label">Numbering Style</label>
                  <select {...register('settings.invoiceNumbering')} className="form-input">
                    <option value="sequential">Sequential</option>
                    <option value="year-based">Year-based</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isLoading}
            className="btn btn-primary"
          >
            {updateMutation.isLoading ? (
              <>
                <div className="loading"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
