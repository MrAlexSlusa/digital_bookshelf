import SearchBar from './SearchBar.jsx';

export default function Header({
  theme,
  toggleTheme,
  totalItems,
  totalNotes,
  onAdd,
  onSignOut,
  query,
  setQuery,
  searchResults,
  onJumpToItem,
  onOpenFriends,
  friendBadgeCount,
}) {
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
        <button type="button" className="pill-btn" onClick={onOpenFriends}>
          <span>Friends</span>
          {friendBadgeCount > 0 && <span className="unread-badge">{friendBadgeCount}</span>}
        </button>
        <button type="button" className="pill-btn" onClick={toggleTheme}>
          <span className="theme-dot" />
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
        <button type="button" className="pill-btn" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
