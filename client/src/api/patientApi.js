import api from './axiosInstance';

export const runTriage            = (data)  => api.post('/patients/triage', data);
export const getAvailableDoctors  = ()      => api.get('/patients/doctors');
export const bookAppointment      = (data)  => api.post('/patients/appointments', data);
export const getMyAppointments    = ()      => api.get('/patients/appointments');
export const cancelAppointment    = (id)    => api.patch(`/patients/appointments/${id}/cancel`);
