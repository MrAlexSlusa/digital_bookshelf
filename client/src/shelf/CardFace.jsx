// The content painted onto a card's face — split out of Card.jsx so
// CardStack.jsx (franchise stacks) can reuse the exact same markup per item.
export default function CardFace({ item, shape, locked, onMarkWatched }) {
  return (
    <>
      <div className="card-texture" />

      {shape.kind === 'spine' && <div className="card-spine-strip" />}
      {shape.kind === 'film' && (
        <>
          <div className="card-film-top" />
          <div className="card-film-bottom" />
        </>
      )}

      {shape.kind === 'quote' && (
        <div className="card-content-quote">
          <p className="card-quote-text">“{item.title}”</p>
          <p className="card-quote-sub">{item.sub}</p>
        </div>
      )}

      {shape.kind === 'sheet' && (
        <div className="card-content-sheet">
          <div>
            <p className="card-sheet-sub">{item.sub}</p>
            <h3 className="card-sheet-title">{item.title}</h3>
          </div>
          <div className="card-sheet-footer">
            <div className="card-sheet-rule" />
            <span className="card-sheet-year">{item.year}</span>
          </div>
        </div>
      )}

      {(shape.kind === 'spine' || shape.kind === 'film') && (
        <div className="card-content-portrait">
          {!(shape.kind === 'spine' && item.coverUrl) && (
            <div>
              <div className="card-portrait-rule" />
              <h3 className="card-portrait-title">{item.title}</h3>
            </div>
          )}
          <div>
            <p className="card-portrait-sub">{item.sub}</p>
            <p className="card-portrait-year">{item.year}</p>
          </div>
        </div>
      )}

      {locked && (
        <div className="card-lock-overlay">
          <span className="card-lock-icon" aria-hidden="true">🔒</span>
          <span className="card-lock-label">Not watched yet</span>
          {onMarkWatched && (
            <button
              type="button"
              className="card-lock-btn"
              onClick={(e) => {
                e.stopPropagation();
                onMarkWatched(item);
              }}
            >
              Mark watched
            </button>
          )}
        </div>
      )}
    </>
  );
}
