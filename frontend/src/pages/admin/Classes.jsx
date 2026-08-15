import React, { useState, useEffect, } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClasses, createClass, updateClass, deleteClass } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  AlertCircle,
  Users,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import ClassForm from '../../components/classes/ClassForm';

const Classes = () => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await getClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClass(id);
      toast.success('Class deleted successfully');
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class. It may have enrollments.');
    }
    setDeleteConfirm(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClass(null);
  };

  const handleFormSuccess = () => {
    closeModal();
    fetchClasses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Classes</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage all classes and their fee structures
          </p>
        </div>
        <button
          onClick={() => {
            setEditingClass(null);
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No classes created</h3>
          <p className="text-sm text-text-secondary mt-1">Create your first class to get started</p>
          <button
            onClick={() => {
              setEditingClass(null);
              setShowModal(true);
            }}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map((cls) => {
            const classData = cls.class || cls;
            const stats = cls;
            return (
                  <div
                      key={classData.id}
                      className="card hover:border-accent transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/payment-status/${classData.id}`)}
                    >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">{classData.name}</h3>
                    <p className="text-xs text-text-secondary">Class</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingClass(classData);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-text-secondary hover:text-accent rounded-sm hover:bg-background transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(classData.id)}
                      className="p-1.5 text-text-secondary hover:text-status-unpaid rounded-sm hover:bg-background transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Fee</span>
                      <span className="font-medium text-text-primary">
                        {stats.current_session_fee ? formatCurrency(stats.current_session_fee) : 'Not set'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Students
                    </span>
                    <span className="font-medium text-text-primary">{stats.student_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Outstanding</span>
                    <span className="font-medium text-status-unpaid">
                      {formatCurrency(stats.outstanding_total || 0)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-status-paid"></span>
                    <span className="text-xs text-text-secondary">{stats.paid_count || 0} paid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-status-partial"></span>
                    <span className="text-xs text-text-secondary">{stats.partial_count || 0} partial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-status-unpaid"></span>
                    <span className="text-xs text-text-secondary">{stats.unpaid_count || 0} unpaid</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Class"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this class? This action cannot be undone.
            All associated enrollments and fee structures will also be removed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => setDeleteConfirm(null)} className="btn-outline">
              Cancel
            </button>
            <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">
              Delete Class
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingClass ? 'Edit Class' : 'Add Class'}
        size="md"
      >
        <ClassForm
          classData={editingClass}
          onSuccess={handleFormSuccess}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default Classes;