export const CATEGORY_ORDER = ['books', 'movies', 'articles', 'quotes'];

export const CATEGORY_META = {
  books: {
    label: 'Books',
    singular: 'book',
    keepLabel: 'Quotes I kept',
    verb: 'Open my notes',
    back: 'Back to the shelf',
    blurb: 'Drag across the shelf or use the arrow keys. Open a book to read back everything you wrote about it.',
  },
  movies: {
    label: 'Movies',
    singular: 'movie',
    keepLabel: 'Scenes I kept',
    verb: 'Open my notes',
    back: 'Back to the reel',
    blurb: 'Everything watched and worth remembering. Open one to see the notes and the scenes kept.',
  },
  articles: {
    label: 'Articles',
    singular: 'article',
    keepLabel: 'Lines I kept',
    verb: 'Open my notes',
    back: 'Back to the pile',
    blurb: 'Long reads, essays and posts saved after reading. Open one for the summary and lines kept.',
  },
  quotes: {
    label: 'Quotes',
    singular: 'quote',
    keepLabel: '',
    verb: 'Why I kept it',
    back: 'Back to the wall',
    blurb: 'Lines kept out of context on purpose. Open one to see where it came from and why it stayed.',
  },
};

export function shapeFor(category) {
  if (category === 'articles') return { w: 264, h: 172, kind: 'sheet' };
  if (category === 'quotes') return { w: 238, h: 238, kind: 'quote' };
  if (category === 'movies') return { w: 196, h: 288, kind: 'film' };
  return { w: 196, h: 288, kind: 'spine' };
}

export function sectionsFor(category) {
  const keepLabel = CATEGORY_META[category]?.keepLabel;
  return keepLabel ? ['Impressions', 'My notes', keepLabel, 'Details'] : ['Why I kept it', 'My notes', 'Details'];
}

export function subLabelFor(category) {
  if (category === 'movies') return 'Director';
  if (category === 'articles') return 'Publication';
  if (category === 'quotes') return 'Attribution';
  return 'Author';
}
