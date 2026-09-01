import { useState } from 'react';
import { CATEGORY_ORDER } from './constants.js';
import { parseImportText } from './importRules.js';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function ImportModal({ onImport, onCancel }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [rows, setRows] = useState(null); // null until previewed
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handlePreview() {
    const parsed = parseImportText(text).map((row, id) => ({ id, ...row }));
    if (!parsed.length) {
      setError(t('import.pasteFirst'));
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
        <h2 className="modal-title">{t('import.title')}</h2>

        {error && <p className="form-error">{error}</p>}

        {rows === null ? (
          <>
            <p className="empty-sub" style={{ marginBottom: 12 }}>
              {t('import.pasteHint')}
            </p>
            <div className="form-field">
              <label htmlFor="import-text">{t('import.yourList')}</label>
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
              {t('import.tipPrefix')} <code>[movie] The Matrix (1999)</code>.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={onCancel}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn-pill" onClick={handlePreview}>
                {t('import.preview')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="empty-sub" style={{ marginBottom: 12 }}>
              {t('import.detected', { count: rows.length, itemWord: t(rows.length === 1 ? 'import.item' : 'import.items') })}
            </p>
            <div className="import-preview-list">
              {rows.map((row) => (
                <div className="import-preview-row" key={row.id}>
                  <select value={row.category} onChange={(e) => updateRow(row.id, 'category', e.target.value)}>
                    {CATEGORY_ORDER.map((key) => (
                      <option key={key} value={key}>
                        {t(`category.${key}`)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                    placeholder={t('import.titlePlaceholder')}
                  />
                  <input
                    type="text"
                    value={row.sub}
                    onChange={(e) => updateRow(row.id, 'sub', e.target.value)}
                    placeholder={t('import.subPlaceholder')}
                  />
                  <input
                    type="text"
                    value={row.year}
                    onChange={(e) => updateRow(row.id, 'year', e.target.value)}
                    placeholder={t('import.yearPlaceholder')}
                    className="import-year-input"
                  />
                  <button type="button" className="icon-remove" onClick={() => removeRow(row.id)} aria-label={t('common.remove')}>
                    ×
                  </button>
                </div>
              ))}
              {!rows.length && <p className="empty-sub">{t('import.nothingLeft')}</p>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setRows(null)} disabled={submitting}>
                {t('import.back')}
              </button>
              <button type="button" className="btn-pill" onClick={handleImport} disabled={submitting || !rows.length}>
                {submitting
                  ? t('import.importing')
                  : t('import.importCount', { count: rows.length, itemWord: t(rows.length === 1 ? 'import.item' : 'import.items') })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
