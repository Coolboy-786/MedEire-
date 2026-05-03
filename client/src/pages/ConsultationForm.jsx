import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getDoctorAppointments, completeConsultation } from '../api/doctorApi';

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-IE', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });

const TRIAGE_BADGE = {
  low:    'bg-green-100  text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100    text-red-700',
};

const ConsultationForm = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [appt,         setAppt]        = useState(null);
  const [doctorNotes,  setDoctorNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [loading,      setLoading]     = useState(true);
  const [saving,       setSaving]      = useState(false);
  const [error,        setError]       = useState('');

  useEffect(() => {
    // Fetch all appointments and find the target one
    // (avoids needing a separate GET /appointments/:id endpoint for now)
    getDoctorAppointments()
      .then(({ data }) => {
        const found = data.appointments.find((a) => a._id === id);
        if (!found) setError('Appointment not found.');
        else setAppt(found);
      })
      .catch(() => setError('Could not load appointment.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctorNotes.trim()) { setError('Please enter consultation notes.'); return; }
    setSaving(true); setError('');
    try {
      await completeConsultation(id, { doctorNotes, prescription });
      navigate('/doctor/appointments', { state: { completed: true } });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save consultation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error && !appt) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-xl mx-auto px-4 py-10 text-red-600 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Consultation Notes</h2>

        {/* Appointment summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-2">
          <p className="font-semibold text-gray-800">
            Patient: {appt.patientId?.name || '—'}
            {appt.patientId?.county && <span className="font-normal text-gray-500"> · {appt.patientId.county}</span>}
          </p>
          <p className="text-sm text-gray-500">{fmt(appt.scheduledAt)}</p>

          {appt.triageLevel && (
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TRIAGE_BADGE[appt.triageLevel]}`}>
              Triage: {appt.triageLevel}
            </span>
          )}

          {appt.symptoms?.length > 0 && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Reported symptoms:</span> {appt.symptoms.join(', ')}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Consultation Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              required
              rows={6}
              placeholder="Clinical findings, diagnosis, advice given…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Prescription <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              rows={3}
              placeholder="Medication, dosage, duration…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Complete consultation'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ConsultationForm;
