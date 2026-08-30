import SearchBar from './SearchBar.jsx';

export default function Header({
  user,
  theme,
  toggleTheme,
  totalItems,
  totalNotes,
  onAdd,
  onImport,
  onStats,
  onOpenAccount,
  onSignOut,
  query,
  setQuery,
  searchResults,
  onJumpToItem,
}) {
  const initial = (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase();
  return (
    <header className="shelf-header">
      <div className="brand">
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>
        <span className="brand-word">Shelf</span>
      </div>
      <SearchBar query={query} setQuery={setQuery} results={searchResults} onJump={onJumpToItem} />
      <div className="header-right">
        <span className="count-label">
          {totalItems} thing{totalItems === 1 ? '' : 's'} kept · {totalNotes} note{totalNotes === 1 ? '' : 's'}
        </span>
        <button type="button" className="pill-btn" onClick={onAdd}>
          <span aria-hidden="true">+</span>
          <span>Add</span>
        </button>
        <button type="button" className="pill-btn" onClick={onImport}>
          <span>Import</span>
        </button>
        <button type="button" className="pill-btn" onClick={onStats}>
          <span aria-hidden="true">🔥</span>
          <span>Stats</span>
        </button>
        <button type="button" className="pill-btn" onClick={toggleTheme}>
          <span className="theme-dot" />
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
        <button
          type="button"
          className="avatar-btn"
          style={{ background: user?.avatarColor || '#7c6cf5' }}
          onClick={onOpenAccount}
          aria-label="Account settings"
          title={user?.displayName || user?.email}
        >
          {initial}
        </button>
        <button type="button" className="pill-btn" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
