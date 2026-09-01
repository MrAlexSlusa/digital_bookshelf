import { useEffect, useRef, useState } from 'react';
import { subLabelFor } from './constants.js';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function SearchBar({ query, setQuery, results, onJump }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => setHi(0), [query]);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function pick(result) {
    onJump(result.item);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[hi]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className="search-bar" ref={rootRef}>
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        type="text"
        className="search-input"
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {query && (
        <button type="button" className="search-clear" aria-label={t('search.clear')} onClick={() => setQuery('')}>
          ×
        </button>
      )}
      {showDropdown && (
        <div className="search-dropdown">
          {results.length === 0 ? (
            <div className="search-empty">{t('search.noMatches', { query })}</div>
          ) : (
            results.map((r, i) => (
              <button
                type="button"
                key={r.item.id}
                className={`search-result${i === hi ? ' active' : ''}`}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(r)}
              >
                <span className="search-result-title">{r.item.title}</span>
                <span className="search-result-meta">
                  {r.categoryLabel}
                  {r.item.sub ? ` · ${subLabelFor(r.item.category, t)}: ${r.item.sub}` : ''}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
