import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiEye, FiEyeOff, FiUser, FiMail, FiLock } from 'react-icons/fi';

const Profile = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const newPassword = watch('newPassword');

  // Fetch user profile
  const { data: profileData, isLoading } = useQuery(
    'userProfile',
    () => authAPI.get('/auth/profile'),
    {
      onSuccess: (data) => {
        const user = data.data.user;
        if (user) {
          register('name', { value: user.name });
          register('email', { value: user.email });
        }
      }
    }
  );

  // Update profile mutation
  const updateMutation = useMutation(
    (data) => authAPI.put('/auth/profile', data),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        queryClient.invalidateQueries('userProfile');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  // Change password mutation
  const passwordMutation = useMutation(
    (data) => authAPI.put('/change-password', data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        // Reset password form
        document.getElementById('passwordForm').reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    }
  );

  const onSubmitProfile = (data) => {
    updateMutation.mutate(data);
  };

  const onSubmitPassword = (data) => {
    passwordMutation.mutate(data);
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
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your personal information and account settings.</p>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className={`form-input pl-10 ${errors.name ? 'error' : ''}`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`form-input pl-10 ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

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
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
        </div>
        <div className="card-body">
          <form id="passwordForm" onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div>
              <label className="form-label">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('currentPassword', { required: 'Current password is required' })}
                  type={showCurrentPassword ? 'text' : 'password'}
                  className={`form-input pl-10 pr-10 ${errors.currentPassword ? 'error' : ''}`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="form-error">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and number'
                    }
                  })}
                  type={showNewPassword ? 'text' : 'password'}
                  className={`form-input pl-10 pr-10 ${errors.newPassword ? 'error' : ''}`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="form-error">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === newPassword || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordMutation.isLoading}
                className="btn btn-primary"
              >
                {passwordMutation.isLoading ? (
                  <>
                    <div className="loading"></div>
                    Changing...
                  </>
                ) : (
                  <>
                    <FiSave className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Created:</span>
              <span className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Login:</span>
              <span className="font-medium">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email Verified:</span>
              <span className={`font-medium ${user?.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                {user?.isEmailVerified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
