// Pure style-calculation helpers, ported from the design's per-item hue
// formulas and transform math. Kept separate from components so the exact
// numbers (README: "final, reproduce closely") live in one auditable place.

export function coverGradient(hue, dark) {
  return `linear-gradient(158deg, oklch(${dark ? 0.34 : 0.36} 0.085 ${hue}) 0%, oklch(0.22 0.055 ${hue}) 55%, oklch(0.15 0.035 ${hue}) 100%)`;
}

export function accentColors(hue, dark, glow = 1) {
  return {
    accent: `oklch(${dark ? 0.78 : 0.56} 0.15 ${hue})`,
    accentGlow: dark
      ? `oklch(0.62 0.20 ${hue} / ${0.55 * glow})`
      : `oklch(0.72 0.14 ${hue} / ${0.42 * glow})`,
    accentSoft: dark
      ? `oklch(0.60 0.17 ${hue} / ${0.34 * glow})`
      : `oklch(0.70 0.11 ${hue} / ${0.30 * glow})`,
  };
}

export function washColors(hue, dark, glow = 1) {
  return {
    washA: dark ? `oklch(0.55 0.14 ${hue} / ${0.20 * glow})` : `oklch(0.80 0.08 ${hue} / ${0.42 * glow})`,
    washB: dark ? `oklch(0.50 0.12 ${hue} / ${0.14 * glow})` : `oklch(0.85 0.05 ${hue} / ${0.30 * glow})`,
  };
}

const maskFade = {
  WebkitMaskImage: 'linear-gradient(to top, transparent, #000)',
  maskImage: 'linear-gradient(to top, transparent, #000)',
};

export function gapFor(shapeKind, spread) {
  if (shapeKind === 'sheet') return spread * 1.28;
  if (shapeKind === 'quote') return spread * 1.16;
  return spread;
}

