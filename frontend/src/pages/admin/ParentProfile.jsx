import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getParent, deleteParent } from '../../api/admin';
import toast from 'react-hot-toast';
import { validateParentNIN } from '../../api/admin';

import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Users,
  CreditCard,
  Edit,
  Trash2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import ParentForm from '../../components/parents/ParentForm';

const ParentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    fetchParent();
  }, [id]);

  const fetchParent = async () => {
    try {
      setLoading(true);
      const response = await getParent(id);
      setParent(response.data);
    } catch (error) {
      console.error('Error fetching parent:', error);
      toast.error('Failed to load parent details');
      navigate('/admin/parents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteParent(id);
      toast.success('Parent deleted successfully');
      navigate('/admin/parents');
    } catch (error) {
      console.error('Error deleting parent:', error);
      toast.error('Failed to delete parent. They may have students attached.');
    }
    setDeleteConfirm(null);
  };

  const handleFormSuccess = () => {
    setShowEditModal(false);
    fetchParent();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary">Parent not found</h3>
        <button
          onClick={() => navigate('/admin/parents')}
          className="btn-primary mt-4"
        >
          Back to Parents
        </button>
      </div>
    );
  }

const handleValidateNIN = async () => {
  setValidating(true);
  try {
    const response = await validateParentNIN(id);
    toast.success('NIN validated successfully!');
    fetchParent();
  } catch (error) {
    console.error('Error validating NIN:', error);
    const message = error.response?.data?.detail || 'Failed to validate NIN';
    toast.error(message);
  } finally {
    setValidating(false);
  }
};

  const parentData = parent.parent || parent;
  const children = parent.children || [];
  const totalOutstanding = parent.outstanding_balance || 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/parents')}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Parents
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <User className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {parentData.first_name} {parentData.last_name}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-text-secondary flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {parentData.phone || '-'}
              </span>
              {parentData.email && (
                <span className="text-sm text-text-secondary flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {parentData.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {!parentData.nin_validated && parentData.nin && (
          <button
            onClick={handleValidateNIN}
            className="btn-outline inline-flex items-center gap-2"
            disabled={validating}
          >
            {validating ? (
              <>
                <Spinner size="sm" />
                Validating...
              </>
            ) : (
              'Validate NIN'
            )}
          </button>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(id)}
            className="btn-outline text-status-unpaid border-status-unpaid/30 hover:bg-red-50 inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-text-secondary">Total Children</p>
          <p className="text-2xl font-semibold text-text-primary">{children.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-text-secondary">Registered On</p>
          <p className="text-lg font-semibold text-text-primary">
            {formatDate(parentData.created_at)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-text-secondary">Total Outstanding</p>
          <p className={`text-2xl font-semibold ${totalOutstanding > 0 ? 'text-status-unpaid' : 'text-status-paid'}`}>
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
      <User className="w-4 h-4 text-text-secondary" />
      <div>
        <p className="text-xs text-text-secondary">NIN</p>
        <p className="text-sm font-medium text-text-primary">
          {parentData.nin || 'Not provided'}
          {parentData.nin && (
            <span className={`ml-2 text-xs ${parentData.nin_validated ? 'text-status-paid' : 'text-status-unpaid'}`}>
              {parentData.nin_validated ? '✅ Validated' : '❌ Not validated'}
            </span>
          )}
        </p>
      </div>
      </div>

      {/* Children List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-secondary">Children</h2>
          <span className="text-sm text-text-secondary">{children.length} children</span>
        </div>

        {children.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">No children registered</p>
        ) : (
          <div className="space-y-3">
            {children.map((child) => {
              const status = child.status || 'NOT_ENROLLED';
              const badge = getStatusBadge(status);
              return (
                <button
                  key={child.student.id}
                  onClick={() => navigate(`/admin/students/${child.student.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-background transition-colors border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-primary/5 flex items-center justify-center text-primary font-semibold text-sm">
                      {child.student.first_name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-text-primary">
                        {child.student.first_name} {child.student.last_name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-text-secondary">
                          {child.class?.name || 'Not enrolled'}
                        </span>
                        <span className={badge.className}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">
                        {formatCurrency(child.fee || 0)}
                      </p>
                      <p className="text-xs text-text-secondary">Fee</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-status-unpaid">
                        {formatCurrency(child.balance || 0)}
                      </p>
                      <p className="text-xs text-text-secondary">Balance</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Parent"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong>{parentData.first_name} {parentData.last_name}</strong>?
            {children.length > 0 && (
              <span className="block mt-2 text-status-unpaid">
                ⚠️ Warning: This parent has {children.length} child(ren) attached. They will also be removed.
              </span>
            )}
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger"
            >
              Delete Parent
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Parent"
        size="md"
      >
        <ParentForm
          parent={parentData}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
};

export default ParentProfile;