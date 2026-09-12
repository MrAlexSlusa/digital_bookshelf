// Render's free tier spins a web service down after ~15 minutes with no
// inbound HTTP traffic, so the next visitor pays a ~10-15 second cold start.
// A request the service makes to its own public URL still arrives as inbound
// traffic, which resets that idle timer and keeps the instance warm.
//
// This holds a running server up; it cannot wake one that has already gone to
// sleep (nothing is running to send the request). Something has to make the
// first request after a deploy or a restart -- the Ping API health workflow,
// an external monitor, or a visitor.

const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;
const MIN_INTERVAL_MS = 60 * 1000;
// Must stay comfortably under Render's ~15 minute idle window, or a ping can
// land after the service has already been put to sleep.
const MAX_INTERVAL_MS = 14 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30 * 1000;

function resolveIntervalMs() {
  const raw = Number(process.env.SELF_PING_INTERVAL_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_INTERVAL_MS;
  return Math.min(Math.max(raw, MIN_INTERVAL_MS), MAX_INTERVAL_MS);
}

// Render injects RENDER_EXTERNAL_URL; SELF_PING_URL overrides it for other
// hosts (or to point at a specific hostname).
function resolveBaseUrl() {
  const raw = process.env.SELF_PING_URL || process.env.RENDER_EXTERNAL_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

// Returns the interval handle, or null when self-pinging is off.
export function startSelfPing() {
  if (process.env.SELF_PING === 'off') return null;

  // Pinging localhost in development is pointless noise -- nothing there
  // sleeps. Set SELF_PING=on to exercise it locally anyway.
  const enabled = process.env.NODE_ENV === 'production' || process.env.SELF_PING === 'on';
  if (!enabled) return null;

  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    console.warn(
      'Self-ping is enabled but no public URL is available. Set SELF_PING_URL ' +
        '(or deploy somewhere that provides RENDER_EXTERNAL_URL) to keep the ' +
        'instance warm.',
    );
    return null;
  }

  const target = `${baseUrl}/api/health`;
  const intervalMs = resolveIntervalMs();

  const ping = async () => {
    try {
      const res = await fetch(target, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { 'user-agent': 'digital-bookshelf-self-ping' },
      });
      // A non-200 still counts as traffic, so it keeps the instance awake --
      // but it means something is wrong with the app, so say so.
      if (!res.ok) {
        console.warn(`Self-ping got HTTP ${res.status} from ${target}`);
      }
    } catch (err) {
      // Never let a failed ping take the process down; the next one may work.
      console.warn(`Self-ping to ${target} failed: ${err.message}`);
    }
  };

  const timer = setInterval(ping, intervalMs);
  // Don't hold the event loop open on shutdown.
  timer.unref();

  console.log(
    `Self-ping enabled: ${target} every ${Math.round(intervalMs / 1000)}s`,
  );
  return timer;
}
