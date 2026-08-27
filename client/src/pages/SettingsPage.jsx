import { useEffect, useState } from 'react';
import { api } from '../api.js';

const TYPES = [
  { value: 'text', label: 'Free text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'select', label: 'Multiple choice' },
  { value: 'scale', label: 'Scale (1-5)' },
];

export default function SettingsPage() {
  const [fields, setFields] = useState([]);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [optionsText, setOptionsText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .getCustomFields()
      .then(setFields)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setError('');
    try {
      const options =
        type === 'select'
          ? optionsText.split(',').map((s) => s.trim()).filter(Boolean)
          : type === 'scale'
          ? { min: 1, max: 5 }
          : null;
      await api.createCustomField({ label: label.trim(), type, options });
      setLabel('');
      setOptionsText('');
      setType('text');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this field? Existing answers for it will be deleted too.')) return;
    try {
      await api.deleteCustomField(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h2>Settings</h2>
      <section className="card">
        <h3>Custom survey fields</h3>
        <p className="muted">
          These extra questions appear on every book's survey, alongside the built-in ones.
        </p>
        {fields.length === 0 ? (
          <p className="muted">No custom fields yet.</p>
        ) : (
          <ul className="field-list">
            {fields.map((f) => (
              <li key={f.id}>
                <span>
                  <strong>{f.label}</strong> — {TYPES.find((t) => t.value === f.type)?.label || f.type}
                  {f.type === 'select' && f.options ? ` (${f.options.join(', ')})` : ''}
                </span>
                <button className="btn btn--danger btn--small" onClick={() => handleDelete(f.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="add-field-form">
          <h4>Add a field</h4>
          {error && <p className="error">{error}</p>}
          <label className="field">
            <span>Question label</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Would you buy the sequel?" />
          </label>
          <label className="field">
            <span>Answer type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {type === 'select' && (
            <label className="field">
              <span>Choices (comma-separated)</span>
              <input
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="e.g. Yes, No, Maybe"
              />
            </label>
          )}
          <button type="submit" className="btn btn--primary">
            Add field
          </button>
        </form>
      </section>
    </div>
  );
}
