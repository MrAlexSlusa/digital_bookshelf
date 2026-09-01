export default function SelectionBlock({ item, verb, accent, items, activeIndex, isQuoteCat, onSelect, onOpen }) {
  const metaParts = [item.sub, ...(item.facts || []).slice(0, 2).map((f) => f[1])].filter(Boolean);
  const locked = item.category === 'movies' && item.watched === false;

  return (
    <div className="selection-block">
      <div className="selection-inner">
        <h2 className="selection-title">{isQuoteCat ? `“${item.title}”` : item.title}</h2>
        <p className="selection-meta">{metaParts.join('  ·  ')}</p>
        <button type="button" className="btn-pill" onClick={onOpen} disabled={locked}>
          {locked ? '🔒 Not watched yet' : verb}
        </button>
      </div>
      <div className="spine-rail">
        {items.map((it, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={it.id}
              type="button"
              title={it.title}
              className="spine-bar"
              style={{
                width: isActive ? 10 : 5,
                height: isActive ? 32 : 18,
                background: isActive ? accent : 'var(--line)',
              }}
              onClick={() => onSelect(idx)}
            />
          );
        })}
      </div>
    </div>
  );
}
