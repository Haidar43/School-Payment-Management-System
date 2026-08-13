import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateAdmin } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  AlertCircle,
  CheckCircle,
  Building,
  MapPin,
  Phone as PhoneIcon,
  Globe,
} from 'lucide-react';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';

const Settings = () => {
  const { user, loginAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [schoolSettings, setSchoolSettings] = useState({
    name: 'SchoolPay',
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
    // Load school settings from localStorage
    const saved = localStorage.getItem('schoolSettings');
    if (saved) {
      try {
        setSchoolSettings(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setSuccessMessage('');
  };

  const handleSchoolChange = (e) => {
    const { name, value } = e.target;
    setSchoolSettings((prev) => ({ ...prev, [name]: value }));
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required';
    }
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'Password must be at least 6 characters';
    }
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const data = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
      };
      await updateAdmin(user.id, data);

      // Update local user data
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccessMessage('Profile updated successfully!');
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setSaving(true);
    try {
      await updateAdmin(user.id, {
        password: formData.new_password,
      });

      setFormData((prev) => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
      setSuccessMessage('Password changed successfully!');
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSchoolSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('schoolSettings', JSON.stringify(schoolSettings));
    toast.success('School settings saved successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your profile and system preferences
        </p>
      </div>

      {successMessage && (
        <div className="rounded-sm bg-green-50 border border-status-paid/20 p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-status-paid" />
          <p className="text-sm text-status-paid">{successMessage}</p>
        </div>
      )}

      {/* Profile Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              required
            />
            <Input
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name}
              required
            />
          </div>

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            name="current_password"
            type="password"
            value={formData.current_password}
            onChange={handleChange}
            error={errors.current_password}
            required
            placeholder="Enter current password"
          />

          <Input
            label="New Password"
            name="new_password"
            type="password"
            value={formData.new_password}
            onChange={handleChange}
            error={errors.new_password}
            required
            placeholder="Minimum 6 characters"
          />

          <Input
            label="Confirm New Password"
            name="confirm_password"
            type="password"
            value={formData.confirm_password}
            onChange={handleChange}
            error={errors.confirm_password}
            required
            placeholder="Confirm new password"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner size="sm" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* School Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">School Settings</h2>
        <form onSubmit={handleSchoolSubmit} className="space-y-4">
          <Input
            label="School Name"
            name="name"
            value={schoolSettings.name}
            onChange={handleSchoolChange}
            placeholder="Your School Name"
          />

          <Input
            label="Address"
            name="address"
            value={schoolSettings.address}
            onChange={handleSchoolChange}
            placeholder="School address"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              name="phone"
              value={schoolSettings.phone}
              onChange={handleSchoolChange}
              placeholder="School phone number"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={schoolSettings.email}
              onChange={handleSchoolChange}
              placeholder="School email"
            />
          </div>

          <Input
            label="Website"
            name="website"
            value={schoolSettings.website}
            onChange={handleSchoolChange}
            placeholder="School website URL"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save School Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;