// One shelf card's full set of derived transforms/styles.
export function shelfCardStyles({ shape, hue, dark, glow, motion, d, nudge, gap, leaving }) {
  const ad = Math.abs(d);
  const vis = ad <= 3;
  const active = d === 0;
  const tx = d * gap * (ad > 1 ? 0.82 : 1);
  const tz = active ? 70 : -110 - ad * 95;
  const ry = active ? -8 + nudge * 5 * motion : -d * 27;
  const rz = active ? nudge * -2.6 * motion : d * 1.4;
  const ty = active ? 0 : ad * 9;
  const sc = active ? 1 : 0.94 - ad * 0.045;
  const op = !vis ? 0 : active ? 1 : 0.76 - ad * 0.16;
  const anim = leaving
    ? active
      ? 'flyaway .5s cubic-bezier(.4,0,.9,.5) both'
      : 'scatter .38s ease both'
    : 'none';

  const wrap = {
    position: 'absolute',
    left: '50%',
    top: '44%',
    width: shape.w,
    marginLeft: -shape.w / 2,
    marginTop: -shape.h * 0.58,
    transformStyle: 'preserve-3d',
    transform: `translate3d(${tx}px,${ty}px,${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
    opacity: op,
    transition: 'transform .78s cubic-bezier(.18,.86,.22,1), opacity .5s ease',
    pointerEvents: vis && !leaving ? 'auto' : 'none',
    cursor: 'pointer',
    zIndex: 20 - ad,
    animation: anim,
    '--o': op,
  };

  const card = {
    position: 'relative',
    width: shape.w,
    height: shape.h,
    borderRadius: shape.kind === 'spine' ? '2px 4px 4px 2px' : '3px',
    overflow: 'hidden',
    background: coverGradient(hue, dark),
    boxShadow:
      `0 30px 60px -18px rgba(0,0,0,${dark ? 0.85 : 0.4}), 0 0 0 1px rgba(255,255,255,.06) inset` +
      (active ? `, 0 0 90px -12px oklch(0.62 0.19 ${hue} / ${(dark ? 0.75 : 0.5) * glow})` : ''),
    animation: `floaty ${(6 + ad) / (motion || 1)}s ease-in-out infinite`,
  };

  const reflection = {
    width: shape.w,
    height: Math.round(shape.h * 0.38),
    marginTop: 8,
    borderRadius: 2,
    background: coverGradient(hue, dark),
    transform: 'scaleY(-1)',
    opacity: dark ? 0.16 : 0.09,
    filter: 'blur(3px)',
    ...maskFade,
  };

  return { wrap, card, reflection, active, visible: vis };
}

export function floorGlowStyle(accentSoft) {
  return {
    position: 'absolute',
    left: '50%',
    top: '54%',
    width: 560,
    height: 130,
    marginLeft: -280,
    borderRadius: '50%',
    background: `radial-gradient(50% 50%, ${accentSoft} 0%, transparent 72%)`,
    filter: 'blur(30px)',
    transition: 'background .7s ease',
    pointerEvents: 'none',
  };
}

export function washStyle(washA, washB) {
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: `radial-gradient(120% 80% at 50% 6%, ${washA} 0%, transparent 62%), radial-gradient(90% 60% at 50% 100%, ${washB} 0%, transparent 70%)`,
    transition: 'background .8s ease',
  };
}

export function heroSizeFor(shapeKind) {
  if (shapeKind === 'sheet') return { w: 470, h: 306 };
  if (shapeKind === 'quote') return { w: 380, h: 380 };
  return { w: 318, h: 464 };
}

export function heroTiltStyle({ canOpen, hw, px, py, motion }) {
  return {
    transformStyle: 'preserve-3d',
    transform: `translateX(${canOpen ? Math.round(hw * 0.42) : 0}px) rotateY(${(-14 + px * 12 * motion).toFixed(2)}deg) rotateX(${(2 - py * 7 * motion).toFixed(2)}deg)`,
    transition: 'transform .45s ease-out',
  };
}

export function heroStageStyle(hw, hh) {
  return { position: 'relative', width: hw, height: hh, transformStyle: 'preserve-3d' };
}

export function heroPageStyle(dark) {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: 3,
    overflow: 'hidden',
    background: 'var(--paper)',
    boxShadow: `0 40px 70px -30px rgba(0,0,0,${dark ? 0.8 : 0.3}), 0 0 0 1px rgba(0,0,0,.08) inset`,
  };
}

export function heroHingeStyle(canOpen) {
  return {
    position: 'absolute',
    inset: 0,
    transformStyle: 'preserve-3d',
    transformOrigin: 'left center',
    animation: canOpen ? 'hinge 1.1s cubic-bezier(.3,.8,.2,1) .85s both' : 'none',
    zIndex: 2,
  };
}

export function heroCoverStyle({ shape, hue, dark, glow }) {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: shape.kind === 'spine' ? '3px 6px 6px 3px' : '3px',
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    background: coverGradient(hue, dark),
    boxShadow: `0 60px 90px -30px rgba(0,0,0,${dark ? 0.9 : 0.4}), 0 0 0 1px rgba(255,255,255,.07) inset, 0 0 160px -20px oklch(0.62 0.20 ${hue} / ${(dark ? 0.9 : 0.5) * glow})`,
  };
}

export function heroCoverBackStyle(hue) {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: 3,
    transform: 'rotateY(180deg)',
    backfaceVisibility: 'hidden',
    background: `linear-gradient(200deg, var(--paper), oklch(0.80 0.02 ${hue}))`,
    boxShadow: '0 0 0 1px rgba(0,0,0,.1) inset',
  };
}

export function heroReflectionStyle(hw, hh, hue, dark) {
  return {
    width: hw,
    height: Math.round(hh * 0.36),
    marginTop: 16,
    borderRadius: 3,
    background: coverGradient(hue, dark),
    transform: 'scaleY(-1)',
    opacity: dark ? 0.15 : 0.09,
    filter: 'blur(6px)',
    ...maskFade,
  };
}

export function heroGlowStyle(accentGlow) {
  return {
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: '50%',
    background: `radial-gradient(50% 50%, ${accentGlow} 0%, transparent 68%)`,
    filter: 'blur(12px)',
    animation: 'bloom 1s cubic-bezier(.2,.8,.2,1) both',
  };
}
