import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiEye, FiEyeOff, FiUser, FiMail, FiLock } from 'react-icons/fi';
import './Profile.css';

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
      <div className="profile-loading">
        <div className="profile-loading-spinner"></div>
        <span>Loading profile...</span>
      </div>
    );
  }

  const user = profileData?.data?.user;

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-title">Profile</h1>
        <p className="profile-subtitle">Manage your personal information and account settings.</p>
      </div>

      {/* Profile Avatar Section */}
      <div className="profile-section">
        <div className="profile-section-header">
          <div className="profile-section-icon blue">
            <FiUser className="h-6 w-6" />
          </div>
          <div>
            <h3 className="profile-section-title">Profile Information</h3>
            <p className="profile-section-subtitle">Update your personal details</p>
          </div>
        </div>
        <div className="profile-section-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <div className="profile-avatar-info">
              <h3 className="profile-avatar-name">{user?.name || 'User'}</h3>
              <p className="profile-avatar-email">{user?.email || 'user@example.com'}</p>
              <div className="profile-avatar-actions">
                <button className="profile-avatar-button">
                  <FiUser className="h-4 w-4" />
                  Change Avatar
                </button>
                <button className="profile-avatar-button primary">
                  <FiSave className="h-4 w-4" />
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="profile-section">
        <div className="profile-section-header">
          <div className="profile-section-icon green">
            <FiUser className="h-6 w-6" />
          </div>
          <div>
            <h3 className="profile-section-title">Personal Information</h3>
            <p className="profile-section-subtitle">Update your personal details</p>
          </div>
        </div>
        <div className="profile-section-content">
          <form onSubmit={handleSubmit(onSubmitProfile)} className="profile-form-grid">
            <div className="profile-form-group">
              <label className="profile-form-label">
                <FiUser className="h-4 w-4" />
                Full Name
                <span className="profile-form-label-required">*</span>
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className={`profile-form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <div className="profile-form-error">
                  <span>{errors.name.message}</span>
                </div>
              )}
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">
                <FiMail className="h-4 w-4" />
                Email Address
                <span className="profile-form-label-required">*</span>
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className={`profile-form-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <div className="profile-form-error">
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            <div className="profile-form-actions">
              <button
                type="submit"
                disabled={updateMutation.isLoading}
                className="profile-form-button save"
              >
                {updateMutation.isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
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
      <div className="password-section">
        <div className="password-section-header">
          <div className="password-section-icon">
            <FiLock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="password-section-title">Change Password</h3>
            <p className="password-section-subtitle">Update your account password</p>
          </div>
        </div>
        <div className="password-section-content">
          <form id="passwordForm" onSubmit={handleSubmit(onSubmitPassword)} className="password-form-grid">
            <div className="password-form-group">
              <label className="password-form-label">
                <FiLock className="h-4 w-4" />
                Current Password
                <span className="profile-form-label-required">*</span>
              </label>
              <input
                {...register('currentPassword', { required: 'Current password is required' })}
                type={showCurrentPassword ? 'text' : 'password'}
                className={`password-form-input ${errors.currentPassword ? 'error' : ''}`}
                placeholder="Enter current password"
              />
              {errors.currentPassword && (
                <div className="password-form-error">
                  <span>{errors.currentPassword.message}</span>
                </div>
              )}
            </div>

            <div className="password-form-group">
              <label className="password-form-label">
                <FiLock className="h-4 w-4" />
                New Password
                <span className="profile-form-label-required">*</span>
              </label>
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
                className={`password-form-input ${errors.newPassword ? 'error' : ''}`}
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <div className="password-form-error">
                  <span>{errors.newPassword.message}</span>
                </div>
              )}
            </div>

            <div className="password-form-group">
              <label className="password-form-label">
                <FiLock className="h-4 w-4" />
                Confirm New Password
                <span className="profile-form-label-required">*</span>
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`password-form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <div className="password-form-error">
                  <span>{errors.confirmPassword.message}</span>
                </div>
              )}
            </div>

            <div className="profile-form-actions">
              <button
                type="submit"
                disabled={passwordMutation.isLoading}
                className="profile-form-button save"
              >
                {passwordMutation.isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
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
    </div>
  );
};

export default Profile;
