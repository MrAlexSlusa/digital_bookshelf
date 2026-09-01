import { useMemo } from 'react';
import { CATEGORY_META, CATEGORY_ORDER } from './constants.js';

function dayKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthLabel(y, m) {
  return new Date(y, m, 1).toLocaleDateString(undefined, { month: 'short' });
}

function last6Months(items) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ y: d.getFullYear(), m: d.getMonth(), label: monthLabel(d.getFullYear(), d.getMonth()), count: 0 });
  }
  for (const item of items) {
    const d = new Date(item.created_at);
    const idx = buckets.findIndex((b) => b.y === d.getFullYear() && b.m === d.getMonth());
    if (idx !== -1) buckets[idx].count += 1;
  }
  return buckets;
}

export default function StatsView({ items, dark, accent, onClose }) {
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
    const months = last6Months(items);
    const maxMonth = Math.max(1, ...months.map((b) => b.count));
    return { counts, firstDate, activeDays: days.size, months, maxMonth };
  }, [items]);

  const memberSince = stats.firstDate
    ? stats.firstDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '—';

  return (
    <main className="stats-main">
      <button type="button" className="back-btn" onClick={onClose}>
        <span aria-hidden="true">←</span>
        <span>Back to the shelf</span>
      </button>

      <div className="stats-hero">
        <div className="stats-hero-meta">
          <p className="section-label">Account stats</p>
          <p className="stats-since">Member since {memberSince}</p>
        </div>
      </div>

      <div className="stats-grid">
        {CATEGORY_ORDER.map((key) => (
          <div className="stats-tile" key={key}>
            <p className="stats-tile-num">{stats.counts[key]}</p>
            <p className="stats-tile-label">{CATEGORY_META[key].label}</p>
          </div>
        ))}
      </div>

      <div className="stats-grid stats-grid-secondary">
        <div className="stats-tile">
          <p className="stats-tile-num">{stats.activeDays}</p>
          <p className="stats-tile-label">Active days</p>
        </div>
        <div className="stats-tile">
          <p className="stats-tile-num">{items.length}</p>
          <p className="stats-tile-label">Things kept</p>
        </div>
      </div>

      <div className="stats-chart-block">
        <p className="section-label">Last 6 months</p>
        <div className="stats-chart">
          {stats.months.map((b) => (
            <div className="stats-bar-col" key={`${b.y}-${b.m}`}>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{ height: `${(b.count / stats.maxMonth) * 100}%`, background: accent }}
                  title={`${b.count} added`}
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
