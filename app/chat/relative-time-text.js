import { formatRelativeTime } from '../../lib/time';

// 채팅 시각은 저장된 상품과 달리 기준을 당기지 않고 실제 시간을 쓴다.
// app/relative-times.js 가 data-offset 없는 <time> 을 그대로 갱신한다.
export default function RelativeTimeText({ datetime, className }) {
  if (!datetime) return null;
  return <time className={className} dateTime={datetime}>{formatRelativeTime(datetime)}</time>;
}
