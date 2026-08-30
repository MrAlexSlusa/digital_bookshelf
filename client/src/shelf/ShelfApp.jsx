import { useEffect, useRef, useState } from 'react';
import Header from './Header.jsx';
import CategoryTabs from './CategoryTabs.jsx';
import Carousel from './Carousel.jsx';
import SelectionBlock from './SelectionBlock.jsx';
import DetailView from './DetailView.jsx';
import ItemFormModal from './ItemFormModal.jsx';
import AccountSettings from './AccountSettings.jsx';
import ImportModal from './ImportModal.jsx';
import StatsView from './StatsView.jsx';
import { useShelf } from './useShelf.js';
import { api } from '../api.js';
import { CATEGORY_META, CATEGORY_ORDER, shapeFor } from './constants.js';
import { accentColors, washColors, washStyle } from './styles.js';
import { useCoverPalette } from './useCoverPalette.js';

const MOTION = 1;
const GLOW = 1;

export default function ShelfApp({ user, onUserUpdate, onSignOut }) {
  const shelf = useShelf(user);
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', item? }
  const [accountOpen, setAccountOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    shelf.setKeyboardSuspended(Boolean(modal) || accountOpen || importOpen);
  }, [modal, accountOpen, importOpen, shelf]);

  // The header's quick theme toggle changes shelf.theme locally; mirror that
  // onto the account so it's remembered across devices, not just this browser.
  const themeMounted = useRef(false);
  useEffect(() => {
    if (!themeMounted.current) {
      themeMounted.current = true;
      return;
    }
    if (shelf.theme === user?.theme) return;
    api.updateAccount({ theme: shelf.theme }).then(({ user: updated }) => onUserUpdate(updated)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelf.theme]);

  function handleAccountUpdate(updated) {
    onUserUpdate(updated);
    shelf.setTheme(updated.theme);
  }

  const dark = shelf.theme === 'dark';
  const categoryMeta = CATEGORY_META[shelf.categoryKey];
  const shape = shapeFor(shelf.categoryKey);
  const item = shelf.activeItem;
  const palette = useCoverPalette(item?.coverUrl, item?.hue ?? 200);
  const hue = palette[0];
  const hue2 = palette[1] ?? hue;
  const { accent, accentGlow, accentSoft } = accentColors(hue, dark, GLOW);
  const { washA, washB } = washColors(hue, hue2, dark, GLOW);

  const counts = CATEGORY_ORDER.map((key) => (shelf.grouped[key] || []).length);
  const n = shelf.categoryItems.length;
  const posLabel = n
    ? `${String(shelf.activeIndex + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`
    : '00 / 00';

  function openCreateModal() {
    setModal({ mode: 'create' });
  }
  function openEditModal() {
    if (item) setModal({ mode: 'edit', item });
  }

  async function handleModalSubmit(data) {
    if (modal.mode === 'edit') {
      await shelf.updateItem(modal.item.id, data);
    } else {
      const created = await shelf.createItem(data);
      const idx = CATEGORY_ORDER.indexOf(created.category);
      if (idx !== shelf.cat) shelf.setCat(idx);
    }
    setModal(null);
  }

  async function handleDelete() {
    if (!item) return;
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    await shelf.deleteItem(item.id);
    shelf.forcePhase('shelf');
  }

  async function handleAddNote(note) {
    if (!item) return;
    await shelf.updateItem(item.id, { notes: [...(item.notes || []), note] });
  }
  async function handleRemoveNote(idx) {
    if (!item) return;
    await shelf.updateItem(item.id, { notes: item.notes.filter((_, i) => i !== idx) });
  }
  async function handleAddKeep(keep) {
    if (!item) return;
    await shelf.updateItem(item.id, { keeps: [...(item.keeps || []), keep] });
  }
  async function handleRemoveKeep(idx) {
    if (!item) return;
    await shelf.updateItem(item.id, { keeps: item.keeps.filter((_, i) => i !== idx) });
  }

  const isShelfPhase = shelf.phase === 'shelf' || shelf.phase === 'opening' || shelf.phase === 'closing';
  const isDetailPhase = shelf.phase === 'detail';

  return (
    <div className="shelf-app">
      <div style={washStyle(washA, washB)} />

      <Header
        user={user}
        theme={shelf.theme}
        toggleTheme={shelf.toggleTheme}
        totalItems={shelf.totalItems}
        totalNotes={shelf.totalNotes}
        onAdd={openCreateModal}
        onImport={() => setImportOpen(true)}
        onStats={() => setShowStats(true)}
        onOpenAccount={() => setAccountOpen(true)}
        onSignOut={onSignOut}
        query={shelf.query}
        setQuery={shelf.setQuery}
        searchResults={shelf.searchResults}
        onJumpToItem={shelf.jumpToItem}
      />

      {showStats ? (
        <StatsView items={shelf.items} dark={dark} accent={accent} onClose={() => setShowStats(false)} />
      ) : (
        <>
      <CategoryTabs cat={shelf.cat} counts={counts} accent={accent} onSelect={shelf.setCat} />

      {shelf.loading && (
        <div className="empty-state">
          <p className="empty-title">Loading your shelf…</p>
        </div>
      )}

      {!shelf.loading && shelf.loadError && (
        <div className="empty-state">
          <p className="empty-title">Couldn&rsquo;t load your shelf</p>
          <p className="empty-sub">{shelf.loadError}</p>
          <button type="button" className="btn-pill" onClick={shelf.reload}>
            Try again
          </button>
        </div>
      )}

      {!shelf.loading && !shelf.loadError && isShelfPhase && (
        <main className="shelf-main">
          <div className="intro-row">
            <p className="intro-blurb">{categoryMeta.blurb}</p>
            <p className="pos-label">{posLabel}</p>
          </div>

          {n === 0 ? (
            <div className="empty-state">
              <p className="empty-title">Nothing here yet</p>
              <p className="empty-sub">Add your first {categoryMeta.singular} to start this shelf.</p>
              <button type="button" className="btn-pill" onClick={openCreateModal}>
                + Add {categoryMeta.singular}
              </button>
            </div>
          ) : (
            <>
              <Carousel
                items={shelf.categoryItems}
                activeIndex={shelf.activeIndex}
                shape={shape}
                dark={dark}
                glow={GLOW}
                motion={MOTION}
                nudge={shelf.nudge}
                phase={shelf.phase}
                accentSoft={accentSoft}
                onWheel={shelf.onWheel}
                onDragStart={shelf.onDragStart}
                onSelect={shelf.selectActive}
                onOpen={shelf.open}
              />
              <SelectionBlock
                item={item}
                verb={categoryMeta.verb}
                accent={accent}
                items={shelf.categoryItems}
                activeIndex={shelf.activeIndex}
                isQuoteCat={shelf.categoryKey === 'quotes'}
                onSelect={shelf.selectActive}
                onOpen={shelf.open}
              />
            </>
          )}
        </main>
      )}

      {!shelf.loading && !shelf.loadError && isDetailPhase && item && (
        <DetailView
          item={item}
          category={shelf.categoryKey}
          categoryMeta={categoryMeta}
          shape={shape}
          dark={dark}
          glow={GLOW}
          motion={MOTION}
          px={shelf.px}
          py={shelf.py}
          sec={shelf.sec}
          setSec={shelf.setSec}
          onParallax={shelf.onParallax}
          onClose={shelf.close}
          onPrev={() => shelf.move(-1)}
          onNext={() => shelf.move(1)}
          posLabel={posLabel}
          accent={accent}
          accentGlow={accentGlow}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onAddNote={handleAddNote}
          onRemoveNote={handleRemoveNote}
          onAddKeep={handleAddKeep}
          onRemoveKeep={handleRemoveKeep}
        />
      )}
        </>
      )}

      {modal && (
        <ItemFormModal
          initial={modal.mode === 'edit' ? modal.item : null}
          defaultCategory={shelf.categoryKey}
          dark={dark}
          onSubmit={handleModalSubmit}
          onCancel={() => setModal(null)}
        />
      )}

      {accountOpen && (
        <AccountSettings
          user={user}
          onUpdate={handleAccountUpdate}
          onClose={() => setAccountOpen(false)}
          onAccountDeleted={onSignOut}
        />
      )}

      {importOpen && (
        <ImportModal
          onImport={async (items) => {
            await shelf.bulkCreateItems(items);
            setImportOpen(false);
          }}
          onCancel={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
