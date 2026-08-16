import React, { useState } from 'react';
import { createParent, updateParent } from '../../api/admin';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Spinner from '../common/Spinner';

const ParentForm = ({ parent, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: parent?.first_name || '',
    last_name: parent?.last_name || '',
    phone: parent?.phone || '',
    email: parent?.email || '',
    nin: parent?.nin || '',  // ADD THIS
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\s/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!parent && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (!parent && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const data = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        nin: formData.nin?.trim() || undefined,  // ADD THIS
      };

      if (parent) {
        await updateParent(parent.id, data);
        toast.success('Parent updated successfully');
      } else {
        await createParent({ ...data, password: formData.password });
        toast.success('Parent created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving parent:', error);
      const message = error.response?.data?.detail || 'Failed to save parent';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          error={errors.first_name}
          required
          placeholder="John"
        />
        <Input
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          error={errors.last_name}
          required
          placeholder="Doe"
        />
      </div>

      <Input
        label="Phone Number"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        required
        placeholder="+234 801 234 5678"
      />

      <Input
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="john@example.com"
      />

      <Input
        label="NIN (National Identification Number)"
        name="nin"
        value={formData.nin}
        onChange={handleChange}
        error={errors.nin}
        placeholder="12345678901"
        helperText="Required for virtual account generation"
      />

      {!parent && (
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          placeholder="Minimum 6 characters"
        />
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary inline-flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              Saving...
            </>
          ) : (
            parent ? 'Update Parent' : 'Create Parent'
          )}
        </button>
      </div>
    </form>
  );
};

export default ParentForm;