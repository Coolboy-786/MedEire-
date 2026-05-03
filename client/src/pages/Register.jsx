import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import useAuth from '../hooks/useAuth';
import { ROLE_DASHBOARD } from '../context/AuthContext';

const IRISH_COUNTIES = [
  'Carlow','Cavan','Clare','Cork','Donegal','Dublin','Galway','Kerry',
  'Kildare','Kilkenny','Laois','Leitrim','Limerick','Longford','Louth',
  'Mayo','Meath','Monaghan','Offaly','Roscommon','Sligo','Tipperary',
  'Waterford','Westmeath','Wexford','Wicklow','Antrim','Armagh','Down',
  'Fermanagh','Londonderry','Tyrone',
];

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
    >
      {children}
    </select>
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role,     setRole]     = useState('patient');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    county: '', dob: '', gender: '',
    licenseNumber: '', specialty: '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = { name: form.name, email: form.email, password: form.password, role };
    if (role === 'patient') {
      if (form.county)  payload.county  = form.county;
      if (form.dob)     payload.dob     = form.dob;
      if (form.gender)  payload.gender  = form.gender;
    } else {
      payload.licenseNumber = form.licenseNumber;
      payload.specialty     = form.specialty;
    }

    try {
      if (role === 'patient') {
        // Patients can log in immediately after registration
        await registerUser(payload);
        await login(form.email, form.password);
        navigate(ROLE_DASHBOARD.patient, { replace: true });
      } else {
        // Doctors need admin verification first
        await registerUser(payload);
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Registration Received</h2>
          <p className="text-gray-600 text-sm mb-6">
            Your doctor account has been created. An admin will review and verify your licence
            before you can sign in. You will be notified when your account is approved.
          </p>
          <Link to="/login" className="text-blue-600 hover:underline text-sm font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">MedÉire</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        {/* Role selector */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
          {['patient', 'doctor'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                role === r ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" value={form.name} onChange={set('name')} required placeholder="Jane Murphy" />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} required placeholder="jane@example.ie" />
          <Input label="Password (min 8 chars)" type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" minLength={8} />

          {role === 'patient' && (
            <>
              <Select label="County (optional)" value={form.county} onChange={set('county')}>
                <option value="">— Select county —</option>
                {IRISH_COUNTIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Select label="Gender (optional)" value={form.gender} onChange={set('gender')}>
                <option value="">— Prefer not to say —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
              <Input label="Date of birth (optional)" type="date" value={form.dob} onChange={set('dob')} />
            </>
          )}

          {role === 'doctor' && (
            <>
              <Input label="IMC Licence Number" value={form.licenseNumber} onChange={set('licenseNumber')} required placeholder="IMC12345" />
              <Input label="Specialty" value={form.specialty} onChange={set('specialty')} required placeholder="General Practice" />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
