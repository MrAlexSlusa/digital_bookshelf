import { useEffect, useState } from 'react';
import { extractPalette } from './coverLookup.js';

// Module-level so the same cover isn't re-sampled every time it's shown
// (switching items, reopening detail view, etc).
const cache = new Map();

// Returns the dominant hues sampled from `coverUrl` (most prominent first),
// so backgrounds can blend the real colours of a book/movie's actual
// artwork instead of relying on one manually-picked or stale stored hue.
// Falls back to `fallbackHue` (the item's stored hue, or a default) until
// the sample resolves, or if there's no cover / extraction fails.
export function useCoverPalette(coverUrl, fallbackHue) {
  const [hues, setHues] = useState(() => (coverUrl && cache.has(coverUrl) ? cache.get(coverUrl) : null));

  useEffect(() => {
    if (!coverUrl) {
      setHues(null);
      return undefined;
    }
    if (cache.has(coverUrl)) {
      setHues(cache.get(coverUrl));
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    extractPalette(coverUrl, controller.signal, 3).then((result) => {
      if (cancelled) return;
      cache.set(coverUrl, result);
      setHues(result);
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [coverUrl]);

  if (hues && hues.length) return hues;
  return [fallbackHue ?? 200];
}
