import { shelfCardStyles } from './styles.js';

export default function Card({ item, shape, dark, glow, motion, d, nudge, gap, leaving, onClick }) {
  const { wrap, card, reflection } = shelfCardStyles({ shape, hue: item.hue, dark, glow, motion, d, nudge, gap, leaving, coverUrl: item.coverUrl });

  return (
    <div style={wrap} onClick={onClick}>
      <div className="shelf-card-hover">
        <div style={card}>
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
        </div>
      </div>
      <div style={reflection} />
    </div>
  );
}
