import { Link } from 'react-router-dom';
import GradeStars from './GradeStars.jsx';

const STATUS_LABELS = {
  want_to_read: 'Want to read',
  reading: 'Reading',
  read: 'Read',
};

const SPINE_COLORS = ['#8b5e3c', '#6b7f59', '#4d6a8f', '#a4553f', '#7a5c8e', '#b08a3e'];

function spineColor(title) {
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) % SPINE_COLORS.length;
  return SPINE_COLORS[hash];
}

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-card__spine" style={{ background: spineColor(book.title) }}>
        {book.cover_url ? (
          <img src={book.cover_url} alt="" className="book-card__cover" />
        ) : (
          <span className="book-card__initial">{book.title.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="book-card__body">
        <div className="book-card__title">{book.title}</div>
        {book.author && <div className="book-card__author">{book.author}</div>}
        <div className="book-card__status">{STATUS_LABELS[book.status] || book.status}</div>
        <GradeStars grade={book.grade} />
      </div>
    </Link>
  );
}
