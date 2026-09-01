import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { CATEGORY_ORDER, categoryMetaFor, sectionsFor } from './constants.js';
import { useTheme } from './useTheme.js';
import { useI18n } from '../i18n/I18nContext.jsx';

function textOf(item) {
  return [
    item.title,
    item.sub,
    item.impression,
    item.verdict,
    ...(item.tags || []),
    ...(item.facts || []),
    ...(item.notes || []),
    ...(item.keeps || []),
  ]
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase();
}

function sortItems(items, itemSort) {
  const sorted = [...items];
  if (itemSort === 'oldest') return sorted;
  if (itemSort === 'title') return sorted.sort((a, b) => a.title.localeCompare(b.title));
  return sorted.reverse(); // newest (default): items arrive oldest-first from the API
}

function groupByCategory(items, itemSort) {
  const grouped = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]));
  for (const item of items) {
    if (grouped[item.category]) grouped[item.category].push(item);
  }
  for (const key of CATEGORY_ORDER) {
    grouped[key] = sortItems(grouped[key], itemSort);
  }
  return grouped;
}

export function useShelf(user) {
  const { t } = useI18n();
  const { theme, setTheme, toggleTheme } = useTheme(user?.theme);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [query, setQuery] = useState('');

  const [cat, setCatIndex] = useState(0);
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState('shelf'); // shelf | opening | detail | closing
  const [sec, setSec] = useState(0);
  const [nudge, setNudge] = useState(0);
  const [px, setPx] = useState(0);
  const [py, setPy] = useState(0);

  const phaseTimer = useRef(null);
  const nudgeTimer = useRef(null);
  const parallaxAt = useRef(0);
  const wheelAt = useRef(0);

  const phaseRef = useRef(phase);
  const lengthRef = useRef(0);
  const secCountRef = useRef(4);
  const groupedRef = useRef({});

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const grouped = useMemo(() => groupByCategory(items, user?.itemSort), [items, user?.itemSort]);
  const categoryKey = CATEGORY_ORDER[cat];
  const categoryItems = grouped[categoryKey] || [];
  const activeIndex = categoryItems.length ? Math.min(active, categoryItems.length - 1) : 0;
  const activeItem = categoryItems[activeIndex] || null;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter((it) => textOf(it).includes(q))
      .slice(0, 20)
      .map((it) => ({ item: it, categoryLabel: categoryMetaFor(it.category, t).label || it.category }));
  }, [items, query, t]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    lengthRef.current = categoryItems.length;
  }, [categoryItems.length]);
  useEffect(() => {
    secCountRef.current = sectionsFor(categoryKey, t).length;
  }, [categoryKey, t]);
  useEffect(() => {
    groupedRef.current = grouped;
  }, [grouped]);

  useEffect(
    () => () => {
      clearTimeout(phaseTimer.current);
      clearTimeout(nudgeTimer.current);
    },
    []
  );

  const scheduleNudgeClear = () => {
    clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setNudge(0), 620);
  };

  const move = useCallback((d) => {
    if (phaseRef.current !== 'shelf' && phaseRef.current !== 'detail') return;
    const n = lengthRef.current;
    if (!n) return;
    setActive((a) => {
      const cur = Math.min(a, n - 1);
      return (cur + d + n) % n;
    });
    setSec(0);
    setNudge(d);
    scheduleNudgeClear();
  }, []);

  const open = useCallback(() => {
    if (phaseRef.current !== 'shelf' || !lengthRef.current) return;
    setPhase('opening');
    setSec(0);
    clearTimeout(phaseTimer.current);
    phaseTimer.current = setTimeout(() => setPhase('detail'), 480);
  }, []);

  const close = useCallback(() => {
    if (phaseRef.current !== 'detail') return;
    setPhase('closing');
    clearTimeout(phaseTimer.current);
    phaseTimer.current = setTimeout(() => setPhase('shelf'), 260);
  }, []);

  const setCat = useCallback((i) => {
    setCatIndex((prev) => {
      if (i === prev) return prev;
      const len = (groupedRef.current[CATEGORY_ORDER[i]] || []).length;
      setActive(Math.min(1, Math.max(0, len - 1)));
      setPhase('shelf');
      setSec(0);
      setNudge(1);
      scheduleNudgeClear();
      return i;
    });
  }, []);

  const selectActive = useCallback((idx) => {
    setActive(idx);
    setSec(0);
  }, []);

  const jumpToItem = useCallback((target) => {
    const catIdx = CATEGORY_ORDER.indexOf(target.category);
    if (catIdx === -1) return;
    const list = groupedRef.current[target.category] || [];
    const idx = list.findIndex((it) => it.id === target.id);
    if (idx === -1) return;
    setCatIndex(catIdx);
    setActive(idx);
    setSec(0);
    setPhase('detail');
    setQuery('');
  }, []);

  const suspendedRef = useRef(false);
  const setKeyboardSuspended = useCallback((v) => {
    suspendedRef.current = v;
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (suspendedRef.current) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const isOpen = phaseRef.current === 'detail';
      if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'Enter' && !isOpen) open();
      else if (e.key === 'Escape' && isOpen) close();
      else if (e.key === 'ArrowDown' && isOpen) setSec((s) => Math.min(secCountRef.current - 1, s + 1));
      else if (e.key === 'ArrowUp' && isOpen) setSec((s) => Math.max(0, s - 1));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move, open, close]);

  const onWheel = useCallback(
    (e) => {
      const now = Date.now();
      if (wheelAt.current && now - wheelAt.current < 340) return;
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dx) < 6) return;
      wheelAt.current = now;
      move(dx > 0 ? 1 : -1);
    },
    [move]
  );

  const onDragStart = useCallback(
    (e) => {
      let last = e.clientX;
      const mv = (ev) => {
        if (Math.abs(ev.clientX - last) > 72) {
          move(ev.clientX < last ? 1 : -1);
          last = ev.clientX;
        }
      };
      const up = () => {
        window.removeEventListener('mousemove', mv);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', mv);
      window.addEventListener('mouseup', up);
    },
    [move]
  );

  const onParallax = useCallback((e) => {
    const now = Date.now();
    if (parallaxAt.current && now - parallaxAt.current < 60) return;
    parallaxAt.current = now;
    const r = e.currentTarget.getBoundingClientRect();
    setPx((e.clientX - r.left) / r.width - 0.5);
    setPy((e.clientY - r.top) / r.height - 0.5);
  }, []);

  const createItem = useCallback(async (data) => {
    const created = await api.createItem(data);
    setItems((prev) => [...prev, created]);
    return created;
  }, []);

  const updateItem = useCallback(async (id, data) => {
    const updated = await api.updateItem(id, data);
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    return updated;
  }, []);

  const bulkCreateItems = useCallback(async (items) => {
    const created = await api.bulkCreateItems(items);
    setItems((prev) => [...prev, ...created]);
    return created;
  }, []);

  const deleteItem = useCallback(async (id) => {
    await api.deleteItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const totalNotes = useMemo(() => items.reduce((sum, it) => sum + (it.notes?.length || 0), 0), [items]);

  return {
    theme,
    setTheme,
    toggleTheme,
    items,
    loading,
    loadError,
    reload,
    grouped,
    cat,
    setCat,
    categoryKey,
    categoryItems,
    activeIndex,
    activeItem,
    selectActive,
    query,
    setQuery,
    searchResults,
    jumpToItem,
    phase,
    forcePhase: setPhase,
    sec,
    setSec,
    nudge,
    px,
    py,
    move,
    open,
    close,
    onWheel,
    onDragStart,
    onParallax,
    createItem,
    bulkCreateItems,
    updateItem,
    deleteItem,
    setKeyboardSuspended,
    totalItems: items.length,
    totalNotes,
  };
}
