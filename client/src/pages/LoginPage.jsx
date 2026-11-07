import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage({ onNavigateRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@sweety.app');
    setPassword('password123');
    setError('');
    try {
      setLoading(true);
      await login('demo@sweety.app', 'password123');
    } catch (err) {
      setError(err.message || 'Failed to login with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 items-center justify-center text-white shadow-lg shadow-rose-200 mb-3">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sweety</h2>
        <p className="mt-1 text-sm text-slate-600">Blood Glucose Tracker for Diabetes Care</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-start space-x-2 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Login Helper */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Sign In as Demo Patient (Sarah Jenkins)</span>
            </button>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              Don’t have an account yet?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
