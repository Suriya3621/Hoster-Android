import { createContext, useContext, useEffect, useState } from 'react';
import { themes, DEFAULT_THEME } from '../themes/themes';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'hoster:theme';

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && themes[saved] ? saved : DEFAULT_THEME;
  });

  useEffect(() => {
    const vars = themes[themeId] || themes[DEFAULT_THEME];
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
    root.dataset.theme = themeId;
    localStorage.setItem(STORAGE_KEY, themeId);
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
