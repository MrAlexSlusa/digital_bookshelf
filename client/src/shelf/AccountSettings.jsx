import { useState } from 'react';
import { api } from '../api.js';
import { useI18n } from '../i18n/I18nContext.jsx';

const AVATAR_COLORS = ['#7c6cf5', '#e0607e', '#e0a83e', '#3ba874', '#3e8ee0', '#e06b3e', '#7e7e7e'];

// Downscales/compresses to a small square JPEG data URL so the picture fits
// comfortably in the request body and the users.avatar_url column.
function resizeImageToDataUrl(file, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image'));
    };
    img.src = objectUrl;
  });
}

export default function AccountSettings({ user, onUpdate, onClose, onAccountDeleted }) {
  const { t, language, setLanguage, languages } = useI18n();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || AVATAR_COLORS[0]);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarError, setAvatarError] = useState(null);
  const [bio, setBio] = useState(user.bio || '');
  const [theme, setTheme] = useState(user.theme || 'dark');
  const [itemSort, setItemSort] = useState(user.itemSort || 'newest');
  const [profileError, setProfileError] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError(null);
    if (!file.type.startsWith('image/')) {
      setAvatarError(t('account.chooseImageFile'));
      return;
    }
    try {
      const resized = await resizeImageToDataUrl(file, 256);
      setAvatarUrl(resized);
    } catch {
      setAvatarError(t('account.couldNotReadImage'));
    }
  }

  const [newEmail, setNewEmail] = useState(user.email);
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [emailSaved, setEmailSaved] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      const { user: updated } = await api.updateAccount({
        displayName: displayName.trim(),
        avatarColor,
        avatarUrl,
        bio: bio.trim(),
        theme,
        itemSort,
      });
      onUpdate(updated);
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailError(null);
    setEmailSaved(false);
    setSavingEmail(true);
    try {
      const { user: updated } = await api.updateEmail(newEmail.trim(), emailPassword);
      onUpdate(updated);
      setEmailPassword('');
      setEmailSaved(true);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setSavingEmail(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    setSavingPassword(true);
    try {
      await api.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteSubmit(e) {
    e.preventDefault();
    if (!window.confirm(t('account.deleteConfirm'))) {
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.deleteAccount(deletePassword);
      onAccountDeleted();
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <h2 className="modal-title">{t('account.title')}</h2>

        <form onSubmit={handleProfileSubmit}>
          <h3 className="settings-section-title">{t('account.profile')}</h3>

          <div className="form-field">
            <label htmlFor="acct-display-name">{t('account.displayName')}</label>
            <input
              id="acct-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user.email}
              maxLength={60}
            />
          </div>

          <div className="form-field">
            <label>{t('account.profilePicture')}</label>
            <div className="avatar-upload-row">
              <div className="avatar-preview" style={{ background: avatarColor }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" />
                ) : (
                  (displayName || user.email || '?').trim().charAt(0).toUpperCase()
                )}
              </div>
              <div className="avatar-upload-actions">
                <label className="btn-ghost avatar-upload-btn">
                  {t('account.uploadPhoto')}
                  <input type="file" accept="image/*" onChange={handleAvatarFile} hidden />
                </label>
                {avatarUrl && (
                  <button type="button" className="btn-ghost" onClick={() => setAvatarUrl('')}>
                    {t('common.remove')}
                  </button>
                )}
              </div>
            </div>
            {avatarError && <p className="form-error">{avatarError}</p>}
          </div>

          <div className="form-field">
            <label>{t('account.avatarColor')}</label>
            <div className="avatar-color-row">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`avatar-swatch${avatarColor === color ? ' selected' : ''}`}
                  style={{ background: color }}
                  aria-label={color}
                  onClick={() => setAvatarColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="acct-bio">{t('account.bio')}</label>
            <textarea
              id="acct-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              placeholder={t('account.bioPlaceholder')}
            />
          </div>

          <h3 className="settings-section-title">{t('account.preferences')}</h3>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="acct-theme">{t('account.theme')}</label>
              <select id="acct-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dark">{t('account.themeDark')}</option>
                <option value="light">{t('account.themeLight')}</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="acct-sort">{t('account.itemOrder')}</label>
              <select id="acct-sort" value={itemSort} onChange={(e) => setItemSort(e.target.value)}>
                <option value="newest">{t('account.newestFirst')}</option>
                <option value="oldest">{t('account.oldestFirst')}</option>
                <option value="title">{t('account.titleAZ')}</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="acct-language">{t('account.language')}</label>
              <select id="acct-language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {profileError && <p className="form-error">{profileError}</p>}
          {profileSaved && <p className="form-success">{t('account.saved')}</p>}

          <div className="modal-actions">
            <button type="submit" className="btn-pill" disabled={savingProfile}>
              {savingProfile ? t('account.saving') : t('account.saveProfile')}
            </button>
          </div>
        </form>

        <hr className="settings-divider" />

        <form onSubmit={handleEmailSubmit}>
          <h3 className="settings-section-title">{t('account.changeEmail')}</h3>
          <div className="form-field">
            <label htmlFor="acct-email">{t('account.newEmail')}</label>
            <input id="acct-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          </div>
          <div className="form-field">
            <label htmlFor="acct-email-password">{t('account.currentPassword')}</label>
            <input
              id="acct-email-password"
              type="password"
              autoComplete="current-password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
            />
          </div>

          {emailError && <p className="form-error">{emailError}</p>}
          {emailSaved && <p className="form-success">{t('account.emailUpdated')}</p>}

          <div className="modal-actions">
            <button type="submit" className="btn-pill" disabled={savingEmail}>
              {savingEmail ? t('account.saving') : t('account.updateEmail')}
            </button>
          </div>
        </form>

        <hr className="settings-divider" />

        <form onSubmit={handlePasswordSubmit}>
          <h3 className="settings-section-title">{t('account.changePassword')}</h3>
          <div className="form-field">
            <label htmlFor="acct-current-password">{t('account.currentPassword')}</label>
            <input
              id="acct-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="acct-new-password">{t('account.newPassword')}</label>
            <input
              id="acct-new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          {passwordError && <p className="form-error">{passwordError}</p>}
          {passwordSaved && <p className="form-success">{t('account.passwordUpdated')}</p>}

          <div className="modal-actions">
            <button type="submit" className="btn-pill" disabled={savingPassword}>
              {savingPassword ? t('account.saving') : t('account.updatePassword')}
            </button>
          </div>
        </form>

        <hr className="settings-divider" />

        <form onSubmit={handleDeleteSubmit}>
          <h3 className="settings-section-title danger">{t('account.deleteAccount')}</h3>
          <p className="settings-danger-note">{t('account.deleteWarning')}</p>
          <div className="form-field">
            <label htmlFor="acct-delete-password">{t('account.currentPassword')}</label>
            <input
              id="acct-delete-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
            />
          </div>

          {deleteError && <p className="form-error">{deleteError}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              {t('account.close')}
            </button>
            <button type="submit" className="btn-pill btn-danger" disabled={deleting}>
              {deleting ? t('account.deleting') : t('account.deleteAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
