declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Safely fire a Meta Pixel event. No-ops if the Pixel is disabled
 * (e.g. NEXT_PUBLIC_META_PIXEL_ID unset), so callers never need to guard.
 *
 * The Pixel's own bootstrap script (see MetaPixel.tsx) can execute after a
 * component's mount effect fires — e.g. it's a later sibling in the layout
 * tree, so a `useEffect` in a page's own children can run first, before
 * `window.fbq` exists at all. Since that's before even the Pixel's internal
 * event queue exists, the call would otherwise be silently lost. Retry
 * briefly instead of dropping it.
 */
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
    return;
  }

  let attempts = 0;
  const maxAttempts = 20; // ~2s at 100ms
  const interval = setInterval(() => {
    attempts += 1;
    if (typeof window.fbq === 'function') {
      clearInterval(interval);
      window.fbq('track', eventName, params);
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 100);
}
