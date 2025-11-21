import { create } from 'zustand';
import { loadTheme, saveTheme } from '../lib/storage/localStorage';
import type { Theme } from '../types';

interface ThemeState {
  theme: Theme;
  actualTheme: 'light' | 'dark'; // Resolved theme (system -> light/dark)
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

// Check system preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Resolve theme to actual light/dark
function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme;
}

// Apply theme to document
function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  actualTheme: 'light',
  
  setTheme: (theme: Theme) => {
    const actualTheme = resolveTheme(theme);
    saveTheme(theme);
    applyTheme(actualTheme);
    set({ theme, actualTheme });
  },
  
  initTheme: () => {
    const theme = loadTheme();
    const actualTheme = resolveTheme(theme);
    applyTheme(actualTheme);
    set({ theme, actualTheme });
    
    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const currentTheme = get().theme;
        if (currentTheme === 'system') {
          const newActualTheme = getSystemTheme();
          applyTheme(newActualTheme);
          set({ actualTheme: newActualTheme });
        }
      };
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
      }
    }
  },
}));
