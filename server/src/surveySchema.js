// Fixed survey questions asked for every book. Custom fields (user-defined,
// stored in the custom_fields table) are appended to this list at runtime.
export const FIXED_QUESTIONS = [
  {
    key: 'wouldRecommend',
    label: 'Would you recommend this book?',
    type: 'select',
    options: ['Yes', 'No', 'Maybe'],
  },
  {
    key: 'metExpectations',
    label: 'Did it meet your expectations?',
    type: 'scale',
    options: { min: 1, max: 5 },
  },
  {
    key: 'pacing',
    label: 'How was the pacing?',
    type: 'select',
    options: ['Too slow', 'Just right', 'Too fast'],
  },
  {
    key: 'wouldReread',
    label: 'Would you read it again?',
    type: 'select',
    options: ['Yes', 'No'],
  },
  {
    key: 'format',
    label: 'Format read',
    type: 'select',
    options: ['Physical', 'Ebook', 'Audiobook'],
  },
];
