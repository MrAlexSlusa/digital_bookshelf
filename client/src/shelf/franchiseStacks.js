// Movies that share a franchise (e.g. every Fast & Furious entry) collapse
// onto one shelf slot and render as a physical stack instead of taking a
// slot each. Everything else keeps one item per slot, unchanged.

function franchiseKey(item) {
  const f = (item.franchise || '').trim().toLowerCase();
  return f || null;
}

function parseYear(year) {
  const n = parseInt(year, 10);
  return Number.isFinite(n) ? n : null;
}

// Re-orders a sorted item list so that same-franchise movies sit next to
// each other (at the position of the group's first occurrence), sorted
// chronologically within the group. Leaves already-sorted relative order
// alone for everything else.
export function clusterFranchises(items) {
  const order = [];
  const groups = new Map();
  for (const item of items) {
    const key = franchiseKey(item) || `__solo_${item.id}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(item);
  }
  const result = [];
  for (const key of order) {
    const group = groups.get(key);
    if (group.length > 1) {
      group.sort((a, b) => (parseYear(a.year) ?? 0) - (parseYear(b.year) ?? 0));
    }
    result.push(...group);
  }
  return result;
}

// Builds the shelf's visual slots from an already-clustered item list: each
// slot is one or more items (a stack) that occupy the same carousel
// position.
export function buildSlots(items) {
  const slots = [];
  let lastKey = null;
  for (const item of items) {
    const key = franchiseKey(item);
    if (key && key === lastKey) {
      slots[slots.length - 1].items.push(item);
    } else {
      slots.push({ items: [item] });
    }
    lastKey = key;
  }
  return slots;
}

// Which item in a stack is shown on top: the currently active item if it's
// part of this stack, otherwise the first watched entry, otherwise just the
// first (so an all-locked franchise still shows its next-up movie).
export function frontOf(stackItems, activeItem) {
  if (activeItem && stackItems.includes(activeItem)) return activeItem;
  return stackItems.find((it) => it.watched !== false) || stackItems[0];
}
