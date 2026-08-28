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
