import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../useUserContext';
import Input from '../common/Input';
import Button from '../common/Button';
import logo from './../../logos/logo__full-color.svg';

const LoginPage = () => {
  let navigate = useNavigate();
  const { user, refresh } = useUserContext();

  if (user && user.isAuthenticated === true) {
    refresh();
    navigate('/');
  }

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/login', { username, password });
      if (response.data === 'loginSuccessful') {
        refresh();
        navigate('/');
      }
    } catch (error) {
      console.error(error.message);
      setError('Incorrect username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[1.375rem] shadow-[var(--shadow-soft)] p-8 sm:p-10">

          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Vant" className="h-12 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-heading)]">Welcome Back!</h1>
            <p className="text-[var(--text-body)] mt-2">Sign in to manage your team and shifts</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Username"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full justify-center !bg-blue-600 hover:!bg-blue-700 text-white shadow-lg shadow-blue-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer / Links */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <a href="/client/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
              Are you a client? Client Portal →
            </a>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Vant Field Management. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
