import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShortcutAction = 
  | 'navigation.review'
  | 'navigation.library'
  | 'navigation.insights'
  | 'navigation.settings'
  | 'navigation.search'
  | 'review.option1'
  | 'review.option2'
  | 'review.option3'
  | 'review.option4'
  | 'review.confirm'
  | 'review.reveal'
  | 'review.again'
  | 'review.hard'
  | 'review.good'
  | 'review.easy'
  | 'review.why'
  | 'review.flag'
  | 'review.continue'
  | 'overlay.close';

export const defaultShortcuts: Record<ShortcutAction, string> = {
  'navigation.review': 'g r',
  'navigation.library': 'g l',
  'navigation.insights': 'g i',
  'navigation.settings': 'g s',
  'navigation.search': '/',
  'review.option1': '1',
  'review.option2': '2',
  'review.option3': '3',
  'review.option4': '4',
  'review.confirm': 'Enter',
  'review.reveal': ' ',
  'review.again': '1',
  'review.hard': '2',
  'review.good': '3',
  'review.easy': '4',
  'review.why': '?',
  'review.flag': 'f',
  'review.continue': 'Enter',
  'overlay.close': 'Escape',
};

interface ShortcutState {
  shortcuts: Record<ShortcutAction, string>;
  setShortcut: (action: ShortcutAction, sequence: string) => void;
  clearShortcut: (action: ShortcutAction) => void;
  restoreDefaults: () => void;
}

export const useShortcutStore = create<ShortcutState>()(
  persist(
    (set) => ({
      shortcuts: { ...defaultShortcuts },
      setShortcut: (action, sequence) => 
        set((state) => ({
          shortcuts: { ...state.shortcuts, [action]: sequence },
        })),
      clearShortcut: (action) =>
        set((state) => ({
          shortcuts: { ...state.shortcuts, [action]: '' },
        })),
      restoreDefaults: () => set({ shortcuts: { ...defaultShortcuts } }),
    }),
    {
      name: 'mindspark-shortcuts-storage',
    }
  )
);
