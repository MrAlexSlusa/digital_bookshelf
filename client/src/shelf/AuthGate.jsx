import { useState } from 'react';
import { api } from '../api.js';
import { useTheme } from './useTheme.js';

export default function AuthGate({ onAuthenticated }) {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = mode === 'login' ? await api.login(email, password) : await api.register(email, password);
      onAuthenticated(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <button type="button" className="pill-btn auth-theme-toggle" onClick={toggleTheme}>
        <span className="theme-dot" />
        {theme === 'dark' ? 'Dark' : 'Light'}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <span className="brand-word">Shelf</span>
        </div>

        <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Start your shelf'}</h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Sign in to read back everything you kept.'
            : 'Books, movies, articles and quotes — one place for everything you keep.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="auth-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="auth-input"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'register' ? 8 : undefined}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-pill auth-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
