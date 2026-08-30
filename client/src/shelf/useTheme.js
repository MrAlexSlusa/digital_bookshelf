import { useCallback, useEffect, useState } from 'react';

export function useTheme(initialTheme) {
  const [theme, setTheme] = useState(() => {
    if (initialTheme) return initialTheme;
    try {
      return localStorage.getItem('shelf-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem('shelf-theme', theme);
    } catch {
      /* private browsing / storage disabled — theme just won't persist */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, setTheme, toggleTheme };
}
