import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark' | 'oled';
export type TextSize = 'small' | 'default' | 'large' | 'extra-large';
export type ContentWidth = 'narrow' | 'default' | 'wide';
export type LineHeight = 'compact' | 'comfortable' | 'spacious';
export type Density = 'compact' | 'comfortable';
export type ContentFont = 'sans' | 'serif';

interface ThemeState {
  mode: ThemeMode;
  textSize: TextSize;
  contentWidth: ContentWidth;
  lineHeight: LineHeight;
  density: Density;
  contentFont: ContentFont;
  
  setMode: (mode: ThemeMode) => void;
  setTextSize: (size: TextSize) => void;
  setContentWidth: (width: ContentWidth) => void;
  setLineHeight: (height: LineHeight) => void;
  setDensity: (density: Density) => void;
  setContentFont: (font: ContentFont) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      textSize: 'default',
      contentWidth: 'default',
      lineHeight: 'comfortable',
      density: 'comfortable',
      contentFont: 'sans',
      
      setMode: (mode) => set({ mode }),
      setTextSize: (textSize) => set({ textSize }),
      setContentWidth: (contentWidth) => set({ contentWidth }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setDensity: (density) => set({ density }),
      setContentFont: (contentFont) => set({ contentFont }),
    }),
    {
      name: 'mindspark-theme-storage',
    }
  )
);
