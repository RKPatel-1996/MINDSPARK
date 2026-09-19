import { useEffect, useRef } from 'react';
import { useShortcutStore, ShortcutAction } from '../store/shortcutStore';

export const useShortcut = (action: ShortcutAction, callback: () => void, enabled = true) => {
  const { shortcuts } = useShortcutStore();
  const sequence = shortcuts[action];
  
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // We should keep callback fresh without re-binding if possible,
  // but simpler to just re-bind if callback changes.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !sequence) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;
      // Handle simple single key shortcuts
      if (sequence.length === 1 || sequence === 'Enter' || sequence === 'Escape' || sequence === ' ') {
         // for space we might have ' '
         if (key === sequence) {
             e.preventDefault();
             callbackRef.current();
         }
         return;
      }

      // Handle sequences like 'g r'
      const parts = sequence.split(' ');
      if (parts.length > 1) {
         bufferRef.current += key;
         
         if (timeoutRef.current) clearTimeout(timeoutRef.current);
         
         // If it matches exactly
         if (bufferRef.current === parts.join('')) {
            e.preventDefault();
            callbackRef.current();
            bufferRef.current = '';
         } else if (!parts.join('').startsWith(bufferRef.current)) {
            // Not a prefix, reset
            bufferRef.current = '';
         } else {
            // It's a prefix, wait for next key
            timeoutRef.current = setTimeout(() => {
                bufferRef.current = '';
            }, 1000);
         }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, sequence]);
};
