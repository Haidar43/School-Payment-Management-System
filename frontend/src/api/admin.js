import api from './client';

// Dashboard
export const getDashboard = () => api.get('/api/admin/dashboard');

// Admins
export const getAdmins = () => api.get('/api/admin/admins');
export const createAdmin = (data) => api.post('/api/admin/admins', data);
export const updateAdmin = (id, data) => api.put(`/api/admin/admins/${id}`, data);
export const deleteAdmin = (id) => api.delete(`/api/admin/admins/${id}`);

// Parents
export const getParents = () => api.get('/api/admin/parents');
export const getParent = (id) => api.get(`/api/admin/parents/${id}`);
export const createParent = (data) => api.post('/api/admin/parents', data);
export const updateParent = (id, data) => api.put(`/api/admin/parents/${id}`, data);
export const deleteParent = (id) => api.delete(`/api/admin/parents/${id}`);
export const validateParentNIN = (parentId) => {
  return api.post(`/api/admin/parents/${parentId}/validate-nin`);
};

// Students
export const getStudents = (params) => api.get('/api/admin/students', { params });
export const getStudent = (id, params) => api.get(`/api/admin/students/${id}`, { params });
export const createStudent = (data) => api.post('/api/admin/students', data);
export const updateStudent = (id, data) => api.put(`/api/admin/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/api/admin/students/${id}`);
export const promoteStudent = (id, data) => api.post(`/api/admin/students/${id}/promote`, data);
export const generateStudentDVA = (studentId) => {
  return api.post(`/api/admin/students/${studentId}/generate-dva`);
};

// Classes
export const getClasses = (params) => api.get('/api/admin/classes', { params });
export const getClass = (id, params) => api.get(`/api/admin/classes/${id}`, { params });
export const createClass = (data) => api.post('/api/admin/classes', data);
export const updateClass = (id, data) => api.put(`/api/admin/classes/${id}`, data);
export const deleteClass = (id) => api.delete(`/api/admin/classes/${id}`);

export const promoteAllStudents = (classId, targetClassId, targetSessionId) => {
  const params = new URLSearchParams();
  params.append('target_class_id', targetClassId);
  if (targetSessionId) {
    params.append('target_session_id', targetSessionId);
  }
  return api.post(`/api/admin/classes/${classId}/promote-all?${params.toString()}`);
};

// Sessions
export const getSessions = () => api.get('/api/admin/sessions');
export const getCurrentSession = () => api.get('/api/admin/sessions/current');
export const getSessionStats = (id) => api.get(`/api/admin/sessions/${id}/stats`);
export const createSession = (data) => api.post('/api/admin/sessions', data);
export const updateSession = (id, data) => api.put(`/api/admin/sessions/${id}`, data);
export const activateSession = (id) => api.post(`/api/admin/sessions/${id}/activate`);
export const deleteSession = (id) => api.delete(`/api/admin/sessions/${id}`);

// Fees
export const getFees = (params) => api.get('/api/admin/fees', { params });
export const getCurrentSessionFees = () => api.get('/api/admin/fees/current-session');
export const createFee = (data) => api.post('/api/admin/fees', data);
export const updateFee = (id, data) => api.put(`/api/admin/fees/${id}`, data);
export const deleteFee = (id) => api.delete(`/api/admin/fees/${id}`);

// Enrollments
export const getEnrollments = (params) => api.get('/api/admin/enrollments', { params });
export const getEnrollment = (id) => api.get(`/api/admin/enrollments/${id}`);
export const getStudentCurrentEnrollment = (id) => api.get(`/api/admin/students/${id}/current-enrollment`);
export const createEnrollment = (data) => api.post('/api/admin/enrollments', data);
export const updateEnrollment = (id, data) => api.put(`/api/admin/enrollments/${id}`, data);
export const deleteEnrollment = (id) => api.delete(`/api/admin/enrollments/${id}`);

// Payments
export const getPayments = (params) => api.get('/api/admin/payments', { params });
export const getPayment = (id) => api.get(`/api/admin/payments/${id}`);
export const createPayment = (data) => api.post('/api/admin/payments', data);
export const updatePayment = (id, data) => api.put(`/api/admin/payments/${id}`, data);
export const deletePayment = (id) => api.delete(`/api/admin/payments/${id}`);

// Payment Status
export const getPaymentStatus = (params) => api.get('/api/admin/payment-status', { params });
export const getClassPaymentMonitor = (classId, params) =>
  api.get(`/api/admin/payment-status/${classId}`, { params });

// Reports
export const getPaymentReport = (params) => api.get('/api/admin/reports/payment', { params });
export const getOutstandingReport = (params) => api.get('/api/admin/reports/outstanding', { params });
export const getDailyCollection = (date) => api.get('/api/admin/reports/daily-collection', { params: { date } });
export const getTodayCollection = () => api.get('/api/admin/reports/today');
export const getMonthlyCollection = (year, month) =>
  api.get('/api/admin/reports/monthly', { params: { year, month } });
export const getThisMonthCollection = () => api.get('/api/admin/reports/this-month');
export const getSessionCollections = () => api.get('/api/admin/reports/session-collections');
export const getOutstandingByClass = (params) => api.get('/api/admin/reports/outstanding-by-class', { params });
export const getDefaulters = (params) => api.get('/api/admin/reports/defaulters', { params });

// Recent Payments
export const getRecentPayments = (limit = 10) =>
  api.get('/api/admin/recent-payments', { params: { limit } });