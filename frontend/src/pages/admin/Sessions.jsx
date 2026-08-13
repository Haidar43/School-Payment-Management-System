import React, { useState, useEffect } from 'react';
import { getSessions, createSession, updateSession, deleteSession, activateSession, getSessionStats } from '../../api/admin';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import SessionForm from '../../components/sessions/SessionForm';

const Sessions = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await getSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await activateSession(id);
      toast.success('Session activated successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error activating session:', error);
      toast.error('Failed to activate session');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSession(id);
      toast.success('Session deleted successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
    setDeleteConfirm(null);
  };

  const handleViewStats = async (id) => {
    try {
      const response = await getSessionStats(id);
      setStats(response.data);
      setSelectedSession(id);
      setShowStats(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load session statistics');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSession(null);
  };

  const handleFormSuccess = () => {
    closeModal();
    fetchSessions();
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
          <h1 className="text-2xl font-semibold text-text-primary">Sessions</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage academic sessions and activate current session
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSession(null);
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th className="text-center">Students</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">No sessions created yet</p>
                    <button
                      onClick={() => {
                        setEditingSession(null);
                        setShowModal(true);
                      }}
                      className="btn-primary mt-4 inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Session
                    </button>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="font-medium">{session.name}</td>
                    <td className="text-sm">{formatDate(session.start_date) || '-'}</td>
                    <td className="text-sm">{formatDate(session.end_date) || '-'}</td>
                    <td>
                      {session.is_current ? (
                        <span className="badge-paid">Active</span>
                      ) : (
                        <span className="badge-info">Inactive</span>
                      )}
                    </td>
                    <td className="text-center text-sm">
                      <button
                        onClick={() => handleViewStats(session.id)}
                        className="text-accent hover:text-accent-light font-medium"
                      >
                        View Stats
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!session.is_current && (
                          <button
                            onClick={() => handleActivate(session.id)}
                            className="p-1.5 text-status-paid hover:text-green-700 rounded-sm hover:bg-green-50 transition-colors"
                            title="Activate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingSession(session);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-text-secondary hover:text-accent rounded-sm hover:bg-background transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(session.id)}
                          className="p-1.5 text-text-secondary hover:text-status-unpaid rounded-sm hover:bg-background transition-colors"
                          title="Delete"
                          disabled={session.is_current}
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

      {/* Stats Modal */}
      <Modal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        title={`Session Statistics - ${sessions.find(s => s.id === selectedSession)?.name || ''}`}
        size="lg"
      >
        {stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-background rounded-sm p-4 text-center">
                <p className="text-xs text-text-secondary">Total Students</p>
                <p className="text-2xl font-semibold text-text-primary">{stats.total_students || 0}</p>
              </div>
              <div className="bg-background rounded-sm p-4 text-center">
                <p className="text-xs text-text-secondary">Total Collected</p>
                <p className="text-lg font-semibold text-status-paid">
                  ₦{(stats.total_collected / 100).toLocaleString()}
                </p>
              </div>
              <div className="bg-background rounded-sm p-4 text-center">
                <p className="text-xs text-text-secondary">Total Outstanding</p>
                <p className="text-lg font-semibold text-status-unpaid">
                  ₦{(stats.total_outstanding / 100).toLocaleString()}
                </p>
              </div>
              <div className="bg-background rounded-sm p-4 text-center">
                <p className="text-xs text-text-secondary">Paid Students</p>
                <p className="text-lg font-semibold text-status-paid">{stats.paid_students || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-sm p-4 text-center">
                <p className="text-xs text-text-secondary">Partial Payments</p>
                <p className="text-lg font-semibold text-status-partial">{stats.partial_students || 0}</p>
              </div>
              <div className="bg-background rounded-sm p-4 text-center">
                <p className="text-xs text-text-secondary">Unpaid Students</p>
                <p className="text-lg font-semibold text-status-unpaid">{stats.unpaid_students || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Spinner />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Session"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this session? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => setDeleteConfirm(null)} className="btn-outline">
              Cancel
            </button>
            <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">
              Delete Session
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingSession ? 'Edit Session' : 'Create Session'}
        size="md"
      >
        <SessionForm
          session={editingSession}
          onSuccess={handleFormSuccess}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default Sessions;