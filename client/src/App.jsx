import { NavLink, Route, Routes } from 'react-router-dom';
import BookshelfPage from './pages/BookshelfPage.jsx';
import BookFormPage from './pages/BookFormPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
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
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<BookshelfPage />} />
          <Route path="/books/new" element={<BookFormPage />} />
          <Route path="/books/:id" element={<BookFormPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
