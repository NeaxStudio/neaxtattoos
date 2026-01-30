import { useMemo } from 'react';

// By default, animations are ON (as requested).
// Set `localStorage.setItem('motion', 'off')` to disable.
export function useMotionEnabled() {
  return useMemo(() => {
    try {
      return localStorage.getItem('motion') !== 'off';
    } catch {
      return true;
    }
  }, []);
}
