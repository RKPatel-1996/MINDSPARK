import React, { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode, textSize, contentWidth, lineHeight, density, contentFont } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (currentMode: string) => {
      root.classList.remove('dark', 'oled');
      if (currentMode === 'oled') {
        root.classList.add('oled');
      } else if (currentMode === 'dark') {
        root.classList.add('dark');
      } else if (currentMode === 'system') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        }
      }
    };

    applyTheme(mode);

    // Listen for system changes if in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);

    // Text Size
    const sizeMap = {
      'small': '14px',
      'default': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--text-size', sizeMap[textSize]);

    // Content Width
    const widthMap = {
      'narrow': '600px',
      'default': '768px',
      'wide': '1024px'
    };
    root.style.setProperty('--content-width', widthMap[contentWidth]);

    // Line Height
    const lhMap = {
      'compact': '1.3',
      'comfortable': '1.5',
      'spacious': '1.7'
    };
    root.style.setProperty('--line-height', lhMap[lineHeight]);

    // Density
    if (density === 'compact') {
      root.style.setProperty('--spacing-xs', '0.125rem');
      root.style.setProperty('--spacing-sm', '0.25rem');
      root.style.setProperty('--spacing-md', '0.5rem');
      root.style.setProperty('--spacing-lg', '1rem');
      root.style.setProperty('--spacing-xl', '1.5rem');
    } else {
      root.style.setProperty('--spacing-xs', '0.25rem');
      root.style.setProperty('--spacing-sm', '0.5rem');
      root.style.setProperty('--spacing-md', '1rem');
      root.style.setProperty('--spacing-lg', '1.5rem');
      root.style.setProperty('--spacing-xl', '2rem');
    }

    // Content Font
    const fontMap = {
      'sans': 'ui-sans-serif, system-ui, sans-serif',
      'serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
    };
    root.style.setProperty('--font-content', fontMap[contentFont]);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [mode, textSize, contentWidth, lineHeight, density, contentFont]);

  return <>{children}</>;
};
