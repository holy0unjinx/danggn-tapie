'use client';

import { useEffect } from 'react';
import { formatRelativeTime } from '../lib/time';

export default function RelativeTimes() {
  useEffect(() => {
    function update() {
      document.querySelectorAll('time[datetime]').forEach((node) => {
        const datetime = node.getAttribute('datetime');
        if (!datetime) return;
        const bumped = node.getAttribute('data-bumped') === 'true' || /^\s*끌올/.test(node.textContent || '');
        if (bumped) node.setAttribute('data-bumped', 'true');
        const offsetMinutes = Number(node.getAttribute('data-offset')) || 0;
        node.textContent = formatRelativeTime(datetime, { bumped, offsetMinutes });
      });
    }
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);
  return null;
}
