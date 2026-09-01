import SearchBar from './SearchBar.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

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
  onOpenFriends,
  friendBadgeCount,
}) {
  const { t } = useI18n();
  const initial = (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase();
  return (
    <header className="shelf-header">
      <div className="brand">
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>
        <span className="brand-word">{t('header.brand')}</span>
      </div>
      <SearchBar query={query} setQuery={setQuery} results={searchResults} onJump={onJumpToItem} />
      <div className="header-right">
        <span className="count-label">
          {t('header.keptCount', {
            items: totalItems,
            itemWord: t(totalItems === 1 ? 'header.thing' : 'header.things'),
            notes: totalNotes,
            noteWord: t(totalNotes === 1 ? 'header.note' : 'header.notes'),
          })}
        </span>
        <button type="button" className="pill-btn" onClick={onAdd}>
          <span aria-hidden="true">+</span>
          <span>{t('header.add')}</span>
        </button>
        <button type="button" className="pill-btn" onClick={onOpenFriends}>
          <span>{t('header.friends')}</span>
          {friendBadgeCount > 0 && <span className="unread-badge">{friendBadgeCount}</span>}
        </button>
        <button type="button" className="pill-btn" onClick={onImport}>
          <span>{t('header.import')}</span>
        </button>
        <button type="button" className="pill-btn" onClick={onStats}>
          <span aria-hidden="true">🔥</span>
          <span>{t('header.stats')}</span>
        </button>
        <button type="button" className="pill-btn" onClick={toggleTheme}>
          <span className="theme-dot" />
          {theme === 'dark' ? t('header.dark') : t('header.light')}
        </button>
        <button
          type="button"
          className="avatar-btn"
          style={{ background: user?.avatarColor || '#7c6cf5' }}
          onClick={onOpenAccount}
          aria-label={t('header.accountSettings')}
          title={user?.displayName || user?.email}
        >
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initial}
        </button>
        <button type="button" className="pill-btn" onClick={onSignOut}>
          {t('header.signOut')}
        </button>
      </div>
    </header>
  );
}
