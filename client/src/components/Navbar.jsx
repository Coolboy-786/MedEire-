import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROLE_DASHBOARD } from '../context/AuthContext';

const ROLE_LABEL = { patient: 'Patient', doctor: 'Doctor', admin: 'Admin' };
const ROLE_COLOR = {
  patient: 'bg-blue-100 text-blue-700',
  doctor:  'bg-green-100 text-green-700',
  admin:   'bg-purple-100 text-purple-700',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <Link
        to={user ? ROLE_DASHBOARD[user.role] : '/'}
        className="text-xl font-bold text-blue-800 tracking-tight"
      >
        MedÉire
      </Link>

      {user && (
        <div className="flex items-center gap-4">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLOR[user.role]}`}>
            {ROLE_LABEL[user.role]}
          </span>
          <span className="text-sm text-gray-700 hidden sm:block">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
