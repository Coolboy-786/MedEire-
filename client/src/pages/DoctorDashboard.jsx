import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';

const ACTIONS = [
  { icon: '🗓️', label: 'Set Availability', desc: 'Manage your weekly slots', path: '/doctor/availability', active: true },
  { icon: '📋', label: 'My Appointments',  desc: 'View & complete consultations', path: '/doctor/appointments', active: true },
];

const DoctorDashboard = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Dr. {user?.name} 👨‍⚕️</h2>
        <p className="text-gray-500 text-sm mb-2">{user?.specialty} · Doctor Portal</p>
        <div className="inline-flex items-center gap-1.5 mb-8 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs text-green-700 font-medium">Verified</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACTIONS.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-green-400 hover:shadow-md transition-all"
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

export default DoctorDashboard;
