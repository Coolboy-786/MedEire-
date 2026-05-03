import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMyAppointments } from '../api/patientApi';
import { getDoctorAppointments } from '../api/doctorApi';

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

const VideoAppointment = ({ role }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = role === 'doctor' ? getDoctorAppointments : getMyAppointments;

    load()
      .then(({ data }) => {
        const found = data.appointments.find((item) => item._id === id);
        if (!found) {
          setError('Appointment not found.');
          return;
        }
        if (found.appointmentType !== 'video' || !found.videoRoomId) {
          setError('This appointment does not have a video room.');
          return;
        }
        if (['completed', 'cancelled'].includes(found.status)) {
          setError(`This appointment is ${found.status}.`);
          return;
        }
        setAppointment(found);
      })
      .catch(() => setError('Could not load video appointment.'))
      .finally(() => setLoading(false));
  }, [id, role]);

  const roomUrl = useMemo(() => {
    if (!appointment?.videoRoomId) return '';
    return `https://meet.jit.si/${encodeURIComponent(appointment.videoRoomId)}`;
  }, [appointment]);

  const other = appointment
    ? role === 'patient'
      ? appointment.doctorId
      : appointment.patientId
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Video Appointment</h2>
            {appointment && (
              <p className="text-sm text-gray-500">
                {fmt(appointment.scheduledAt)}
                {other?.name ? ` · ${role === 'patient' ? 'Dr. ' : ''}${other.name}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(role === 'doctor' ? '/doctor/appointments' : '/patient/history')}
            className="self-start sm:self-auto px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-white"
          >
            Back to appointments
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800 text-sm">MedEire secure video room</p>
                <p className="text-xs text-gray-500">Appointment ID: {appointment._id}</p>
              </div>
              <a
                href={roomUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-indigo-700 hover:underline"
              >
                Open in new tab
              </a>
            </div>
            <iframe
              title="MedEire video appointment"
              src={roomUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-[72vh] bg-gray-900"
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default VideoAppointment;
