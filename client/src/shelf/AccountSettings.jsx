import { useState } from 'react';
import { api } from '../api.js';

const AVATAR_COLORS = ['#7c6cf5', '#e0607e', '#e0a83e', '#3ba874', '#3e8ee0', '#e06b3e', '#7e7e7e'];

export default function AccountSettings({ user, onUpdate, onClose, onAccountDeleted }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || AVATAR_COLORS[0]);
  const [bio, setBio] = useState(user.bio || '');
  const [theme, setTheme] = useState(user.theme || 'dark');
  const [itemSort, setItemSort] = useState(user.itemSort || 'newest');
  const [profileError, setProfileError] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

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
    if (!window.confirm('Delete your account? This permanently removes everything on your shelf and cannot be undone.')) {
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
        <h2 className="modal-title">Account settings</h2>

        <form onSubmit={handleProfileSubmit}>
          <h3 className="settings-section-title">Profile</h3>

          <div className="form-field">
            <label htmlFor="acct-display-name">Display name</label>
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
            <label>Avatar colour</label>
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
            <label htmlFor="acct-bio">Bio</label>
            <textarea
              id="acct-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              placeholder="A line about your shelf"
            />
          </div>

          <h3 className="settings-section-title">Preferences</h3>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="acct-theme">Theme</label>
              <select id="acct-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="acct-sort">Item order</label>
              <select id="acct-sort" value={itemSort} onChange={(e) => setItemSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title, A–Z</option>
              </select>
            </div>
          </div>

          {profileError && <p className="form-error">{profileError}</p>}
          {profileSaved && <p className="form-success">Saved.</p>}

          <div className="modal-actions">
            <button type="submit" className="btn-pill" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        <hr className="settings-divider" />

        <form onSubmit={handleEmailSubmit}>
          <h3 className="settings-section-title">Change email</h3>
          <div className="form-field">
            <label htmlFor="acct-email">New email</label>
            <input id="acct-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          </div>
          <div className="form-field">
            <label htmlFor="acct-email-password">Current password</label>
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
          {emailSaved && <p className="form-success">Email updated.</p>}

          <div className="modal-actions">
            <button type="submit" className="btn-pill" disabled={savingEmail}>
              {savingEmail ? 'Saving…' : 'Update email'}
            </button>
          </div>
        </form>

        <hr className="settings-divider" />

        <form onSubmit={handlePasswordSubmit}>
          <h3 className="settings-section-title">Change password</h3>
          <div className="form-field">
            <label htmlFor="acct-current-password">Current password</label>
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
            <label htmlFor="acct-new-password">New password</label>
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
          {passwordSaved && <p className="form-success">Password updated.</p>}

          <div className="modal-actions">
            <button type="submit" className="btn-pill" disabled={savingPassword}>
              {savingPassword ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>

        <hr className="settings-divider" />

        <form onSubmit={handleDeleteSubmit}>
          <h3 className="settings-section-title danger">Delete account</h3>
          <p className="settings-danger-note">
            Permanently deletes your account and everything on your shelf. This can&rsquo;t be undone.
          </p>
          <div className="form-field">
            <label htmlFor="acct-delete-password">Current password</label>
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
              Close
            </button>
            <button type="submit" className="btn-pill btn-danger" disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
