import { create } from "zustand";

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    document.documentElement.dataset.theme = newTheme;
    try {
      localStorage.setItem('theme', newTheme);
    } catch {}
  },
  initTheme: () => {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark') {
        set({ theme: 'dark' });
        document.documentElement.dataset.theme = 'dark';
      }
    } catch {}
  }
}));
