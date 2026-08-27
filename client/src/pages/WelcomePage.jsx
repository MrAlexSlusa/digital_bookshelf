import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function WelcomePage() {
  const { user } = useAuth();

  return (
    <div className="auth-page">
      <div className="card auth-card welcome-card">
        <h2>Welcome{user?.email ? `, ${user.email}` : ''}! 🎉</h2>
        <p className="muted">
          Your account is ready. Your shelf is empty for now — let's add your first book.
        </p>
        <Link to="/books/new" className="btn btn--primary btn--large">
          + Add your first book
        </Link>
        <p className="muted auth-switch">
          <Link to="/">Skip for now, go to my shelf</Link>
        </p>
      </div>
    </div>
  );
}
