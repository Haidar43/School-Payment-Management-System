import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParents, deleteParent } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  UserPlus,
  Phone,
  Mail,
  Users,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import ParentForm from '../../components/parents/ParentForm';

const Parents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchParents();
  }, [currentPage, searchQuery]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await getParents();
      let data = response.data || [];

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        data = data.filter(p =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(query) ||
          p.phone?.includes(query) ||
          p.email?.toLowerCase().includes(query)
        );
      }

      setParents(data);
      setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching parents:', error);
      toast.error('Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    try {
      await deleteParent(id);
      toast.success('Parent deleted successfully');
      fetchParents();
    } catch (error) {
      console.error('Error deleting parent:', error);
      toast.error('Failed to delete parent. They may have students attached.');
    }
    setDeleteConfirm(null);
  };

  const openEditModal = (parent) => {
    setEditingParent(parent);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingParent(null);
  };

  const handleFormSuccess = () => {
    closeModal();
    fetchParents();
  };

  // Pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedParents = parents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading && parents.length === 0) {
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
          <h1 className="text-2xl font-semibold text-text-primary">Parents</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage all parents and guardians
          </p>
        </div>
        <button
          onClick={() => {
            setEditingParent(null);
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Parent
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-text-secondary" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name, phone, or email..."
          className="input pl-9"
        />
      </div>

      {/* Parents Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th className="text-center">Children</th>
                <th className="text-right">Outstanding</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
            {paginatedParents.map((parent) => (
              <tr key={parent.id}>
                <td className="font-medium">{parent.first_name} {parent.last_name}</td>
                <td className="text-sm">{parent.phone || '-'}</td>
                <td className="text-sm">{parent.email || '-'}</td>
                <td className="text-center text-sm">{parent.children_count || parent.students?.length || 0}</td>
                <td className="text-left font-medium text-status-unpaid">
                  {parent.outstanding_balance > 0 ? formatCurrency(parent.outstanding_balance) : '-'}
                </td>
                <td className="text-left">
                  <div className="flex items-center justify-start gap-2">
                    <button
                      onClick={() => navigate(`/admin/parents/${parent.id}`)}
                      className="p-1.5 text-text-secondary hover:text-text-primary rounded-sm hover:bg-background transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(parent)}
                      className="p-1.5 text-text-secondary hover:text-accent rounded-sm hover:bg-background transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(parent.id)}
                      className="p-1.5 text-text-secondary hover:text-status-unpaid rounded-sm hover:bg-background transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {startIndex + 1}-
            {Math.min(startIndex + ITEMS_PER_PAGE, parents.length)} of {parents.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Parent"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this parent? This action cannot be undone.
            {parents.find(p => p.id === deleteConfirm)?.students?.length > 0 && (
              <span className="block mt-2 text-status-unpaid">
                Warning: This parent has {parents.find(p => p.id === deleteConfirm)?.students?.length} child(ren) attached.
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
              onClick={() => handleDelete(deleteConfirm)}
              className="btn-danger"
            >
              Delete Parent
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingParent ? 'Edit Parent' : 'Add Parent'}
        size="md"
      >
        <ParentForm
          parent={editingParent}
          onSuccess={handleFormSuccess}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default Parents;