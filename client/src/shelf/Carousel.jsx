import Card from './Card.jsx';
import { floorGlowStyle, gapFor } from './styles.js';

const SPREAD = 186;

export default function Carousel({ items, activeIndex, shape, dark, glow, motion, nudge, phase, accentSoft, onWheel, onDragStart, onSelect, onOpen }) {
  const n = items.length;
  const gap = gapFor(shape.kind, SPREAD);
  const leaving = phase === 'opening';

  return (
    <div className="carousel-stage" onWheel={onWheel} onMouseDown={onDragStart}>
      <div style={floorGlowStyle(accentSoft)} />
      {items.map((item, idx) => {
        let d = idx - activeIndex;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        return (
          <Card
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
            onClick={() => (idx === activeIndex ? onOpen() : onSelect(idx))}
          />
        );
      })}
    </div>
  );
}
