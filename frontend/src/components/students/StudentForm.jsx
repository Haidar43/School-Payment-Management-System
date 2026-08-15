import React, { useState, useEffect } from 'react';
import { createStudent, updateStudent, getParents, getClasses, getCurrentSession } from '../../api/admin';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Select from '../common/Select';
import Spinner from '../common/Spinner';

const StudentForm = ({ student, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingParents, setLoadingParents] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  const [formData, setFormData] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    parent_id: '',
    class_id: '',  // ADD THIS
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
    if (student) {
      setFormData({
        admission_number: student.admission_number || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        parent_id: student.parent_id || '',
        class_id: student.class_id || '',
      });
    }
  }, [student]);

  const fetchData = async () => {
    try {
      const [parentsRes, classesRes, sessionRes] = await Promise.all([
        getParents(),
        getClasses(),
        getCurrentSession().catch(() => ({ data: null }))
      ]);

      setParents(parentsRes.data || []);
      setClasses(classesRes.data || []);
      setCurrentSession(sessionRes.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoadingParents(false);
      setLoadingClasses(false);
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

    if (!formData.admission_number) {
      newErrors.admission_number = 'Admission number is required';
    }
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.parent_id) {
      newErrors.parent_id = 'Please select a parent';
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
        admission_number: formData.admission_number.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        parent_id: Number(formData.parent_id),
        class_id: formData.class_id ? Number(formData.class_id) : undefined,  // ADD THIS
      };

      if (student) {
        // For editing, don't send class_id (enrollment handled separately)
        const { class_id, ...updateData } = data;
        await updateStudent(student.id, updateData);
        toast.success('Student updated successfully');
      } else {
        await createStudent(data);
        toast.success('Student created and enrolled successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving student:', error);
      const message = error.response?.data?.detail || 'Failed to save student';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingParents || loadingClasses) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Admission Number"
        name="admission_number"
        value={formData.admission_number}
        onChange={handleChange}
        error={errors.admission_number}
        required
        placeholder="e.g., STU-001"
      />

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

      <Select
        label="Parent"
        name="parent_id"
        value={formData.parent_id}
        onChange={handleChange}
        options={parents.map((p) => ({
          value: p.id,
          label: `${p.first_name} ${p.last_name} (${p.phone})`,
        }))}
        error={errors.parent_id}
        required
        placeholder="Select parent"
      />

      {!student && (
        <>
          <Select
            label="Enroll in Class (Optional)"
            name="class_id"
            value={formData.class_id}
            onChange={handleChange}
            options={classes.map((c) => ({
              value: c.id || c.class?.id,
              label: c.name || c.class?.name,
            }))}
            placeholder="Select class to auto-enroll"
          />

          {formData.class_id && !currentSession && (
            <div className="rounded-sm bg-amber-50 border border-status-partial/20 p-3">
              <p className="text-sm text-status-partial">
                ⚠️ No current session found. Student will be created but not enrolled.
              </p>
            </div>
          )}

          {formData.class_id && currentSession && (
            <div className="rounded-sm bg-green-50 border border-status-paid/20 p-3">
              <p className="text-sm text-status-paid">
                ✅ Student will be enrolled in <strong>{classes.find(c => (c.id || c.class?.id) === Number(formData.class_id))?.name || 'selected class'}</strong> for <strong>{currentSession.name}</strong>
              </p>
            </div>
          )}
        </>
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
            student ? 'Update Student' : 'Create Student'
          )}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;