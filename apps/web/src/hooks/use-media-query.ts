'use client';
import { useSyncExternalStore } from 'react';

function getMediaQuerySnapshot(query: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string) {
  const subscribe = (onChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const mediaQueryList = window.matchMedia(query);
    mediaQueryList.addEventListener('change', onChange);

    return () => mediaQueryList.removeEventListener('change', onChange);
  };

  return useSyncExternalStore(
    subscribe,
    () => getMediaQuerySnapshot(query),
    () => false
  );
}
