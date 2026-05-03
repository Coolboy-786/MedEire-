import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { runTriage } from '../api/patientApi';

const SEVERITY_CONFIG = {
  low:    { color: 'bg-green-50  border-green-300',  badge: 'bg-green-100  text-green-800',  icon: '✅', label: 'Low Risk' },
  medium: { color: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-100 text-yellow-800', icon: '⚠️', label: 'Medium Risk' },
  high:   { color: 'bg-red-50    border-red-300',    badge: 'bg-red-100    text-red-800',    icon: '🚨', label: 'High Risk' },
};

const PRESET_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Sore throat',
  'Shortness of breath', 'Chest pain', 'Nausea', 'Dizziness', 'Back pain',
];

const SymptomCheck = () => {
  const navigate = useNavigate();

  const [input,    setInput]   = useState('');
  const [selected, setSelected] = useState([]);
  const [result,   setResult]  = useState(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const togglePreset = (s) =>
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const allSymptoms = () => {
    const fromInput = input.split(',').map((s) => s.trim()).filter(Boolean);
    return [...new Set([...selected, ...fromInput])];
  };

  const handleSubmit = async () => {
    const symptoms = allSymptoms();
    if (symptoms.length === 0) { setError('Please enter or select at least one symptom.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const { data } = await runTriage({ symptoms });
      setResult({ ...data, symptoms });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Triage failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () =>
    navigate('/patient/book', { state: { triageLevel: result.severity, symptoms: result.symptoms } });

  const cfg = result ? SEVERITY_CONFIG[result.severity] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Symptom Check</h2>
        <p className="text-gray-500 text-sm mb-8">
          Tell us how you're feeling and our system will assess the urgency.
        </p>

        {/* Preset symptom chips */}
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Common symptoms</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => togglePreset(s)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  selected.includes(s)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Free-text input */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional symptoms <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. rash on arm, difficulty sleeping"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {allSymptoms().length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1">
            {allSymptoms().map((s) => (
              <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                {s}
              </span>
            ))}
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Assessing…' : 'Check symptoms'}
        </button>

        {/* Triage result */}
        {result && cfg && (
          <div className={`mt-8 border-2 rounded-xl p-6 space-y-4 ${cfg.color}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cfg.icon}</span>
              <div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
                  {cfg.label}
                </span>
                {result.strategy === 'rule' && (
                  <span className="ml-2 text-xs text-gray-400">(rule-based)</span>
                )}
              </div>
            </div>

            <p className="text-gray-700 text-sm">{result.reasoning}</p>

            {result.redFlags?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Red flags detected:</p>
                <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
                  {result.redFlags.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}

            {result.severity === 'high' && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800 font-medium">
                🚨 If this is a medical emergency, call <strong>112</strong> or go to your nearest A&amp;E immediately.
              </div>
            )}

            {(result.severity === 'medium' || result.severity === 'high') && (
              <button
                onClick={handleBook}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Book appointment with a doctor →
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SymptomCheck;
