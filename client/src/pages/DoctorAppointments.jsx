import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AppointmentCard from '../components/AppointmentCard';
import { getDoctorAppointments } from '../api/doctorApi';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filter,       setFilter]       = useState('all');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    getDoctorAppointments()
      .then(({ data }) => setAppointments(data.appointments))
      .catch(() => setError('Could not load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  const handleConsult = (appt) => navigate(`/doctor/consult/${appt._id}`);

  const shown = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">My Appointments</h2>
        <p className="text-gray-500 text-sm mb-6">Upcoming and past consultations.</p>

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
                role="doctor"
                onVideoAction={(appointment) => navigate(`/doctor/video/${appointment._id}`)}
                onAction={appt.status !== 'completed' && appt.status !== 'cancelled' ? handleConsult : null}
                actionLabel="Write consultation notes →"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorAppointments;
