import React, { useState } from 'react';
import { createSession, updateSession } from '../../api/admin';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Spinner from '../common/Spinner';

const SessionForm = ({ session, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.name || '',
    start_date: session?.start_date || '',
    end_date: session?.end_date || '',
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
    if (!formData.name) {
      newErrors.name = 'Session name is required';
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
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
        name: formData.name.trim(),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };

      if (session) {
        await updateSession(session.id, data);
        toast.success('Session updated successfully');
      } else {
        await createSession(data);
        toast.success('Session created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving session:', error);
      const message = error.response?.data?.detail || 'Failed to save session';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Session Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
        placeholder="e.g., 2025-2026"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          name="start_date"
          type="date"
          value={formData.start_date}
          onChange={handleChange}
          error={errors.start_date}
        />
        <Input
          label="End Date"
          name="end_date"
          type="date"
          value={formData.end_date}
          onChange={handleChange}
          error={errors.end_date}
        />
      </div>

      {!session && (
        <div className="rounded-sm bg-blue-50 border border-status-info/20 p-3">
          <p className="text-sm text-status-info">
            The first session created will automatically be set as the current session.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="btn-outline" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" />
              Saving...
            </>
          ) : (
            session ? 'Update Session' : 'Create Session'
          )}
        </button>
      </div>
    </form>
  );
};

export default SessionForm;