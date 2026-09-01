export const CATEGORY_ORDER = ['books', 'movies', 'articles', 'quotes'];

export function categoryMetaFor(category, t) {
  return {
    label: t(`category.${category}`),
    singular: t(`category.${category}.singular`),
    keepLabel: t(`category.${category}.keepLabel`),
    verb: t(`category.${category}.verb`),
    back: t(`category.${category}.back`),
    blurb: t(`category.${category}.blurb`),
  };
}

export function shapeFor(category) {
  if (category === 'articles') return { w: 264, h: 172, kind: 'sheet' };
  if (category === 'quotes') return { w: 238, h: 238, kind: 'quote' };
  if (category === 'movies') return { w: 196, h: 288, kind: 'film' };
  return { w: 196, h: 288, kind: 'spine' };
}

export function sectionKeysFor(category) {
  return category === 'quotes' ? ['why', 'notes', 'details'] : ['impressions', 'notes', 'keep', 'details'];
}

export function sectionsFor(category, t) {
  return sectionKeysFor(category).map((key) => {
    if (key === 'why') return t('section.whyIKeptIt');
    if (key === 'notes') return t('section.myNotes');
    if (key === 'details') return t('section.details');
    if (key === 'keep') return t(`category.${category}.keepLabel`);
    return t('section.impressions');
  });
}

export function subLabelFor(category, t) {
  return t(`category.subLabel.${category}`);
}
