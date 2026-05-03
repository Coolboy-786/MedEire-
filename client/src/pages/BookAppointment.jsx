import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getAvailableDoctors, bookAppointment } from '../api/patientApi';

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TRIAGE_BADGE = {
  low:    'bg-green-100  text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100    text-red-700',
};

const BookAppointment = () => {
  const navigate       = useNavigate();
  const { state }      = useLocation();
  const triageLevel    = state?.triageLevel || null;
  const symptoms       = state?.symptoms   || [];

  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [booking,  setBooking]  = useState(false);

  const [appointmentType, setAppointmentType] = useState('clinic');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDay,    setSelectedDay]    = useState('');
  const [selectedSlot,   setSelectedSlot]   = useState('');

  useEffect(() => {
    getAvailableDoctors()
      .then(({ data }) => setDoctors(data.doctors))
      .catch(() => setError('Could not load doctors. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const availableDays = selectedDoctor
    ? (selectedDoctor.availability || []).sort((a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day))
    : [];

  const availableSlots = selectedDay
    ? availableDays.find((a) => a.day === selectedDay)?.slots.sort() || []
    : [];

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    setSelectedDay('');
    setSelectedSlot('');
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDay || !selectedSlot) {
      setError('Please select a doctor, day, and time slot.');
      return;
    }
    setError(''); setBooking(true);
    try {
      await bookAppointment({
        doctorId:    selectedDoctor._id,
        day:         selectedDay,
        timeSlot:    selectedSlot,
        appointmentType,
        symptoms,
        triageLevel: triageLevel || undefined,
      });
      navigate('/patient/history', { state: { booked: true } });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Book an Appointment</h2>
        <p className="text-gray-500 text-sm mb-2">Choose a doctor and an available time slot.</p>

        {triageLevel && (
          <div className={`inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-sm font-medium border ${TRIAGE_BADGE[triageLevel]}`}>
            Triage level: <span className="capitalize font-bold">{triageLevel}</span>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Appointment type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: 'clinic', title: 'Clinic visit', desc: 'Standard in-person consultation' },
              { value: 'video', title: 'Video call', desc: 'Meet the doctor online at the appointment time' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setAppointmentType(item.value)}
                className={`text-left border rounded-xl p-4 transition-all ${
                  appointmentType === item.value
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Step 1: Doctor */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">1 — Select a doctor</h3>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-gray-400 text-sm">No verified doctors available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => handleDoctorSelect(doc)}
                  className={`text-left border rounded-xl p-4 transition-all ${
                    selectedDoctor?._id === doc._id
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <p className="font-semibold text-gray-800 text-sm">Dr. {doc.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{doc.specialty}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Available: {(doc.availability || []).map((a) => a.day).join(', ') || 'No slots set'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Step 2: Day */}
        {selectedDoctor && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">2 — Select a day</h3>
            {availableDays.length === 0 ? (
              <p className="text-sm text-gray-400">This doctor has no availability set yet.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {availableDays.map(({ day }) => (
                  <button
                    key={day}
                    onClick={() => { setSelectedDay(day); setSelectedSlot(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedDay === day
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 3: Time slot */}
        {selectedDay && (
          <section className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">3 — Select a time</h3>
            <div className="flex gap-2 flex-wrap">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedSlot === slot
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </section>
        )}

        {selectedDoctor && selectedDay && selectedSlot && (
          <button
            onClick={handleSubmit}
            disabled={booking}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors text-base"
          >
            {booking ? 'Booking…' : `Confirm ${appointmentType === 'video' ? 'video' : 'clinic'} — Dr. ${selectedDoctor.name} · ${selectedDay} at ${selectedSlot}`}
          </button>
        )}
      </main>
    </div>
  );
};

export default BookAppointment;
