'use client';

import { useEffect } from 'react';

export default function SnapshotBehavior() {
  useEffect(() => {
    const form = document.querySelector('form.q28hss0');
    const input = form?.querySelector('input[name="q"]');
    const cards = [...document.querySelectorAll('li._1k4kfb2')];
    const heading = document.querySelector('h1._1t0uzcx1 > span:last-child');
    const grid = document.querySelector('ul._1k4kfb1');
    if (!form || !input || !heading || !grid) return;

    const empty = document.createElement('p');
    empty.className = 'snapshot-empty';
    empty.textContent = '검색 결과가 없어요.';
    grid.after(empty);

    function update() {
      const query = new URLSearchParams(location.search).get('q')?.trim() || '';
      input.value = query;
      heading.textContent = query ? `${query} 중고거래 검색 결과` : '정자동 중고거래 검색 결과';
      let visible = 0;
      for (const card of cards) {
        const title = card.querySelector('.ntyo5jk')?.textContent || '';
        const matches = !query || title.toLocaleLowerCase().includes(query.toLocaleLowerCase());
        card.hidden = !matches;
        if (matches) visible++;
      }
      empty.hidden = visible > 0;
      const pagination = document.querySelector('nav.aljfgy0');
      if (pagination) pagination.hidden = !!query;
    }
    function submit(event) {
      event.preventDefault();
      const url = new URL(location.href);
      url.pathname = '/';
      const value = input.value.trim();
      if (value) url.searchParams.set('q', value);
      else url.searchParams.delete('q');
      history.pushState(null, '', url);
      update();
    }
    function click(event) {
      const link = event.target.closest('a[href^="/?q="]');
      if (!link) return;
      event.preventDefault();
      history.pushState(null, '', link.href);
      update();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    form.addEventListener('submit', submit);
    document.addEventListener('click', click);
    window.addEventListener('popstate', update);
    update();
    return () => {
      form.removeEventListener('submit', submit);
      document.removeEventListener('click', click);
      window.removeEventListener('popstate', update);
      empty.remove();
    };
  }, []);
  return null;
}
