import api from './axiosInstance';

export const getPendingDoctors = ()       => api.get('/admin/doctors/pending');
export const verifyDoctor      = (id)     => api.patch(`/admin/doctors/${id}/verify`);
export const getAnalytics      = (params) => api.get('/admin/analytics', { params });
export const getUsers          = (params) => api.get('/admin/users', { params });
