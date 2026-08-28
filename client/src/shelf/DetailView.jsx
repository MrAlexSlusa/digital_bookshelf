import { useState } from 'react';
import HeroStage from './HeroStage.jsx';
import { sectionsFor } from './constants.js';

function starsFor(rating) {
  const r = Math.max(0, Math.min(5, rating || 0));
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
}

function NoteForm({ onSubmit, onCancel }) {
  const [when, setWhen] = useState('');
  const [at, setAt] = useState('');
  const [text, setText] = useState('');
  return (
    <form
      className="inline-add-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit({ when: when.trim(), at: at.trim(), text: text.trim() });
      }}
    >
      <input placeholder="Date, e.g. 12 Mar" value={when} onChange={(e) => setWhen(e.target.value)} />
      <input placeholder="Where, e.g. p.64 or 1:12:00" value={at} onChange={(e) => setAt(e.target.value)} />
      <textarea placeholder="What you noted" value={text} onChange={(e) => setText(e.target.value)} required />
      <div className="inline-add-actions">
        <button type="submit" className="btn-pill">
          Save note
        </button>
        <button type="button" className="link-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function KeepForm({ onSubmit, onCancel }) {
  const [text, setText] = useState('');
  const [at, setAt] = useState('');
  return (
    <form
      className="inline-add-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit({ text: text.trim(), at: at.trim() });
      }}
    >
      <textarea placeholder="The line itself" value={text} onChange={(e) => setText(e.target.value)} required />
      <input placeholder="Citation, e.g. Page 233 or Scene: the room" value={at} onChange={(e) => setAt(e.target.value)} />
      <div className="inline-add-actions">
        <button type="submit" className="btn-pill">
          Keep it
        </button>
        <button type="button" className="link-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function DetailView({
  item,
  category,
  categoryMeta,
  shape,
  dark,
  glow,
  motion,
  px,
  py,
  sec,
  setSec,
  onParallax,
  onClose,
  onPrev,
  onNext,
  posLabel,
  accent,
  accentGlow,
  onEdit,
  onDelete,
  onAddNote,
  onRemoveNote,
  onAddKeep,
  onRemoveKeep,
}) {
  const [addingNote, setAddingNote] = useState(false);
  const [addingKeep, setAddingKeep] = useState(false);

  const sections = sectionsFor(category);
  const label = sections[Math.min(sec, sections.length - 1)];
  const showImpression = sec === 0;
  const showNotes = label === 'My notes';
  const showDetails = label === 'Details';
  const showKeeps = label !== 'My notes' && label !== 'Details' && sec !== 0;

  const isQuoteCat = category === 'quotes';
  const notes = item.notes || [];
  const keeps = item.keeps || [];
  const facts = [
    ...(item.facts || []),
    ['Notes kept', String(notes.length)],
    ['Lines kept', String(keeps.length)],
    ['Category', categoryMeta.label],
  ];

  return (
    <>
      <main className="detail-main" onMouseMove={onParallax}>
        <div className="detail-left">
          <button type="button" className="back-btn" onClick={onClose}>
            <span>←</span>
            <span>{categoryMeta.back}</span>
          </button>

          <div className="detail-actions">
            <button type="button" className="text-link-btn" onClick={onEdit}>
              Edit
            </button>
            <button type="button" className="text-link-btn danger" onClick={onDelete}>
              Delete
            </button>
          </div>

          <p className="section-label" style={{ color: accent }}>
            {label}
          </p>
          <div className="detail-title-row">
            {item.coverUrl && <img className="detail-cover-thumb" src={item.coverUrl} alt="" />}
            <div>
              <h1 className="detail-title">{isQuoteCat ? `“${item.title}”` : item.title}</h1>
              <p className="detail-byline">
                {item.sub}
                {item.year ? `  ·  ${item.year}` : ''}
              </p>
            </div>
          </div>

          {showImpression && (
            <div key="impression" className="section-body">
              <p className="impression-text">{item.impression || 'Nothing written yet — add your impressions from Edit.'}</p>
              <div className="impression-meta">
                <span className="stars" style={{ color: accent }}>
                  {starsFor(item.rating)}
                </span>
                <span className="verdict">{item.verdict || 'No verdict yet'}</span>
              </div>
            </div>
          )}

          {showNotes && (
            <div key="notes" className="section-body notes-col">
              <div className="section-toolbar">
                <button type="button" className="link-btn" onClick={() => setAddingNote((v) => !v)}>
                  {addingNote ? 'Cancel' : '+ Add note'}
                </button>
              </div>
              {addingNote && (
                <NoteForm
                  onSubmit={(note) => {
                    onAddNote(note);
                    setAddingNote(false);
                  }}
                  onCancel={() => setAddingNote(false)}
                />
              )}
              {notes.length === 0 && !addingNote && <p className="empty-section-hint">No notes yet.</p>}
              {notes.map((n, idx) => (
                <div className="note-row" key={idx}>
                  <p className="note-meta">
                    <span>
                      {n.when}
                      {n.when && n.at ? '  ·  ' : ''}
                      {n.at}
                    </span>
                    <button type="button" className="icon-remove" title="Remove note" onClick={() => onRemoveNote(idx)}>
                      ×
                    </button>
                  </p>
                  <p className="note-text">{n.text}</p>
                </div>
              ))}
            </div>
          )}

          {showKeeps && (
            <div key="keeps" className="section-body keeps-col">
              <div className="section-toolbar">
                <button type="button" className="link-btn" onClick={() => setAddingKeep((v) => !v)}>
                  {addingKeep ? 'Cancel' : '+ Add kept line'}
                </button>
              </div>
              {addingKeep && (
                <KeepForm
                  onSubmit={(keep) => {
                    onAddKeep(keep);
                    setAddingKeep(false);
                  }}
                  onCancel={() => setAddingKeep(false)}
                />
              )}
              {keeps.length === 0 && !addingKeep && <p className="empty-section-hint">Nothing kept yet.</p>}
              {keeps.map((k, idx) => (
                <div className="keep-block" style={{ borderColor: accent }} key={idx}>
                  <p className="keep-text">“{k.text}”</p>
                  <p className="keep-at">
                    <span>{k.at}</span>
                    <button type="button" className="icon-remove" title="Remove" onClick={() => onRemoveKeep(idx)}>
                      ×
                    </button>
                  </p>
                </div>
              ))}
            </div>
          )}

          {showDetails && (
            <div key="details" className="section-body">
              <div className="facts-grid">
                {facts.map(([k, v], idx) => (
                  <div className="fact-row" key={idx}>
                    <p className="fact-key">{k}</p>
                    <p className="fact-val">{v}</p>
                  </div>
                ))}
              </div>
              {item.tags?.length > 0 && (
                <div className="tags-row">
                  {item.tags.map((t, idx) => (
                    <span className="tag-pill" key={idx}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <HeroStage
          item={item}
          shape={shape}
          dark={dark}
          glow={glow}
          motion={motion}
          px={px}
          py={py}
          accent={accent}
          accentGlow={accentGlow}
          firstKeepLabel={categoryMeta.keepLabel || 'Kept because'}
          sections={sections}
          sec={sec}
          onDotClick={setSec}
        />
      </main>

      <div className="nav-buttons">
        <button type="button" className="nav-btn" onClick={onPrev} aria-label="Previous">
          ←
        </button>
        <button type="button" className="nav-btn" onClick={onNext} aria-label="Next">
          →
        </button>
        <span className="nav-pos-label">{posLabel}</span>
      </div>
    </>
  );
}
