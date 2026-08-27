import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import BookCard from '../components/BookCard.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'reading', label: 'Reading' },
  { key: 'read', label: 'Read' },
  { key: 'want_to_read', label: 'Want to read' },
];

export default function BookshelfPage() {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getBooks()
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchesFilter = filter === 'all' || b.status === filter;
      const matchesQuery =
        !query ||
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        (b.author || '').toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [books, filter, query]);

  if (loading) return <p className="muted">Loading your shelf…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={f.key === filter ? 'chip chip--active' : 'chip'}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="search"
          placeholder="Search title or author…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="muted">No books here yet. Add your first one!</p>
      ) : (
        <div className="book-grid">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
