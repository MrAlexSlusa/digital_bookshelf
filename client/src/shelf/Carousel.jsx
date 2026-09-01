import Card from './Card.jsx';
import CardStack from './CardStack.jsx';
import { buildSlots } from './franchiseStacks.js';
import { floorGlowStyle, gapFor } from './styles.js';

const SPREAD = 186;

export default function Carousel({ items, activeIndex, shape, dark, glow, motion, nudge, phase, accentSoft, onWheel, onDragStart, onSelect, onOpen, onMarkWatched }) {
  const gap = gapFor(shape.kind, SPREAD);
  const leaving = phase === 'opening';
  const activeItem = items[activeIndex];

  // Franchise movies (e.g. every Fast & Furious entry) share one slot and
  // render as a stack; everything else keeps one slot per item.
  const slots = shape.kind === 'film' ? buildSlots(items) : items.map((it) => ({ items: [it] }));
  const n = slots.length;
  const activeSlotIdx = Math.max(0, slots.findIndex((s) => s.items.includes(activeItem)));

  return (
    <div className="carousel-stage" onWheel={onWheel} onMouseDown={onDragStart}>
      <div style={floorGlowStyle(accentSoft)} />
      {slots.map((slot, idx) => {
        let d = idx - activeSlotIdx;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;

        if (slot.items.length === 1) {
          const item = slot.items[0];
          const rawIdx = items.indexOf(item);
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
              onClick={() => (rawIdx === activeIndex ? onOpen() : onSelect(rawIdx))}
              onMarkWatched={onMarkWatched}
            />
          );
        }

        return (
          <CardStack
            key={slot.items.map((it) => it.id).join('-')}
            stackItems={slot.items}
            activeItem={activeItem}
            shape={shape}
            dark={dark}
            glow={glow}
            motion={motion}
            d={d}
            nudge={nudge}
            gap={gap}
            leaving={leaving}
            onOpenFront={onOpen}
            onSelectItem={(item) => onSelect(items.indexOf(item))}
            onMarkWatched={onMarkWatched}
          />
        );
      })}
    </div>
  );
}
