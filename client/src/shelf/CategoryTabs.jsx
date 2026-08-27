import { CATEGORY_META, CATEGORY_ORDER } from './constants.js';

export default function CategoryTabs({ cat, counts, accent, onSelect }) {
  return (
    <div className="cat-tabs">
      {CATEGORY_ORDER.map((key, idx) => {
        const active = idx === cat;
        return (
          <button
            key={key}
            type="button"
            className={`cat-tab${active ? ' active' : ''}`}
            style={{ borderBottomColor: active ? accent : 'transparent' }}
            onClick={() => onSelect(idx)}
          >
            {CATEGORY_META[key].label}
            <span className="cat-tab-count">{counts[idx]}</span>
          </button>
        );
      })}
    </div>
  );
}
