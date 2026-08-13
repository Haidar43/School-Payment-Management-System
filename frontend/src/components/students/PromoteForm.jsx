import React, { useState, useEffect } from 'react';
import { getClasses, getSessions, promoteStudent } from '../../api/admin';
import toast from 'react-hot-toast';
import Select from '../common/Select';
import Spinner from '../common/Spinner';

const PromoteForm = ({ studentId, currentEnrollment, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [formData, setFormData] = useState({
    new_class_id: '',
    new_session_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const [classesRes, sessionsRes] = await Promise.all([
        getClasses(),
        getSessions(),
      ]);
      setClasses(classesRes.data || []);
      setSessions(sessionsRes.data || []);

      // Pre-select current session if available
      const currentSession = sessionsRes.data?.find((s) => s.is_current);
      if (currentSession) {
        setFormData((prev) => ({
          ...prev,
          new_session_id: currentSession.id,
        }));
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Failed to load options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.new_class_id) {
      newErrors.new_class_id = 'Please select a class';
    }
    if (!formData.new_session_id) {
      newErrors.new_session_id = 'Please select a session';
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
      await promoteStudent(studentId, {
        new_class_id: Number(formData.new_class_id),
        new_session_id: Number(formData.new_session_id),
      });
      onSuccess();
    } catch (error) {
      console.error('Error promoting student:', error);
      const message = error.response?.data?.detail || 'Failed to promote student';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const currentClass = currentEnrollment?.class;
  const currentSession = currentEnrollment?.session;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Info */}
      <div className="bg-background rounded-sm p-4 space-y-2">
        <p className="text-sm text-text-secondary">
          Current Class: <span className="font-medium text-text-primary">{currentClass?.name || 'None'}</span>
        </p>
        <p className="text-sm text-text-secondary">
          Current Session: <span className="font-medium text-text-primary">{currentSession?.name || 'None'}</span>
        </p>
      </div>

      <Select
        label="New Class"
        name="new_class_id"
        value={formData.new_class_id}
        onChange={handleChange}
        options={classes
          .filter((c) => c.id !== currentClass?.id)
          .map((c) => ({
            value: c.id,
            label: c.name,
          }))}
        error={errors.new_class_id}
        required
        placeholder="Select new class"
      />

      <Select
        label="New Session"
        name="new_session_id"
        value={formData.new_session_id}
        onChange={handleChange}
        options={sessions.map((s) => ({
          value: s.id,
          label: `${s.name}${s.is_current ? ' (Current)' : ''}`,
        }))}
        error={errors.new_session_id}
        required
        placeholder="Select new session"
      />

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
              Promoting...
            </>
          ) : (
            'Promote Student'
          )}
        </button>
      </div>
    </form>
  );
};

export default PromoteForm;