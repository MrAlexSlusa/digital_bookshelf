import CardFace from './CardFace.jsx';
import { frontOf } from './franchiseStacks.js';
import { shelfCardStyles } from './styles.js';
import { useCoverPalette } from './useCoverPalette.js';

// One item of a franchise stack: same slot-level `d` as its siblings (so it
// sizes/fades with the rest of the shelf), fanned out a few pixels per
// depth so the stacked cases are still visible edge-on.
function StackFace({ item, shape, dark, glow, motion, d, nudge, gap, leaving, depth, onClick, onMarkWatched }) {
  const hue = useCoverPalette(item.coverUrl, item.hue ?? 200)[0];
  const { card } = shelfCardStyles({ shape, hue, dark, glow, motion, d, nudge, gap, leaving, coverUrl: item.coverUrl });
  const locked = item.watched === false;

  const faceStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: shape.w,
    height: shape.h,
    transform: `translate(${depth * 7}px, ${depth * 9}px) scale(${1 - depth * 0.025})`,
    zIndex: 50 - depth,
    transition: 'transform .35s cubic-bezier(.2,.8,.2,1)',
  };

  return (
    <div style={faceStyle} className="shelf-card-hover" onClick={onClick}>
      <div style={card} className={locked ? 'card-locked' : ''}>
        <CardFace item={item} shape={shape} locked={locked} onMarkWatched={onMarkWatched} />
      </div>
    </div>
  );
}

export default function CardStack({ stackItems, activeItem, shape, dark, glow, motion, d, nudge, gap, leaving, onOpenFront, onSelectItem, onMarkWatched }) {
  const front = frontOf(stackItems, activeItem);
  const ordered = [front, ...stackItems.filter((it) => it !== front)];
  const isActiveSlot = d === 0;

  const frontHue = useCoverPalette(front.coverUrl, front.hue ?? 200)[0];
  const { wrap } = shelfCardStyles({ shape, hue: frontHue, dark, glow, motion, d, nudge, gap, leaving, coverUrl: front.coverUrl });

  return (
    <div style={wrap} className="card-stack">
      {ordered.map((item, depth) => {
        const locked = item.watched === false;
        function handleClick(e) {
          e.stopPropagation();
          if (locked) return;
          if (depth === 0 && isActiveSlot) onOpenFront();
          else onSelectItem(item);
        }
        return (
          <StackFace
            key={item.id}
            item={item}
            shape={shape}
            dark={dark}
            glow={glow}
            motion={motion}
            d={d}
            nudge={nudge}
            gap={gap}
            leaving={leaving}
            depth={depth}
            onClick={handleClick}
            onMarkWatched={onMarkWatched}
          />
        );
      })}
      {stackItems.length > 1 && <span className="card-stack-count">{stackItems.length}</span>}
    </div>
  );
}
