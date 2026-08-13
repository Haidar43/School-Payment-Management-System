import React, { useState } from 'react';
import { createFee, updateFee } from '../../api/admin';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Select from '../common/Select';
import Spinner from '../common/Spinner';

const FeeForm = ({ fee, sessions, classes, selectedSession, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    session_id: fee?.session_id || selectedSession || '',
    class_id: fee?.class_id || '',
    amount: fee?.amount ? (fee.amount / 100).toString() : '',
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
    if (!formData.session_id) newErrors.session_id = 'Please select a session';
    if (!formData.class_id) newErrors.class_id = 'Please select a class';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
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
        session_id: Number(formData.session_id),
        class_id: Number(formData.class_id),
        amount: Number(formData.amount),
      };

      if (fee) {
        await updateFee(fee.id, data);
        toast.success('Fee structure updated successfully');
      } else {
        await createFee(data);
        toast.success('Fee structure created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving fee:', error);
      const message = error.response?.data?.detail || 'Failed to save fee structure';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Session"
        name="session_id"
        value={formData.session_id}
        onChange={handleChange}
        options={sessions.map((s) => ({
          value: s.id,
          label: s.name,
        }))}
        error={errors.session_id}
        required
        placeholder="Select session"
      />

      <Select
        label="Class"
        name="class_id"
        value={formData.class_id}
        onChange={handleChange}
        options={classes.map((c) => ({
          value: c.id || c.class?.id,
          label: c.name || c.class?.name,
        }))}
        error={errors.class_id}
        required
        placeholder="Select class"
      />

      <Input
        label="Fee Amount"
        name="amount"
        type="number"
        value={formData.amount}
        onChange={handleChange}
        error={errors.amount}
        required
        placeholder="e.g., 15000"
        min="0.01"
        step="0.01"
      />

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
            fee ? 'Update Fee' : 'Create Fee'
          )}
        </button>
      </div>
    </form>
  );
};

export default FeeForm;