import {
  heroCoverBackStyle,
  heroCoverStyle,
  heroGlowStyle,
  heroHingeStyle,
  heroPageStyle,
  heroReflectionStyle,
  heroSizeFor,
  heroStageStyle,
  heroTiltStyle,
} from './styles.js';

export default function HeroStage({ item, shape, dark, glow, motion, px, py, accent, accentGlow, firstKeepLabel, sections, sec, onDotClick }) {
  const canOpen = shape.kind !== 'quote';
  const { w: hw, h: hh } = heroSizeFor(shape.kind);
  const firstKeep = item.keeps?.[0]?.text || item.title;

  return (
    <div className="hero-col">
      <div style={heroGlowStyle(accentGlow)} />
      <div className="hero-perspective">
        <div style={heroTiltStyle({ canOpen, hw, px, py, motion })}>
          <div className="hero-arrive">
            <div className="hero-floaty">
              <div style={heroStageStyle(hw, hh)}>
                {canOpen && (
                  <div style={heroPageStyle(dark)}>
                    <div className="hero-page-overlay" />
                    <div className="hero-page-content">
                      <div>
                        <p className="hero-keep-label">{firstKeepLabel}</p>
                        <p className="hero-keep-text">“{firstKeep}”</p>
                      </div>
                      <p className="hero-page-sub">{item.sub}</p>
                    </div>
                  </div>
                )}

                <div style={heroHingeStyle(canOpen)}>
                  <div style={heroCoverStyle({ shape, hue: item.hue, dark, glow, coverUrl: item.coverUrl })}>
                    <div className="hero-cover-texture" />
                    {shape.kind === 'spine' && <div className="hero-cover-spine" />}
                    {shape.kind === 'film' && (
                      <>
                        <div className="hero-cover-film-top" />
                        <div className="hero-cover-film-bottom" />
                      </>
                    )}
                    <div className="hero-cover-content">
                      <div>
                        <div className="hero-cover-rule" />
                        <h3 className="hero-cover-title">{item.title}</h3>
                      </div>
                      <div>
                        <p className="hero-cover-sub">{item.sub}</p>
                        <p className="hero-cover-year">{item.year}</p>
                      </div>
                    </div>
                  </div>
                  {canOpen && <div style={heroCoverBackStyle(item.hue)} />}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={heroReflectionStyle(hw, hh, item.hue, dark)} />
      </div>

      <div className="dot-nav">
        {sections.map((label, idx) => (
          <button
            key={label}
            type="button"
            title={label}
            className="dot"
            style={{
              width: idx === sec ? 9 : 6,
              height: idx === sec ? 9 : 6,
              background: idx === sec ? accent : 'var(--line)',
            }}
            onClick={() => onDotClick(idx)}
          />
        ))}
      </div>
    </div>
  );
}
