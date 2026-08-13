import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, deleteStudent, getSessions } from '../../api/admin';
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
  Filter,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import StudentForm from '../../components/students/StudentForm';

const Students = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedSession, currentPage, searchQuery]);

  const fetchSessions = async () => {
    try {
      const response = await getSessions();
      const sessionList = response.data || [];
      setSessions(sessionList);
      // Select current session or first
      const current = sessionList.find((s) => s.is_current);
      setSelectedSession(current?.id || sessionList[0]?.id || '');
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        session_id: selectedSession || undefined,
        search: searchQuery || undefined,
      };
      const response = await getStudents(params);
      setStudents(response.data || []);
      // Assume total pages from response or calculate
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSessionChange = (e) => {
    setSelectedSession(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    try {
      await deleteStudent(id);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
    setDeleteConfirm(null);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  const handleFormSuccess = () => {
    closeModal();
    fetchStudents();
  };

  if (loading && students.length === 0) {
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
          <h1 className="text-2xl font-semibold text-text-primary">Students</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage all students and their enrollment information
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-48">
          <Select
            value={selectedSession}
            onChange={handleSessionChange}
            options={sessions.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
          />
        </div>
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by name or admission..."
            className="input pl-9"
          />
        </div>
        <div className="flex-1" />
        <span className="text-sm text-text-secondary">
          {students.length} students
        </span>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Admission</th>
                <th>Student Name</th>
                <th>Parent</th>
                <th>Class</th>
                <th>Status</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">No students found</p>
                    <button
                      onClick={() => {
                        setEditingStudent(null);
                        setShowModal(true);
                      }}
                      className="btn-primary mt-4 inline-flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add First Student
                    </button>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const studentData = student.student || student;
                  const summary = student.payment_summary || {};
                  const enrollment = student.current_enrollment;
                  const status = summary.status || 'NOT_ENROLLED';
                  const statusBadge = {
                    PAID: 'badge-paid',
                    PARTIAL: 'badge-partial',
                    UNPAID: 'badge-unpaid',
                    NOT_ENROLLED: 'badge-info',
                  }[status] || 'badge-info';
                  const statusLabel = {
                    PAID: 'Paid',
                    PARTIAL: 'Partial',
                    UNPAID: 'Unpaid',
                    NOT_ENROLLED: 'Not Enrolled',
                  }[status] || status;

                  return (
                    <tr key={studentData.id}>
                      <td className="font-mono text-sm">
                        {studentData.admission_number}
                      </td>
                      <td className="font-medium">
                        {studentData.first_name} {studentData.last_name}
                      </td>
                      <td className="text-sm">
                        {student.parent?.first_name} {student.parent?.last_name}
                      </td>
                      <td className="text-sm">
                        {enrollment?.class?.name || '-'}
                      </td>
                      <td>
                        <span className={statusBadge}>{statusLabel}</span>
                      </td>
                      <td className="text-right font-medium text-status-unpaid">
                        {summary.balance > 0 ? formatCurrency(summary.balance) : '-'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/students/${studentData.id}`)}
                            className="p-1.5 text-text-secondary hover:text-text-primary rounded-sm hover:bg-background transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(studentData)}
                            className="p-1.5 text-text-secondary hover:text-accent rounded-sm hover:bg-background transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(studentData.id)}
                            className="p-1.5 text-text-secondary hover:text-status-unpaid rounded-sm hover:bg-background transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, students.length)} of {students.length}
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
        title="Delete Student"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this student? This action cannot be undone.
            All associated enrollments and payments will also be removed.
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
              Delete Student
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
        size="md"
      >
        <StudentForm
          student={editingStudent}
          onSuccess={handleFormSuccess}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default Students;