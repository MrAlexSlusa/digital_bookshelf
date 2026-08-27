import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import BookshelfPage from './pages/BookshelfPage.jsx';
import BookFormPage from './pages/BookFormPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="muted">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Loading…</p>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">📚 Digital Bookshelf</div>
        {user && (
          <nav>
            <NavLink to="/" end>
              Bookshelf
            </NavLink>
            <NavLink to="/books/new">Add Book</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>
        )}
        {user && (
          <div className="topbar__user">
            <span>{user.email}</span>
            <button className="btn btn--small" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="content">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <Routes>
            <Route
              path="/signup"
              element={
                <RedirectIfAuthed>
                  <SignupPage />
                </RedirectIfAuthed>
              }
            />
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <LoginPage />
                </RedirectIfAuthed>
              }
            />
            <Route
              path="/welcome"
              element={
                <RequireAuth>
                  <WelcomePage />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <BookshelfPage />
                </RequireAuth>
              }
            />
            <Route
              path="/books/new"
              element={
                <RequireAuth>
                  <BookFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/books/:id"
              element={
                <RequireAuth>
                  <BookFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <SettingsPage />
                </RequireAuth>
              }
            />
          </Routes>
        )}
      </main>
    </div>
  );
}
