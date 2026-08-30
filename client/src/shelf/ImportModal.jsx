import { useState } from 'react';
import { CATEGORY_META, CATEGORY_ORDER } from './constants.js';
import { parseImportText } from './importRules.js';

export default function ImportModal({ onImport, onCancel }) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState(null); // null until previewed
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handlePreview() {
    const parsed = parseImportText(text).map((row, id) => ({ id, ...row }));
    if (!parsed.length) {
      setError('Paste at least one line first');
      return;
    }
    setError(null);
    setRows(parsed);
  }

  function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleImport() {
    if (!rows?.length) return;
    setSubmitting(true);
    setError(null);
    try {
      await onImport(rows.map(({ category, title, sub, year }) => ({ category, title, sub, year })));
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-panel">
        <h2 className="modal-title">Import a list</h2>

        {error && <p className="form-error">{error}</p>}

        {rows === null ? (
          <>
            <p className="empty-sub" style={{ marginBottom: 12 }}>
              Paste one book, movie, article or quote per line. We'll guess the category — you can
              fix it before anything is added.
            </p>
            <div className="form-field">
              <label htmlFor="import-text">Your list</label>
              <textarea
                id="import-text"
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  'Dune - Frank Herbert\n"Not all those who wander are lost" — J.R.R. Tolkien\nParasite (2019)\nhttps://example.com/some-great-essay'
                }
              />
            </div>
            <p className="empty-sub" style={{ fontSize: 12 }}>
              Tip: force a category with a prefix, e.g. <code>[movie] The Matrix (1999)</code>.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className="btn-pill" onClick={handlePreview}>
                Preview
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="empty-sub" style={{ marginBottom: 12 }}>
              {rows.length} item{rows.length === 1 ? '' : 's'} detected. Adjust anything that looks wrong, then import.
            </p>
            <div className="import-preview-list">
              {rows.map((row) => (
                <div className="import-preview-row" key={row.id}>
                  <select value={row.category} onChange={(e) => updateRow(row.id, 'category', e.target.value)}>
                    {CATEGORY_ORDER.map((key) => (
                      <option key={key} value={key}>
                        {CATEGORY_META[key].label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={row.sub}
                    onChange={(e) => updateRow(row.id, 'sub', e.target.value)}
                    placeholder="Author / director / attribution"
                  />
                  <input
                    type="text"
                    value={row.year}
                    onChange={(e) => updateRow(row.id, 'year', e.target.value)}
                    placeholder="Year"
                    className="import-year-input"
                  />
                  <button type="button" className="icon-remove" onClick={() => removeRow(row.id)} aria-label="Remove">
                    ×
                  </button>
                </div>
              ))}
              {!rows.length && <p className="empty-sub">Nothing left to import.</p>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setRows(null)} disabled={submitting}>
                Back
              </button>
              <button type="button" className="btn-pill" onClick={handleImport} disabled={submitting || !rows.length}>
                {submitting ? 'Importing…' : `Import ${rows.length} item${rows.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
