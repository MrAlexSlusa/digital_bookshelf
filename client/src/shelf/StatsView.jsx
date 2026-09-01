import { useMemo } from 'react';
import { CATEGORY_ORDER } from './constants.js';
import { useI18n } from '../i18n/I18nContext.jsx';

function dayKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthLabel(y, m, locale) {
  return new Date(y, m, 1).toLocaleDateString(locale, { month: 'short' });
}

function last6Months(items, locale) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ y: d.getFullYear(), m: d.getMonth(), label: monthLabel(d.getFullYear(), d.getMonth(), locale), count: 0 });
  }
  for (const item of items) {
    const d = new Date(item.created_at);
    const idx = buckets.findIndex((b) => b.y === d.getFullYear() && b.m === d.getMonth());
    if (idx !== -1) buckets[idx].count += 1;
  }
  return buckets;
}

export default function StatsView({ items, dark, accent, onClose }) {
  const { t, language } = useI18n();
  const stats = useMemo(() => {
    const counts = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0]));
    const days = new Set();
    let firstDate = null;
    for (const item of items) {
      if (counts[item.category] !== undefined) counts[item.category] += 1;
      days.add(dayKey(item.created_at));
      const d = new Date(item.created_at);
      if (!firstDate || d < firstDate) firstDate = d;
    }
    const months = last6Months(items, language);
    const maxMonth = Math.max(1, ...months.map((b) => b.count));
    return { counts, firstDate, activeDays: days.size, months, maxMonth };
  }, [items, language]);

  const memberSince = stats.firstDate
    ? stats.firstDate.toLocaleDateString(language, { month: 'long', year: 'numeric' })
    : '—';

  return (
    <main className="stats-main">
      <button type="button" className="back-btn" onClick={onClose}>
        <span aria-hidden="true">←</span>
        <span>{t('stats.back')}</span>
      </button>

      <div className="stats-hero">
        <div className="stats-hero-meta">
          <p className="section-label">{t('stats.accountStats')}</p>
          <p className="stats-since">{t('stats.memberSince', { date: memberSince })}</p>
        </div>
      </div>

      <div className="stats-grid">
        {CATEGORY_ORDER.map((key) => (
          <div className="stats-tile" key={key}>
            <p className="stats-tile-num">{stats.counts[key]}</p>
            <p className="stats-tile-label">{t(`category.${key}`)}</p>
          </div>
        ))}
      </div>

      <div className="stats-grid stats-grid-secondary">
        <div className="stats-tile">
          <p className="stats-tile-num">{stats.activeDays}</p>
          <p className="stats-tile-label">{t('stats.activeDays')}</p>
        </div>
        <div className="stats-tile">
          <p className="stats-tile-num">{items.length}</p>
          <p className="stats-tile-label">{t('stats.thingsKept')}</p>
        </div>
      </div>

      <div className="stats-chart-block">
        <p className="section-label">{t('stats.last6Months')}</p>
        <div className="stats-chart">
          {stats.months.map((b) => (
            <div className="stats-bar-col" key={`${b.y}-${b.m}`}>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{ height: `${(b.count / stats.maxMonth) * 100}%`, background: accent }}
                  title={t('stats.added', { count: b.count })}
                />
              </div>
              <p className="stats-bar-label">{b.label}</p>
              <p className="stats-bar-count">{b.count}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
