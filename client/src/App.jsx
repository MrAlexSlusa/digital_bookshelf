import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import BookFormPage from './pages/BookFormPage.jsx';
import BookshelfPage from './pages/BookshelfPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <p className="muted auth-loading">Loading…</p>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">📚 Digital Bookshelf</div>
        <nav>
          <NavLink to="/" end>
            Bookshelf
          </NavLink>
          <NavLink to="/books/new">Add Book</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="topbar-user">
          <span>{user.email}</span>
          <button className="btn btn--link" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<BookshelfPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/books/new" element={<BookFormPage />} />
          <Route path="/books/:id" element={<BookFormPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
