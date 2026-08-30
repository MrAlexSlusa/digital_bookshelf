import { useEffect, useState } from 'react';
import { api } from './api.js';
import AuthGate from './shelf/AuthGate.jsx';
import ShelfApp from './shelf/ShelfApp.jsx';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out, object = signed in

  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null));
  }, []);

  async function handleSignOut() {
    await api.logout().catch(() => {});
    setUser(null);
  }

  if (user === undefined) {
    return (
      <div className="auth-screen">
        <p className="auth-sub">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthGate onAuthenticated={setUser} />;
  }

  return <ShelfApp user={user} onUserUpdate={setUser} onSignOut={handleSignOut} />;
}
