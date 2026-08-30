// Simple, deterministic rules for turning a pasted line of text into an item
// draft: category + title + sub + year. No network calls, no LLM — just
// pattern matching so an import stays instant and free.

const CATEGORY_TAGS = {
  book: 'books',
  books: 'books',
  movie: 'movies',
  movies: 'movies',
  film: 'movies',
  article: 'articles',
  articles: 'articles',
  quote: 'quotes',
  quotes: 'quotes',
};

// "text" or “text” or 'text', optionally followed by " — Attribution".
const QUOTE_RE = /^[“"'„]([^"”]+)[”"']\s*(?:[-—–]\s*(.+))?$/;
// "Title (1999)" at the end of the line.
const YEAR_RE = /^(.*)\((\d{4})\)\s*$/;
// "Title - Sub" / "Title — Sub" / "Title – Sub"
const DASH_RE = /^(.+?)\s+[-—–]\s+(.+)$/;
const URL_RE = /https?:\/\/\S+/i;

export function parseImportLine(raw) {
  let line = String(raw || '').trim();
  if (!line) return null;

  let category = null;
  const tagMatch = line.match(/^\[(\w+)\]\s*/);
  if (tagMatch && CATEGORY_TAGS[tagMatch[1].toLowerCase()]) {
    category = CATEGORY_TAGS[tagMatch[1].toLowerCase()];
    line = line.slice(tagMatch[0].length).trim();
  }

  const quoteMatch = line.match(QUOTE_RE);
  if (quoteMatch) {
    return {
      category: category || 'quotes',
      title: quoteMatch[1].trim(),
      sub: (quoteMatch[2] || '').trim(),
      year: '',
    };
  }

  let rest = line;
  let year = '';
  const yearMatch = line.match(YEAR_RE);
  if (yearMatch) {
    rest = yearMatch[1].trim();
    year = yearMatch[2];
    if (!category) category = 'movies';
  }

  let title = rest;
  let sub = '';
  const dashMatch = rest.match(DASH_RE);
  if (dashMatch) {
    title = dashMatch[1].trim();
    sub = dashMatch[2].trim();
  }

  if (!category) category = URL_RE.test(line) ? 'articles' : 'books';

  return { category, title: title || line, sub, year };
}

export function parseImportText(text) {
  return String(text || '')
    .split('\n')
    .map(parseImportLine)
    .filter(Boolean);
}
