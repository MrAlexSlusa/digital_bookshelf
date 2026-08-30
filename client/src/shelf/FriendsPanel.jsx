import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const POLL_MS = 4000;

function ChatThread({ friend, myUserId, onMessagesRead }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function poll() {
      try {
        const rows = await api.getMessages(friend.id);
        if (cancelled) return;
        setMessages(rows);
        setError(null);
        onMessagesRead?.(friend.id);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [friend.id, onMessagesRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      const sent = await api.sendMessage(friend.id, content);
      setMessages((prev) => [...prev, sent]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-thread">
      <div className="chat-thread-header">
        <span className="chat-thread-title">{friend.email}</span>
      </div>
      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && <p className="chat-empty">Say hello to start the conversation.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble-row ${m.senderId === myUserId ? 'mine' : 'theirs'}`}>
            <div className="chat-bubble">
              <p className="chat-bubble-text">{m.content}</p>
              <span className="chat-bubble-time">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          maxLength={4000}
        />
        <button type="submit" className="btn-ghost" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default function FriendsPanel({ myUserId, onClose }) {
  const [tab, setTab] = useState('friends'); // friends | requests | add
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [unread, setUnread] = useState({});
  const [activeFriend, setActiveFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addEmail, setAddEmail] = useState('');
  const [addStatus, setAddStatus] = useState(null); // { ok: bool, message: string }
  const [addBusy, setAddBusy] = useState(false);

  async function loadAll() {
    try {
      const [friendsList, requestsList, sentList, unreadList] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests(),
        api.getSentFriendRequests(),
        api.getUnreadCounts(),
      ]);
      setFriends(friendsList);
      setRequests(requestsList);
      setSent(sentList);
      setUnread(Object.fromEntries(unreadList.map((r) => [r.friendId, r.count])));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 15000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markRead(friendId) {
    setUnread((prev) => {
      if (!prev[friendId]) return prev;
      const next = { ...prev };
      delete next[friendId];
      return next;
    });
  }

  async function handleAddFriend(e) {
    e.preventDefault();
    const email = addEmail.trim();
    if (!email) return;
    setAddBusy(true);
    setAddStatus(null);
    try {
      await api.addFriend(email);
      setAddStatus({ ok: true, message: `Friend request sent to ${email}.` });
      setAddEmail('');
      loadAll();
    } catch (err) {
      setAddStatus({ ok: false, message: err.message });
    } finally {
      setAddBusy(false);
    }
  }

  async function handleAccept(friendshipId) {
    await api.acceptFriendRequest(friendshipId);
    loadAll();
  }
  async function handleDecline(friendshipId) {
    await api.declineFriendRequest(friendshipId);
    loadAll();
  }
  async function handleCancelSent(friendshipId) {
    await api.removeFriend(friendshipId);
    loadAll();
  }
  async function handleRemoveFriend(friend) {
    if (!window.confirm(`Remove ${friend.email} from your friends?`)) return;
    await api.removeFriend(friend.friendshipId);
    if (activeFriend?.id === friend.id) setActiveFriend(null);
    loadAll();
  }

  const requestCount = requests.length;

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel friends-panel">
        <div className="friends-panel-header">
          <h2 className="modal-title">Friends</h2>
          <button type="button" className="icon-remove" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="friends-tabs">
          <button type="button" className={`link-btn tab-btn ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
            Friends ({friends.length})
          </button>
          <button type="button" className={`link-btn tab-btn ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            Requests {requestCount > 0 ? `(${requestCount})` : ''}
          </button>
          <button type="button" className={`link-btn tab-btn ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>
            Add friend
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="friends-body">
          {activeFriend ? (
            <div className="friends-chat-wrap">
              <button type="button" className="link-btn" onClick={() => setActiveFriend(null)}>
                ← Back to friends
              </button>
              <ChatThread friend={activeFriend} myUserId={myUserId} onMessagesRead={markRead} />
            </div>
          ) : (
            <>
              {tab === 'friends' && (
                <div className="friend-list">
                  {loading && <p className="chat-empty">Loading…</p>}
                  {!loading && friends.length === 0 && (
                    <p className="chat-empty">No friends yet — add one to start chatting.</p>
                  )}
                  {friends.map((f) => (
                    <div key={f.id} className="friend-row">
                      <button type="button" className="friend-row-main" onClick={() => setActiveFriend(f)}>
                        <span>{f.email}</span>
                        {unread[f.id] > 0 && <span className="unread-badge">{unread[f.id]}</span>}
                      </button>
                      <button type="button" className="icon-remove" title="Remove friend" onClick={() => handleRemoveFriend(f)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'requests' && (
                <div className="friend-list">
                  {requests.length === 0 && sent.length === 0 && (
                    <p className="chat-empty">No pending requests.</p>
                  )}
                  {requests.map((r) => (
                    <div key={r.friendshipId} className="friend-row">
                      <span className="friend-row-main">{r.email}</span>
                      <div className="friend-row-actions">
                        <button type="button" className="btn-ghost" onClick={() => handleAccept(r.friendshipId)}>
                          Accept
                        </button>
                        <button type="button" className="icon-remove" title="Decline" onClick={() => handleDecline(r.friendshipId)}>
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {sent.map((r) => (
                    <div key={r.friendshipId} className="friend-row">
                      <span className="friend-row-main dim">{r.email} · pending</span>
                      <button type="button" className="icon-remove" title="Cancel request" onClick={() => handleCancelSent(r.friendshipId)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'add' && (
                <form className="form-field" onSubmit={handleAddFriend}>
                  <label htmlFor="friend-email">Friend&rsquo;s email</label>
                  <input
                    id="friend-email"
                    type="text"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="friend@example.com"
                  />
                  {addStatus && (
                    <p className={addStatus.ok ? 'chat-empty' : 'form-error'}>{addStatus.message}</p>
                  )}
                  <div className="modal-actions">
                    <button type="submit" className="btn-ghost" disabled={addBusy || !addEmail.trim()}>
                      Send request
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
