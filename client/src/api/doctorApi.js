import api from './axiosInstance';

export const getAvailability      = ()      => api.get('/doctors/availability');
export const updateAvailability   = (data)  => api.put('/doctors/availability', data);
export const getDoctorAppointments = ()     => api.get('/doctors/appointments');
export const completeConsultation = (id, data) => api.put(`/doctors/appointments/${id}/consult`, data);
