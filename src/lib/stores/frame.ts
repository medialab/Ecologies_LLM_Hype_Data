import { readable } from 'svelte/store';

// Global RAF time source. One RAF drives all subscribers.
export const frameNow = readable(0, (set) => {
  if (typeof window === 'undefined') return () => {};

  let rafId: number | null = null;
  let running = true;

  const loop = (t: number) => {
    set(t);
    if (running) rafId = requestAnimationFrame(loop);
  };

  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else if (!running) {
      running = true;
      rafId = requestAnimationFrame(loop);
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  rafId = requestAnimationFrame(loop);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
});

