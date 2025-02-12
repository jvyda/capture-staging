import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeColors, ColorPath } from './types';
import { defaultTheme } from './defaults';
import { getContrastRatio, debounce } from './utils';

interface ThemeStore {
  colors: ThemeColors;
  setColor: (path: ColorPath, value: string) => void;
  resetColors: () => void;
  exportTheme: () => string;
  importTheme: (themeJson: string) => void;
}

const updateTheme = debounce((colors: ThemeColors) => {
  document.documentElement.style.setProperty('--theme-transition', 'all 0.2s ease-in-out');
  setTimeout(() => {
    document.documentElement.style.removeProperty('--theme-transition');
  }, 200);
}, 100);

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      colors: defaultTheme,
      
      setColor: (path: ColorPath, value: string) => {
        const colors = { ...get().colors };
        let current: any = colors;
        
        // Navigate to the nested property
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        
        // Check contrast ratio for text colors
        if (path.includes('text') || path.includes('background')) {
          const contrastRatio = getContrastRatio(value, '#FFFFFF');
          if (contrastRatio < 4.5) {
            console.warn('Warning: Poor contrast ratio detected');
          }
        }
        
        // Update the color
        current[path[path.length - 1]] = value;
        set({ colors });
        
        // Update theme with debounce
        updateTheme(colors);
      },
      
      resetColors: () => {
        set({ colors: defaultTheme });
      },
      
      exportTheme: () => {
        return JSON.stringify(get().colors, null, 2);
      },
      
      importTheme: (themeJson: string) => {
        try {
          const colors = JSON.parse(themeJson);
          set({ colors });
        } catch (error) {
          console.error('Invalid theme JSON');
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);