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

// Looks up the real poster art from the iTunes Search API so a movie's
// cover can auto-switch to the actual poster once the title is typed.
export async function fetchMoviePoster(title, signal) {
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) return null;

  // Apple's `media=movie` filter currently returns zero results for every
  // query, so search unfiltered and pick the first movie result ourselves.
  const params = new URLSearchParams({ term: trimmedTitle, limit: '10' });
  const res = await fetch(`https://itunes.apple.com/search?${params.toString()}`, { signal });
  if (!res.ok) return null;

  const data = await res.json();
  const artwork = data?.results?.find((r) => r.kind === 'feature-movie')?.artworkUrl100;
  // The API only serves small thumbnails by default; swap the size segment
  // in the URL for a much larger poster image.
  return artwork ? artwork.replace(/\d+x\d+bb\.(jpg|png)$/, '600x600bb.$1') : null;
}

// Articles and quotes have no cover art of their own, so look up an image
// for who/what they're attributed to (a publication's logo, a person's
// portrait) via Wikipedia, which is CORS-open and needs no API key.
export async function fetchWikipediaImage(name, signal) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) return null;

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: trimmedName,
    gsrlimit: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '500',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, { signal });
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages;
  const page = pages ? Object.values(pages)[0] : null;
  return page?.thumbnail?.source || null;
}
