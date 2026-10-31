import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listPostedArticles } from '../lib/articles';
import { refreshTimeLabels } from '../lib/time';
import { currentPublicUser } from '../lib/session';
import { listChats } from '../lib/chats';
import SnapshotBehavior from './snapshot-behavior';
import AccountBar from './account-bar';

const markup = readFileSync(join(process.cwd(), 'data/snapshot.html'), 'utf8');
const writeLink = '<a href="/write" class="seed-action-button seed-action-button--variant_brandSolid seed-action-button--size_small seed-action-button--layout_withText seed-action-button--size_small-layout_withText snapshot-write-link">＋ 새 글 쓰기</a>';

export const dynamic = 'force-dynamic';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function postedCard(article) {
  const title = escapeHtml(article.title);
  const price = escapeHtml(article.price);
  const region = escapeHtml(article.region);
  const image = escapeHtml(article.image);
  const id = escapeHtml(article.id);
  const datetime = escapeHtml(article.datetime);
  const time = escapeHtml(article.time);
  const bumped = article.bumped ? ' data-bumped="true"' : '';
  return `<li class="_1k4kfb2"><a href="/article/${id}" class="_1k4kfb3"><div class="seed-box ntyo5ja ntyo5j8 ntyo5jb ntyo5j6 ntyo5jd ntyo5j9" style="--seed-box-gap-base: var(--seed-dimension-x3); --seed-box-display-base: flex; --seed-box-flex-direction-base: column;"><div class="seed-box ntyo5je"><div class="seed-box ntyo5jf _1ry7q92" style="--seed-box-width-base: 100%;"><span class="ntyo5jg lazy-load-image-background opacity lazy-load-image-loaded" style="color: transparent; display: inline-block;"><img class="ntyo5jh" src="${image}" alt="${title}"></span></div></div><div class="seed-box ntyo5ji" style="--seed-box-align-items: flex-start; --seed-box-display-base: flex; --seed-box-flex-direction-base: column;"><div class="seed-box ntyo5jj" style="--seed-box-align-items: flex-start; --seed-box-width-base: 100%; --seed-box-display-base: flex; --seed-box-flex-direction-base: column;"><span class="seed-text seed-text--textStyle_t5Regular seed-text--maxLines_single seed-text--textDecorationLine_none ntyo5jk" style="--seed-max-lines: 1; --seed-text-color: var(--seed-color-fg-neutral);">${title}</span><span class="seed-text seed-text--textStyle_t5Bold seed-text--maxLines_single seed-text--textDecorationLine_none ntyo5jl" style="--seed-max-lines: 1; --seed-text-color: var(--seed-color-fg-neutral);">${price}</span></div><span class="seed-tag-group__root seed-tag-group__root--size_t3 seed-tag-group__root--truncate_true ntyo5jm"><span class="seed-tag-group-item__root seed-tag-group-item__root--size_t3 seed-tag-group-item__root--weight_regular seed-tag-group-item__root--tone_neutralSubtle"><span class="seed-tag-group-item__label seed-tag-group-item__label--size_t3 seed-tag-group-item__label--weight_regular seed-tag-group-item__label--tone_neutralSubtle"><span class="_1588g1c0">${region}</span></span></span><span aria-hidden="true" class="seed-tag-group__separator seed-tag-group__separator--size_t3 seed-tag-group__separator--truncate_true"><span class="_1588g1c0"> · </span></span><span class="seed-tag-group-item__root seed-tag-group-item__root--size_t3 seed-tag-group-item__root--weight_regular seed-tag-group-item__root--tone_neutralSubtle"><span class="seed-tag-group-item__label seed-tag-group-item__label--size_t3 seed-tag-group-item__label--weight_regular seed-tag-group-item__label--tone_neutralSubtle"><time datetime="${datetime}"${bumped}>${time}</time></span></span></span></div></div></a></li>`;
}

export const metadata = {
  title: '당근 중고거래',
  description: '정자동 중고거래 검색 결과',
};

export default async function HomePage() {
  const user = await currentPublicUser();
  const unread = user ? (await listChats()).reduce((total, chat) => total + chat.unread, 0) : 0;
  const postedCards = (await listPostedArticles()).map(postedCard).join('');
  const content = refreshTimeLabels(markup)
    .replace('<ul class="_1k4kfb1">', `<ul class="_1k4kfb1">${postedCards}`)
    .replace('정자동 중고거래 검색 결과</span></h1></div>', `정자동 중고거래 검색 결과</span></h1>${writeLink}</div>`);
  return (
    <>
      <AccountBar user={user} unread={unread} />
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <a href="/write" className="seed-action-button seed-action-button--variant_brandSolid seed-action-button--size_small seed-action-button--layout_withText seed-action-button--size_small-layout_withText snapshot-mobile-write-link">＋ 새 글 쓰기</a>
      <SnapshotBehavior />
    </>
  );
}
