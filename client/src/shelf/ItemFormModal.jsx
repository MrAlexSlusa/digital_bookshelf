import { useEffect, useRef, useState } from 'react';
import { CATEGORY_META, CATEGORY_ORDER, subLabelFor } from './constants.js';
import { accentColors } from './styles.js';
import { extractDominantHue, fetchBookCover, fetchMoviePoster, fetchWikipediaImage } from './coverLookup.js';

// Books/movies search by title; articles/quotes have no cover art of their
// own, so they search by who/what they're attributed to (the sub field).
const COVER_META = {
  books: { label: 'Cover image', source: 'Open Library', noun: 'cover', queryField: 'title' },
  movies: { label: 'Poster image', source: 'Wikipedia', noun: 'poster', queryField: 'title' },
  articles: { label: 'Publication image', source: 'Wikipedia', noun: 'image', queryField: 'sub' },
  quotes: { label: 'Portrait', source: 'Wikipedia', noun: 'portrait', queryField: 'sub' },
};

function factsToRows(facts) {
  return (facts || []).map(([k, v]) => ({ k, v }));
}

export default function ItemFormModal({ initial, defaultCategory, dark, onSubmit, onCancel, onSubmittingChange }) {
  const isEdit = Boolean(initial);
  const [category, setCategory] = useState(initial?.category || defaultCategory || 'books');
  const [title, setTitle] = useState(initial?.title || '');
  const [sub, setSub] = useState(initial?.sub || '');
  const [year, setYear] = useState(initial?.year || '');
  const [rating, setRating] = useState(initial?.rating ?? null);
  const [verdict, setVerdict] = useState(initial?.verdict || '');
  const [impression, setImpression] = useState(initial?.impression || '');
  const [hue, setHue] = useState(initial?.hue ?? Math.floor(Math.random() * 360));
  const [tagsText, setTagsText] = useState((initial?.tags || []).join(', '));
  const [factRows, setFactRows] = useState(factsToRows(initial?.facts).length ? factsToRows(initial?.facts) : [{ k: '', v: '' }]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl || '');
  const [coverStatus, setCoverStatus] = useState('idle'); // idle | loading | found | none
  const [matchingColor, setMatchingColor] = useState(false);
  const coverLookupRef = useRef({ token: 0, controller: null });
  const coverTouchedRef = useRef(Boolean(initial?.coverUrl));
  const hueTouchedRef = useRef(false);

  const { accent } = accentColors(hue, dark);

  const coverMeta = COVER_META[category];

  async function matchColorToCover(url, signal) {
    setMatchingColor(true);
    const matchedHue = await extractDominantHue(url, signal);
    if (signal?.aborted) return;
    setMatchingColor(false);
    if (matchedHue != null && !hueTouchedRef.current) setHue(matchedHue);
  }

  useEffect(() => {
    if (!coverMeta || coverTouchedRef.current) return undefined;
    const query = (coverMeta.queryField === 'title' ? title : sub).trim();
    if (!query) {
      setCoverStatus('idle');
      return undefined;
    }

    const token = ++coverLookupRef.current.token;
    coverLookupRef.current.controller?.abort();
    const controller = new AbortController();
    coverLookupRef.current.controller = controller;

    const timer = setTimeout(async () => {
      setCoverStatus('loading');
      try {
        let found;
        if (category === 'movies') found = await fetchMoviePoster(query, controller.signal, year);
        else if (category === 'books') found = await fetchBookCover(query, sub, controller.signal);
        else found = await fetchWikipediaImage(query, controller.signal);
        if (coverLookupRef.current.token !== token) return;
        setCoverUrl(found || '');
        setCoverStatus(found ? 'found' : 'none');
        if (found) await matchColorToCover(found, controller.signal);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (coverLookupRef.current.token === token) setCoverStatus('none');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, sub, year, category, coverMeta]);

  async function handleCoverUrlBlur() {
    if (coverUrl.trim()) await matchColorToCover(coverUrl.trim());
  }

  function updateFactRow(idx, field, value) {
    setFactRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function addFactRow() {
    setFactRows((rows) => [...rows, { k: '', v: '' }]);
  }
  function removeFactRow(idx) {
    setFactRows((rows) => rows.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      await onSubmit({
        category,
        title: title.trim(),
        sub: sub.trim(),
        year: year.trim(),
        rating,
        verdict: verdict.trim(),
        impression: impression.trim(),
        hue,
        coverUrl: coverUrl.trim(),
        tags: tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        facts: factRows.filter((r) => r.k.trim() && r.v.trim()).map((r) => [r.k.trim(), r.v.trim()]),
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-panel">
        <h2 className="modal-title">{isEdit ? 'Edit item' : 'Add something new'}</h2>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="item-category">Category</label>
              <select id="item-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_META[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="item-year">Year</label>
              <input id="item-year" type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="item-title">{category === 'quotes' ? 'The quote' : 'Title'}</label>
            <input id="item-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-field">
            <label htmlFor="item-sub">{subLabelFor(category)}</label>
            <input id="item-sub" type="text" value={sub} onChange={(e) => setSub(e.target.value)} />
          </div>

          {coverMeta && (
            <div className="form-field">
              <label htmlFor="item-cover">{coverMeta.label}</label>
              <div className="cover-lookup-row">
                {coverUrl && <img className="cover-lookup-preview" src={coverUrl} alt="" />}
                <div className="cover-lookup-controls">
                  <input
                    id="item-cover"
                    type="text"
                    value={coverUrl}
                    onChange={(e) => {
                      coverTouchedRef.current = true;
                      setCoverUrl(e.target.value);
                      setCoverStatus('idle');
                    }}
                    onBlur={handleCoverUrlBlur}
                    placeholder={`Auto-fills from the ${coverMeta.queryField === 'title' ? 'title' : subLabelFor(category).toLowerCase()}`}
                  />
                  {coverTouchedRef.current && (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        coverTouchedRef.current = false;
                        setCoverUrl('');
                        setCoverStatus('idle');
                      }}
                    >
                      Auto-detect
                    </button>
                  )}
                  {!coverTouchedRef.current && coverStatus === 'loading' && (
                    <span className="cover-lookup-status">Looking up {coverMeta.noun}…</span>
                  )}
                  {!coverTouchedRef.current && coverStatus === 'found' && (
                    <span className="cover-lookup-status">Matched from {coverMeta.source}</span>
                  )}
                  {!coverTouchedRef.current && coverStatus === 'none' && (
                    <span className="cover-lookup-status">
                      No {coverMeta.noun} found — using the plain design instead
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-grid">
            <div className="form-field">
              <label>Rating</label>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn${rating >= n ? ' filled' : ''}`}
                    onClick={() => setRating((r) => (r === n ? null : n))}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  >
                    {rating >= n ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="item-hue">
                Colour{coverUrl && !hueTouchedRef.current ? (matchingColor ? ' (matching cover…)' : ' (matched to cover)') : ''}
              </label>
              <div className="hue-row">
                <input
                  id="item-hue"
                  type="range"
                  min="0"
                  max="359"
                  value={hue}
                  onChange={(e) => {
                    hueTouchedRef.current = true;
                    setHue(Number(e.target.value));
                  }}
                />
                <span className="hue-swatch" style={{ background: accent }} />
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="item-verdict">Verdict</label>
            <input id="item-verdict" type="text" value={verdict} onChange={(e) => setVerdict(e.target.value)} placeholder="Read it twice" />
          </div>

          <div className="form-field">
            <label htmlFor="item-impression">Impressions</label>
            <textarea id="item-impression" value={impression} onChange={(e) => setImpression(e.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="item-tags">Tags (comma separated)</label>
            <input id="item-tags" type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="Fiction, Re-read" />
          </div>

          <div className="form-field">
            <label>Details</label>
            {factRows.map((row, idx) => (
              <div className="repeat-row" key={idx}>
                <input
                  type="text"
                  placeholder="Label, e.g. Pages"
                  value={row.k}
                  onChange={(e) => updateFactRow(idx, 'k', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Value, e.g. 304"
                  value={row.v}
                  onChange={(e) => updateFactRow(idx, 'v', e.target.value)}
                />
                <button type="button" className="icon-remove" onClick={() => removeFactRow(idx)} aria-label="Remove">
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="link-btn" onClick={addFactRow}>
              + Add detail
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-pill" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add it'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
