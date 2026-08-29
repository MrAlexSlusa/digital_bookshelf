import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-secret';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, matches the session cookie maxAge

function sign(payloadB64) {
  return crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
}

export function signToken(userId) {
  const payloadB64 = Buffer.from(JSON.stringify({ userId, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, sig] = token.split('.');
  const expected = sign(payloadB64);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
