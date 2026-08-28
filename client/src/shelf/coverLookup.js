// Looks up real cover art from the Open Library API so a book's cover can
// auto-switch to the actual artwork once the title (and author) are typed.
export async function fetchBookCover(title, author, signal) {
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) return null;

  const params = new URLSearchParams({ title: trimmedTitle, limit: '1', fields: 'cover_i' });
  if (author && author.trim()) params.set('author', author.trim());

  const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, { signal });
  if (!res.ok) return null;

  const data = await res.json();
  const coverId = data?.docs?.[0]?.cover_i;
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
}

// Looks up a Wikipedia page's preview image via search + the page-summary
// REST endpoint: search finds the best-matching page title, then the
// summary endpoint gives its lead image. Deliberately not the pageimages
// API (see fetchWikipediaImage below): posters, publication logos, etc.
// are almost always non-free/fair-use files, and pageimages excludes
// those (verified — it returns no thumbnail at all for e.g. "Inception"
// or "Wired"), while the page-summary endpoint does include them, since
// it's just building a preview card.
async function fetchWikipediaSummaryImage(searchTerm, signal) {
  const searchParams = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: searchTerm,
    srlimit: '1',
    format: 'json',
    origin: '*',
  });
  const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams}`, { signal });
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const pageTitle = searchData?.query?.search?.[0]?.title;
  if (!pageTitle) return null;

  const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`, {
    signal,
  });
  if (!summaryRes.ok) return null;
  const summaryData = await summaryRes.json();
  return summaryData.originalimage?.source || summaryData.thumbnail?.source || null;
}

// Looks up the real poster art via Wikipedia so a movie's cover can
// auto-switch to the actual poster once the title is typed.
//
// (The iTunes Search API was tried first, including `media=movie`,
// `entity=movie`, and an unfiltered search filtered client-side for
// kind==="feature-movie" — but none of those reliably return mainstream
// titles like "Inception" or "Dune", so it isn't a reliable source here.)
export async function fetchMoviePoster(title, signal, year) {
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) return null;

  const searchTerm = year && String(year).trim() ? `${trimmedTitle} ${String(year).trim()} film` : `${trimmedTitle} film`;
  return fetchWikipediaSummaryImage(searchTerm, signal);
}

// Articles and quotes have no cover art of their own, so look up an image
// for who/what they're attributed to (a publication's logo, a person's
// portrait) via the same Wikipedia search + page-summary lookup used for
// movie posters above — publication logos are non-free just as often as
// posters are (verified against "Wired"), so the summary endpoint is
// needed here too, not the pageimages API.
export async function fetchWikipediaImage(name, signal) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) return null;

  return fetchWikipediaSummaryImage(trimmedName, signal);
}

// Samples an image client-side (via canvas) and returns up to `maxColors`
// dominant hues (0-359), ordered by how much of the cover they cover (most
// prominent first). Returns [] if the image can't be read (e.g. no CORS
// support) or has no colorful pixels. Bucketing into hue bins (rather than
// flattening every pixel into one average) means a cover with two or three
// strong colors — a red title band over a blue field, say — produces a
// palette that blends all of them instead of one muddy average hue.
export function extractPalette(url, signal, maxColors = 3) {
  return new Promise((resolve) => {
    if (!url) {
      resolve([]);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const onAbort = () => resolve([]);
    signal?.addEventListener('abort', onAbort);
    img.onload = () => {
      signal?.removeEventListener('abort', onAbort);
      try {
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const binCount = 24; // 15deg per bin
        const weights = new Array(binCount).fill(0);
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; // skip transparent pixels
          const rr = data[i];
          const gg = data[i + 1];
          const bb = data[i + 2];
          const max = Math.max(rr, gg, bb);
          const min = Math.min(rr, gg, bb);
          // Skip near-white, near-black and low-saturation pixels so page
          // margins/borders don't wash the palette toward grey.
          if (max > 245 && min > 235) continue;
          if (max < 18) continue;
          if (max - min < 12) continue;
          const hue = rgbToHue(rr, gg, bb);
          const sat = max === 0 ? 0 : (max - min) / max;
          const bin = Math.floor(hue / (360 / binCount)) % binCount;
          weights[bin] += 0.4 + 0.6 * sat; // count vivid pixels more heavily
        }

        const order = weights
          .map((w, bin) => ({ bin, w }))
          .filter((b) => b.w > 0)
          .sort((a, b) => b.w - a.w);

        const palette = [];
        for (const { bin } of order) {
          const hue = Math.round(bin * (360 / binCount) + 360 / binCount / 2);
          const tooClose = palette.some((h) => {
            const diff = Math.abs(h - hue);
            return Math.min(diff, 360 - diff) < 30;
          });
          if (tooClose) continue;
          palette.push(hue);
          if (palette.length >= maxColors) break;
        }
        resolve(palette);
      } catch {
        resolve([]); // tainted canvas (no CORS) or decode failure
      }
    };
    img.onerror = () => {
      signal?.removeEventListener('abort', onAbort);
      resolve([]);
    };
    img.src = url;
  });
}

// Back-compat single-hue wrapper, still used by the item form to pre-fill
// the manual colour picker when a cover is first fetched.
export async function extractDominantHue(url, signal) {
  const palette = await extractPalette(url, signal, 1);
  return palette.length ? palette[0] : null;
}

function rgbToHue(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return Math.round(h);
}
