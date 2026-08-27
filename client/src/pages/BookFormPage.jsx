import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import SurveyField from '../components/SurveyField.jsx';

const EMPTY_BOOK = {
  title: '',
  author: '',
  cover_url: '',
  status: 'read',
  date_started: '',
  date_finished: '',
  grade: '',
  impressions: '',
};

export default function BookFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [book, setBook] = useState(EMPTY_BOOK);
  const [responses, setResponses] = useState({});
  const [schema, setSchema] = useState({ fixedQuestions: [], customFields: [] });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSchema().then(setSchema).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api
      .getBook(id)
      .then((data) => {
        const { responses: r, ...rest } = data;
        setBook({ ...EMPTY_BOOK, ...rest });
        setResponses(r || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function updateField(field, value) {
    setBook((b) => ({ ...b, [field]: value }));
  }

  function updateResponse(key, value) {
    setResponses((r) => ({ ...r, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!book.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...book,
        grade: book.grade === '' ? null : Number(book.grade),
      };
      const saved = isNew ? await api.createBook(payload) : await api.updateBook(id, payload);
      await api.saveResponses(saved.id, responses);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this book and all its notes? This cannot be undone.')) return;
    setSaving(true);
    try {
      await api.deleteBook(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  const allQuestions = [...schema.fixedQuestions, ...schema.customFields];

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <h2>{isNew ? 'Add a book' : 'Edit book'}</h2>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h3>Details</h3>
        <label className="field">
          <span>Title *</span>
          <input value={book.title} onChange={(e) => updateField('title', e.target.value)} required />
        </label>
        <label className="field">
          <span>Author</span>
          <input value={book.author || ''} onChange={(e) => updateField('author', e.target.value)} />
        </label>
        <label className="field">
          <span>Cover image URL</span>
          <input value={book.cover_url || ''} onChange={(e) => updateField('cover_url', e.target.value)} />
        </label>
        <label className="field">
          <span>Status</span>
          <select value={book.status} onChange={(e) => updateField('status', e.target.value)}>
            <option value="want_to_read">Want to read</option>
            <option value="reading">Reading</option>
            <option value="read">Read</option>
          </select>
        </label>
        <div className="field-row">
          <label className="field">
            <span>Date started</span>
            <input type="date" value={book.date_started || ''} onChange={(e) => updateField('date_started', e.target.value)} />
          </label>
          <label className="field">
            <span>Date finished</span>
            <input type="date" value={book.date_finished || ''} onChange={(e) => updateField('date_finished', e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Grade (0-10)</span>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={book.grade ?? ''}
            onChange={(e) => updateField('grade', e.target.value)}
          />
        </label>
      </section>

      <section className="card">
        <h3>Impressions</h3>
        <textarea
          rows={6}
          placeholder="Free-form thoughts about this book…"
          value={book.impressions || ''}
          onChange={(e) => updateField('impressions', e.target.value)}
        />
      </section>

      {allQuestions.length > 0 && (
        <section className="card">
          <h3>Survey</h3>
          {allQuestions.map((q) => (
            <SurveyField
              key={q.key}
              question={q}
              value={responses[q.key]}
              onChange={(value) => updateResponse(q.key, value)}
            />
          ))}
        </section>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {!isNew && (
          <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={saving}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
