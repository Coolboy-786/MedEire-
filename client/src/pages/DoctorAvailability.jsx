import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getAvailability, updateAvailability } from '../api/doctorApi';

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00',
];

// Convert the server's availability array to a flat lookup: { Mon: Set(['09:00', ...]) }
const toMap = (availability) => {
  const map = {};
  DAYS.forEach((d) => { map[d] = new Set(); });
  (availability || []).forEach(({ day, slots }) => {
    if (map[day]) slots.forEach((s) => map[day].add(s));
  });
  return map;
};

// Convert back to the API format
const fromMap = (map) =>
  DAYS.filter((d) => map[d].size > 0).map((day) => ({ day, slots: [...map[day]].sort() }));

const DoctorAvailability = () => {
  const [slotMap, setSlotMap] = useState(() => toMap([]));
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getAvailability()
      .then(({ data }) => setSlotMap(toMap(data.availability)))
      .catch(() => setError('Could not load your availability.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (day, slot) => {
    setSlotMap((prev) => {
      const next = { ...prev, [day]: new Set(prev[day]) };
      next[day].has(slot) ? next[day].delete(slot) : next[day].add(slot);
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await updateAvailability({ availability: fromMap(slotMap) });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">My Availability</h2>
        <p className="text-gray-500 text-sm mb-8">
          Toggle the slots you're available for consultations. Changes take effect immediately after saving.
        </p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-gray-500 font-medium pb-2 pr-4 w-16">Time</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center text-gray-600 font-semibold pb-2 px-1 w-16">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot} className="border-t border-gray-100">
                  <td className="py-1 pr-4 text-gray-500 font-mono">{slot}</td>
                  {DAYS.map((day) => {
                    const active = slotMap[day].has(slot);
                    return (
                      <td key={day} className="py-1 px-1 text-center">
                        <button
                          onClick={() => toggle(day, slot)}
                          className={`w-10 h-7 rounded transition-colors text-xs font-medium ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {active ? '✓' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save availability'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">✅ Saved</span>}
        </div>
      </main>
    </div>
  );
};

export default DoctorAvailability;
