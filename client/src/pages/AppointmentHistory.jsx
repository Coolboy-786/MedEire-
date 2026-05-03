import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AppointmentCard from '../components/AppointmentCard';
import { getMyAppointments, cancelAppointment } from '../api/patientApi';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const AppointmentHistory = () => {
  const { state }                       = useLocation();
  const navigate                        = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filter,       setFilter]       = useState('all');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    getMyAppointments()
      .then(({ data }) => setAppointments(data.appointments))
      .catch(() => setError('Could not load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (appt) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      const { data } = await cancelAppointment(appt._id);
      setAppointments((prev) => prev.map((a) => (a._id === appt._id ? data.appointment : a)));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Could not cancel appointment.');
    }
  };

  const shown = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">My Appointments</h2>
        <p className="text-gray-500 text-sm mb-6">Your consultation history.</p>

        {state?.booked && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            ✅ Appointment booked successfully!
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">No appointments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map((appt) => (
              <AppointmentCard
                key={appt._id}
                appointment={appt}
                role="patient"
                onVideoAction={(appointment) => navigate(`/patient/video/${appointment._id}`)}
                onAction={['pending', 'confirmed'].includes(appt.status) ? handleCancel : null}
                actionLabel="Cancel appointment"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AppointmentHistory;
