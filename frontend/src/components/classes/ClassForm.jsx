import React, { useState } from 'react';
import { createClass, updateClass } from '../../api/admin';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Spinner from '../common/Spinner';

const ClassForm = ({ classData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(classData?.name || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Class name is required');
      return;
    }

    setLoading(true);
    try {
      if (classData) {
        await updateClass(classData.id, { name: name.trim() });
        toast.success('Class updated successfully');
      } else {
        await createClass({ name: name.trim() });
        toast.success('Class created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving class:', error);
      const message = error.response?.data?.detail || 'Failed to save class';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Class Name"
        name="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        error={error}
        required
        placeholder="e.g., Primary 1"
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
            classData ? 'Update Class' : 'Create Class'
          )}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;