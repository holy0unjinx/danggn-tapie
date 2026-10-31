// 저장된 검색 결과의 시간을 2시간 30분 당겨서 읽는다. 2시간 40분 지난 글은 10분 전으로 보인다.
export const SNAPSHOT_OFFSET_MINUTES = 150;

export function formatRelativeTime(datetime, { bumped = false, now = Date.now(), offsetMinutes = 0 } = {}) {
  const then = new Date(datetime).getTime();
  if (!Number.isFinite(then)) return bumped ? '끌올' : '';
  const elapsed = Math.floor(Math.max(0, now - then) / 60000);
  const minutes = Math.max(0, elapsed - offsetMinutes);
  let label = '방금 전';
  if (minutes >= 1 && minutes < 60) label = `${minutes}분 전`;
  else if (minutes >= 60 && minutes < 1440) label = `${Math.floor(minutes / 60)}시간 전`;
  else if (minutes >= 1440) label = `${Math.floor(minutes / 1440)}일 전`;
  return bumped ? `끌올 ${label}` : label;
}

export function isBumpedLabel(label) {
  return /^\s*끌올/.test(label || '');
}

export function refreshTimeLabels(html, now = Date.now(), offsetMinutes = SNAPSHOT_OFFSET_MINUTES) {
  return String(html).replace(/<time([^>]*)>([^<]*)<\/time>/gi, (full, attrs, text) => {
    const datetime = (attrs.match(/datetime="([^"]*)"/i) || [])[1];
    if (!datetime) return full;
    const bumped = /data-bumped="true"/i.test(attrs) || isBumpedLabel(text);
    const label = formatRelativeTime(datetime, { bumped, now, offsetMinutes });
    let next = attrs.replace(/\sdata-bumped="[^"]*"/i, '').replace(/\sdata-offset="[^"]*"/i, '');
    if (bumped) next += ' data-bumped="true"';
    if (offsetMinutes) next += ` data-offset="${offsetMinutes}"`;
    return `<time${next}>${label}</time>`;
  });
}
