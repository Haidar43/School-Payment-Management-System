import React, { useState, useEffect } from 'react';
import {
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getStudents,
  getClasses,
  getSessions,
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
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { formatDate } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import { useNavigate } from 'react-router-dom';

const Enrollments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: '',
    session_id: '',
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'WITHDRAWN', label: 'Withdrawn' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchEnrollments();
    }
  }, [selectedSession]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes, sessionsRes, currentRes] = await Promise.all([
        getStudents({ limit: 1000 }),
        getClasses(),
        getSessions(),
        getCurrentSession().catch(() => ({ data: null }))
      ]);

      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
      setSessions(sessionsRes.data || []);

      const current = currentRes.data || sessionsRes.data?.find(s => s.is_current);
      setSelectedSession(current?.id || sessionsRes.data?.[0]?.id || '');
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedSession) return;
    try {
      const response = await getEnrollments({ session_id: selectedSession });
      setEnrollments(response.data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollments');
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
    if (!formData.student_id) newErrors.student_id = 'Please select a student';
    if (!formData.class_id) newErrors.class_id = 'Please select a class';
    if (!formData.session_id) newErrors.session_id = 'Please select a session';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {
        student_id: Number(formData.student_id),
        class_id: Number(formData.class_id),
        session_id: Number(formData.session_id),
        status: formData.status
      };

      if (editingEnrollment) {
        await updateEnrollment(editingEnrollment.id, data);
        toast.success('Enrollment updated successfully');
      } else {
        await createEnrollment(data);
        toast.success('Student enrolled successfully');
      }

      setShowModal(false);
      setEditingEnrollment(null);
      setFormData({ student_id: '', class_id: '', session_id: '', status: 'ACTIVE' });
      fetchEnrollments();
    } catch (error) {
      console.error('Error saving enrollment:', error);
      const message = error.response?.data?.detail || 'Failed to save enrollment';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEnrollment(id);
      toast.success('Enrollment removed successfully');
      fetchEnrollments();
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Failed to remove enrollment. It may have payments attached.');
    }
    setDeleteConfirm(null);
  };

  const openModal = (enrollment = null) => {
    if (enrollment) {
      setEditingEnrollment(enrollment);
      setFormData({
        student_id: enrollment.student_id,
        class_id: enrollment.class_id,
        session_id: enrollment.session_id,
        status: enrollment.status
      });
    } else {
      setEditingEnrollment(null);
      setFormData({
        student_id: '',
        class_id: '',
        session_id: selectedSession,
        status: 'ACTIVE'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEnrollment(null);
    setFormData({ student_id: '', class_id: '', session_id: '', status: 'ACTIVE' });
    setErrors({});
  };

  const getStudentName = (id) => {
    const student = students.find(s => s.id === id || s.student?.id === id);
    if (student?.student) {
      return `${student.student.first_name} ${student.student.last_name}`;
    }
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown';
  };

  const getStudentAdmission = (id) => {
    const student = students.find(s => s.id === id || s.student?.id === id);
    return student?.admission_number || student?.student?.admission_number || '-';
  };

  const getClassName = (id) => {
    const cls = classes.find(c => c.id === id || c.class?.id === id);
    return cls?.name || cls?.class?.name || 'Unknown';
  };

  const getSessionName = (id) => {
    const session = sessions.find(s => s.id === id);
    return session?.name || 'Unknown';
  };

  const getStatusBadge = (status) => {
    const map = {
      'ACTIVE': 'badge-paid',
      'COMPLETED': 'badge-info',
      'WITHDRAWN': 'badge-unpaid'
    };
    return map[status] || 'badge-info';
  };

  // Filter enrollments by search
  const filteredEnrollments = enrollments.filter(e => {
    if (!searchQuery) return true;
    const studentName = getStudentName(e.student_id).toLowerCase();
    const admission = getStudentAdmission(e.student_id).toLowerCase();
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || admission.includes(query);
  });

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
          <h1 className="text-2xl font-semibold text-text-primary">Enrollments</h1>
          <p className="text-sm text-text-secondary mt-1">
            Enroll students in classes for each session
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      {/* Filters */}
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
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or admission..."
            className="input mt-6"
          />
        </div>
        <button
          onClick={fetchEnrollments}
          className="btn-outline inline-flex items-center gap-2 mt-6"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Enrollments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Admission</th>
                <th>Student</th>
                <th>Class</th>
                <th>Session</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">
                      {searchQuery ? 'No enrollments matching search' : 'No students enrolled in this session'}
                    </p>
                    <button
                      onClick={() => openModal()}
                      className="btn-primary mt-4 inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Enroll Student
                    </button>
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enrollment, index) => (
                  <tr key={enrollment.id}>
                    <td className="text-sm text-text-secondary">{index + 1}</td>
                    <td className="font-mono text-sm">
                      {getStudentAdmission(enrollment.student_id)}
                    </td>
                    <td className="font-medium">
                      {getStudentName(enrollment.student_id)}
                    </td>
                    <td className="text-sm">{getClassName(enrollment.class_id)}</td>
                    <td className="text-sm">{getSessionName(enrollment.session_id)}</td>
                    <td>
                      <span className={getStatusBadge(enrollment.status)}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="text-sm">{formatDate(enrollment.enrolled_at)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/students/${enrollment.student_id}`)}
                          className="p-1.5 text-text-secondary hover:text-text-primary rounded-sm hover:bg-background transition-colors"
                          title="View Student"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(enrollment)}
                          className="p-1.5 text-text-secondary hover:text-accent rounded-sm hover:bg-background transition-colors"
                          title="Edit Enrollment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(enrollment.id)}
                          className="p-1.5 text-text-secondary hover:text-status-unpaid rounded-sm hover:bg-background transition-colors"
                          title="Remove Enrollment"
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
        title={editingEnrollment ? 'Edit Enrollment' : 'Enroll Student'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Student"
            name="student_id"
            value={formData.student_id}
            onChange={handleFormChange}
            options={students.map(s => ({
              value: s.id || s.student?.id,
              label: s.student
                ? `${s.student.first_name} ${s.student.last_name} (${s.student.admission_number})`
                : `${s.first_name} ${s.last_name} (${s.admission_number})`
            }))}
            error={errors.student_id}
            required
            placeholder="Select student"
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

          <Select
            label="Session"
            name="session_id"
            value={formData.session_id}
            onChange={handleFormChange}
            options={sessions.map(s => ({
              value: s.id,
              label: s.name
            }))}
            error={errors.session_id}
            required
            placeholder="Select session"
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleFormChange}
            options={statusOptions}
          />

          {!editingEnrollment && (
            <div className="rounded-sm bg-blue-50 border border-status-info/20 p-3">
              <p className="text-sm text-status-info">
                ⚠️ Student must have a parent assigned and fee structure must exist for the selected class and session.
              </p>
            </div>
          )}

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
                  {editingEnrollment ? 'Update Enrollment' : 'Enroll Student'}
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
        title="Remove Enrollment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to remove this enrollment? This action cannot be undone.
            All associated payments will also be removed.
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
              Remove Enrollment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Enrollments;