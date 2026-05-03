import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login               from './pages/Login';
import Register            from './pages/Register';
import AuthCallback        from './pages/AuthCallback';

import PatientDashboard    from './pages/PatientDashboard';
import SymptomCheck        from './pages/SymptomCheck';
import BookAppointment     from './pages/BookAppointment';
import AppointmentHistory  from './pages/AppointmentHistory';
import VideoAppointment    from './pages/VideoAppointment';

import DoctorDashboard     from './pages/DoctorDashboard';
import DoctorAvailability  from './pages/DoctorAvailability';
import DoctorAppointments  from './pages/DoctorAppointments';
import ConsultationForm    from './pages/ConsultationForm';

import AdminDashboard      from './pages/AdminDashboard';

const P = ({ roles, children }) => (
  <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"              element={<Navigate to="/login" replace />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Patient */}
          <Route path="/patient/dashboard" element={<P roles={['patient']}><PatientDashboard /></P>} />
          <Route path="/patient/symptoms"  element={<P roles={['patient']}><SymptomCheck /></P>} />
          <Route path="/patient/book"      element={<P roles={['patient']}><BookAppointment /></P>} />
          <Route path="/patient/history"   element={<P roles={['patient']}><AppointmentHistory /></P>} />
          <Route path="/patient/video/:id" element={<P roles={['patient']}><VideoAppointment role="patient" /></P>} />

          {/* Doctor */}
          <Route path="/doctor/dashboard"      element={<P roles={['doctor']}><DoctorDashboard /></P>} />
          <Route path="/doctor/availability"   element={<P roles={['doctor']}><DoctorAvailability /></P>} />
          <Route path="/doctor/appointments"   element={<P roles={['doctor']}><DoctorAppointments /></P>} />
          <Route path="/doctor/consult/:id"    element={<P roles={['doctor']}><ConsultationForm /></P>} />
          <Route path="/doctor/video/:id"      element={<P roles={['doctor']}><VideoAppointment role="doctor" /></P>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<P roles={['admin']}><AdminDashboard /></P>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
