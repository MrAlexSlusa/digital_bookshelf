import { useEffect, useRef, useState } from 'react';
import { CATEGORY_ORDER, subLabelFor } from './constants.js';
import { accentColors } from './styles.js';
import { extractDominantHue, fetchBookCover, fetchMoviePoster, fetchWikipediaImage } from './coverLookup.js';
import { useI18n } from '../i18n/I18nContext.jsx';

// Books/movies search by title; articles/quotes have no cover art of their
// own, so they search by who/what they're attributed to (the sub field).
const COVER_SOURCE = { books: 'Open Library', movies: 'Wikipedia', articles: 'Wikipedia', quotes: 'Wikipedia' };
const COVER_QUERY_FIELD = { books: 'title', movies: 'title', articles: 'sub', quotes: 'sub' };

function factsToRows(facts) {
  return (facts || []).map(([k, v]) => ({ k, v }));
}

export default function ItemFormModal({ initial, defaultCategory, dark, onSubmit, onCancel, onSubmittingChange }) {
  const { t } = useI18n();
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

  const coverMeta = COVER_SOURCE[category]
    ? {
        label: t(`itemForm.coverLabel.${category}`),
        source: COVER_SOURCE[category],
        noun: t(`itemForm.coverNoun.${category}`),
        queryField: COVER_QUERY_FIELD[category],
      }
    : null;

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
      setError(t('itemForm.titleRequired'));
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
        <h2 className="modal-title">{isEdit ? t('itemForm.editTitle') : t('itemForm.addTitle')}</h2>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="item-category">{t('itemForm.category')}</label>
              <select id="item-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {t(`category.${key}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="item-year">{t('itemForm.year')}</label>
              <input id="item-year" type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="item-title">{category === 'quotes' ? t('itemForm.theQuote') : t('itemForm.title')}</label>
            <input id="item-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-field">
            <label htmlFor="item-sub">{subLabelFor(category, t)}</label>
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
                    placeholder={t('itemForm.autoFillsFrom', {
                      field: coverMeta.queryField === 'title' ? t('itemForm.coverField.title') : subLabelFor(category, t).toLowerCase(),
                    })}
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
                      {t('itemForm.autoDetect')}
                    </button>
                  )}
                  {!coverTouchedRef.current && coverStatus === 'loading' && (
                    <span className="cover-lookup-status">{t('itemForm.lookingUp', { noun: coverMeta.noun })}</span>
                  )}
                  {!coverTouchedRef.current && coverStatus === 'found' && (
                    <span className="cover-lookup-status">{t('itemForm.matchedFrom', { source: coverMeta.source })}</span>
                  )}
                  {!coverTouchedRef.current && coverStatus === 'none' && (
                    <span className="cover-lookup-status">{t('itemForm.noneFound', { noun: coverMeta.noun })}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-grid">
            <div className="form-field">
              <label>{t('itemForm.rating')}</label>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn${rating >= n ? ' filled' : ''}`}
                    onClick={() => setRating((r) => (r === n ? null : n))}
                    aria-label={t(n === 1 ? 'itemForm.starLabel' : 'itemForm.starsLabel', { n })}
                  >
                    {rating >= n ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="item-hue">
                {t('itemForm.colour')}
                {coverUrl && !hueTouchedRef.current ? (matchingColor ? t('itemForm.matchingCover') : t('itemForm.matchedToCover')) : ''}
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
            <label htmlFor="item-verdict">{t('itemForm.verdict')}</label>
            <input
              id="item-verdict"
              type="text"
              value={verdict}
              onChange={(e) => setVerdict(e.target.value)}
              placeholder={t('itemForm.verdictPlaceholder')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="item-impression">{t('itemForm.impressions')}</label>
            <textarea id="item-impression" value={impression} onChange={(e) => setImpression(e.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="item-tags">{t('itemForm.tags')}</label>
            <input
              id="item-tags"
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder={t('itemForm.tagsPlaceholder')}
            />
          </div>

          <div className="form-field">
            <label>{t('itemForm.details')}</label>
            {factRows.map((row, idx) => (
              <div className="repeat-row" key={idx}>
                <input
                  type="text"
                  placeholder={t('itemForm.labelPlaceholder')}
                  value={row.k}
                  onChange={(e) => updateFactRow(idx, 'k', e.target.value)}
                />
                <input
                  type="text"
                  placeholder={t('itemForm.valuePlaceholder')}
                  value={row.v}
                  onChange={(e) => updateFactRow(idx, 'v', e.target.value)}
                />
                <button type="button" className="icon-remove" onClick={() => removeFactRow(idx)} aria-label={t('common.remove')}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="link-btn" onClick={addFactRow}>
              {t('itemForm.addDetail')}
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-pill" disabled={submitting}>
              {submitting ? t('account.saving') : isEdit ? t('itemForm.saveChanges') : t('itemForm.addIt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
