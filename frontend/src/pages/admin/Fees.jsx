import React, { useState, useEffect } from 'react';
import {
  getFees,
  createFee,
  updateFee,
  deleteFee,
  getSessions,
  getClasses,
  getCurrentSession
} from '../../api/admin';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';

const Fees = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    session_id: '',
    class_id: '',
    amount: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchFees();
    }
  }, [selectedSession]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, classesRes, currentRes] = await Promise.all([
        getSessions(),
        getClasses(),
        getCurrentSession().catch(() => ({ data: null }))
      ]);

      setSessions(sessionsRes.data || []);
      setClasses(classesRes.data || []);

      // Set current session or first available
      const current = currentRes.data || sessionsRes.data?.find(s => s.is_current);
      setSelectedSession(current?.id || sessionsRes.data?.[0]?.id || '');
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFees = async () => {
    if (!selectedSession) return;
    try {
      const response = await getFees({ session_id: selectedSession });
      setFees(response.data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
      toast.error('Failed to load fee structures');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {
        session_id: Number(formData.session_id),
        class_id: Number(formData.class_id),
        amount: Number(formData.amount)
      };

      if (editingFee) {
        await updateFee(editingFee.id, data);
        toast.success('Fee structure updated successfully');
      } else {
        await createFee(data);
        toast.success('Fee structure created successfully');
      }

      setShowModal(false);
      setEditingFee(null);
      setFormData({ session_id: '', class_id: '', amount: '' });
      fetchFees();
    } catch (error) {
      console.error('Error saving fee:', error);
      const message = error.response?.data?.detail || 'Failed to save fee structure';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFee(id);
      toast.success('Fee structure deleted successfully');
      fetchFees();
    } catch (error) {
      console.error('Error deleting fee:', error);
      toast.error('Failed to delete fee structure');
    }
    setDeleteConfirm(null);
  };

  const openModal = (fee = null) => {
    if (fee) {
      setEditingFee(fee);
      setFormData({
        session_id: fee.session_id,
        class_id: fee.class_id,
        amount: (fee.amount / 100).toString()
      });
    } else {
      setEditingFee(null);
      setFormData({
        session_id: selectedSession,
        class_id: '',
        amount: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFee(null);
    setFormData({ session_id: '', class_id: '', amount: '' });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  // Get class name by id
  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId || c.class?.id === classId);
    return cls?.name || cls?.class?.name || 'Unknown';
  };

  // Get session name by id
  const getSessionName = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Fee Structures</h1>
          <p className="text-sm text-text-secondary mt-1">
            Set school fees for each class per session
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Fee Structure
        </button>
      </div>

      {/* Session Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-56">
          <Select
            label="Session"
            name="session_id"
            value={selectedSession}
            onChange={(e) => setSelectedSession(Number(e.target.value))}
            options={sessions.map(s => ({ value: s.id, label: s.name }))}
          />
        </div>
        <button
          onClick={fetchFees}
          className="btn-outline inline-flex items-center gap-2 mt-6"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Fees Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Class</th>
                <th className="text-right">Fee Amount</th>
                <th>Session</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">
                      No fee structures for this session
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Click "Add Fee Structure" to set fees for classes
                    </p>
                    <button
                      onClick={() => openModal()}
                      className="btn-primary mt-4 inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Fee Structure
                    </button>
                  </td>
                </tr>
              ) : (
                fees.map((fee, index) => (
                  <tr key={fee.id}>
                    <td className="text-sm text-text-secondary">{index + 1}</td>
                    <td className="font-medium">{getClassName(fee.class_id)}</td>
                    <td className="text-left font-medium text-text-primary">
                      {formatCurrency(fee.amount)}
                    </td>
                    <td className="text-sm text-text-secondary">
                      {getSessionName(fee.session_id)}
                    </td>
                    <td className="text-left">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => openModal(fee)}
                          className="p-1.5 text-text-secondary hover:text-accent rounded-sm hover:bg-background transition-colors"
                          title="Edit Fee"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(fee.id)}
                          className="p-1.5 text-text-secondary hover:text-status-unpaid rounded-sm hover:bg-background transition-colors"
                          title="Delete Fee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Session"
            name="session_id"
            value={formData.session_id}
            onChange={handleFormChange}
            options={sessions.map(s => ({ value: s.id, label: s.name }))}
            error={errors.session_id}
            required
            placeholder="Select session"
          />

          <Select
            label="Class"
            name="class_id"
            value={formData.class_id}
            onChange={handleFormChange}
            options={classes.map(c => ({
              value: c.id || c.class?.id,
              label: c.name || c.class?.name
            }))}
            error={errors.class_id}
            required
            placeholder="Select class"
          />

          <Input
            label="Fee Amount (₦)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleFormChange}
            error={errors.amount}
            required
            placeholder="e.g., 15000"
            min="0.01"
            step="0.01"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={closeModal}
              className="btn-outline"
              disabled={saving}
            >
              Cancel
            </button>
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
                  {editingFee ? 'Update Fee' : 'Create Fee'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Fee Structure"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this fee structure? This action cannot be undone.
            Students currently enrolled may be affected.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="btn-danger"
            >
              Delete Fee
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Fees;