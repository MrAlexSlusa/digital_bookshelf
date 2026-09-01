import { useState } from 'react';
import { api } from '../api.js';
import { useTheme } from './useTheme.js';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function AuthGate({ onAuthenticated }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
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
        {theme === 'dark' ? t('header.dark') : t('header.light')}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <span className="brand-word">{t('header.brand')}</span>
        </div>

        <h1 className="auth-title">{mode === 'login' ? t('auth.welcomeBack') : t('auth.startShelf')}</h1>
        <p className="auth-sub">{mode === 'login' ? t('auth.signInSub') : t('auth.registerSub')}</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">
              {t('auth.email')}
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
              {t('auth.password')}
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
            {submitting ? t('auth.pleaseWait') : mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? t('auth.createOne') : t('auth.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
}
