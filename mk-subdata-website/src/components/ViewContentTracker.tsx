'use client';

import { useEffect, useRef } from 'react';
import { trackMetaEvent } from '@/lib/metaPixel';

/**
 * Fires the Meta "ViewContent" event once per page mount. Renders nothing.
 */
export default function ViewContentTracker({
  contentName,
  contentCategory,
}: {
  contentName: string;
  contentCategory: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackMetaEvent('ViewContent', {
      content_name: contentName,
      content_category: contentCategory,
    });
  }, [contentName, contentCategory]);

  return null;
}
