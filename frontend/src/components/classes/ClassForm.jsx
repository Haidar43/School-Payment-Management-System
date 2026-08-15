import React, { useState, useEffect } from 'react';
import { createClass, updateClass, createFee, getCurrentSession } from '../../api/admin';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Spinner from '../common/Spinner';

const ClassForm = ({ classData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [name, setName] = useState(classData?.name || '');
  const [fee, setFee] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCurrentSession();
  }, []);

  const fetchCurrentSession = async () => {
    try {
      const response = await getCurrentSession();
      if (response.data) {
        setCurrentSessionId(response.data.id);
      }
    } catch (error) {
      console.error('Error fetching current session:', error);
      toast.error('Could not load current session');
    } finally {
      setLoadingSession(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Class name is required');
      return false;
    }
    if (!classData && !fee) {
      setError('Fee amount is required');
      return false;
    }
    if (!classData && fee && (isNaN(fee) || Number(fee) <= 0)) {
      setError('Please enter a valid fee amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (classData) {
        // Editing existing class - just update the name
        await updateClass(classData.id, { name: name.trim() });
        toast.success('Class updated successfully');
        onSuccess();
      } else {
        // Creating new class - send both name and fee
        const newClassData = {
          name: name.trim(),
          fee: Number(fee)
        };

        console.log('Creating class with data:', newClassData);

        const response = await createClass(newClassData);
        console.log('Class created:', response.data);

        toast.success('Class created successfully');
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving class:', error);
      const message = error.response?.data?.detail || 'Failed to save class';
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSession && !classData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
        <span className="ml-2 text-sm text-text-secondary">Loading session...</span>
      </div>
    );
  }

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

      {!classData && (
        <>
          <Input
            label="Fee Amount (₦)"
            name="fee"
            type="number"
            value={fee}
            onChange={(e) => {
              setFee(e.target.value);
              setError('');
            }}
            error={error}
            required
            placeholder="e.g., 15000"
            min="0.01"
            step="0.01"
          />
          {!currentSessionId && (
            <div className="rounded-sm bg-amber-50 border border-status-partial/20 p-3">
              <p className="text-sm text-status-partial">
                ⚠️ No current session found. Please create and activate a session first.
              </p>
            </div>
          )}
          {currentSessionId && (
            <div className="rounded-sm bg-green-50 border border-status-paid/20 p-3">
              <p className="text-sm text-status-paid">
                ✅ Fee will be set for the current session
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="btn-outline" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" />
              {classData ? 'Updating...' : 'Creating...'}
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