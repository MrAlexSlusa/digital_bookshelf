import CardFace from './CardFace.jsx';
import { shelfCardStyles } from './styles.js';
import { useCoverPalette } from './useCoverPalette.js';

export default function Card({ item, shape, dark, glow, motion, d, nudge, gap, leaving, onClick, onMarkWatched }) {
  const hue = useCoverPalette(item.coverUrl, item.hue ?? 200)[0];
  const { wrap, card, reflection } = shelfCardStyles({ shape, hue, dark, glow, motion, d, nudge, gap, leaving, coverUrl: item.coverUrl });
  const locked = item.watched === false;

  return (
    <div style={wrap} onClick={onClick}>
      <div className="shelf-card-hover">
        <div style={card} className={locked ? 'card-locked' : ''}>
          <CardFace item={item} shape={shape} locked={locked} onMarkWatched={onMarkWatched} />
        </div>
      </div>
      <div style={reflection} />
    </div>
  );
}
