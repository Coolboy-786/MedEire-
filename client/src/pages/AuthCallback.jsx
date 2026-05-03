import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getProfile } from '../api/authApi';
import { ROLE_DASHBOARD } from '../context/AuthContext';

// Landing page for the Google OAuth redirect.
// The server redirects here with ?token=<jwt> after a successful OAuth dance.
const AuthCallback = () => {
  const [params]           = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate           = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // Store the token then fetch the full profile so we have role info.
    localStorage.setItem('medeire_token', token);
    getProfile()
      .then(({ data }) => {
        loginWithToken(token, data.user);
        navigate(ROLE_DASHBOARD[data.user.role] || '/', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('medeire_token');
        navigate('/login?error=oauth_failed', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
