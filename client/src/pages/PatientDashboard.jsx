import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';

const ACTIONS = [
  { icon: '🩺', label: 'Check Symptoms', desc: 'AI triage assessment', path: '/patient/symptoms', active: true },
  { icon: '📅', label: 'Book Appointment', desc: 'Find an available doctor', path: '/patient/book', active: true },
  { icon: '📋', label: 'My History',      desc: 'Past consultations & prescriptions', path: '/patient/history', active: true },
];

const PatientDashboard = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          {user?.county ? `${user.county} · ` : ''}Patient Portal
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ACTIONS.map((item) => (
            <button
              key={item.label}
              onClick={() => item.active && navigate(item.path)}
              className={`text-left bg-white rounded-xl border p-5 transition-all ${
                item.active
                  ? 'border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                  : 'border-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.label}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
