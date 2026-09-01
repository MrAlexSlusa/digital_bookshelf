import { CATEGORY_ORDER } from './constants.js';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function CategoryTabs({ cat, counts, accent, onSelect }) {
  const { t } = useI18n();
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
            {t(`category.${key}`)}
            <span className="cat-tab-count">{counts[idx]}</span>
          </button>
        );
      })}
    </div>
  );
}
