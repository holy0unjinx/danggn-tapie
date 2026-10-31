'use client';

import { useEffect } from 'react';

export default function ArticleBehavior() {
  useEffect(() => {
    const forms = [...document.querySelectorAll('form')].filter((form) => (
      form.querySelector('input[name="q"]')
    ));
    const submitters = forms.map((form) => {
      const input = form.querySelector('input[name="q"]');
      function submit(event) {
        event.preventDefault();
        const value = input.value.trim();
        location.assign(value ? `/?q=${encodeURIComponent(value)}` : '/');
      }
      form.addEventListener('submit', submit);
      return () => form.removeEventListener('submit', submit);
    });

    const track = document.querySelector('img._1wus0xp0')?.parentElement;
    const images = track ? [...track.querySelectorAll('img._1wus0xp0')] : [];
    const prev = document.querySelector('button[aria-label="Previous item"]');
    const next = document.querySelector('button[aria-label="Next item"]');
    const dots = [...document.querySelectorAll('button[aria-label="Carousel indicator"]')];
    let index = 0;

    function render() {
      if (!track || !images.length) return;
      track.style.transform = `translate3d(-${index * 100}%, 0px, 0px)`;
      track.style.transition = 'transform 240ms ease';
      dots.forEach((dot, i) => {
        dot.classList.toggle('_1wus0xpd', i === index);
      });
      if (prev) {
        prev.classList.toggle('_1wus0xp4', index === 0);
        prev.classList.toggle('_1wus0xp5', index > 0);
      }
      if (next) {
        next.classList.toggle('_1wus0xp7', index === images.length - 1);
        next.classList.toggle('_1wus0xp8', index < images.length - 1);
      }
    }

    function go(delta) {
      if (!images.length) return;
      index = Math.min(images.length - 1, Math.max(0, index + delta));
      render();
    }

    function onPrev() { go(-1); }
    function onNext() { go(1); }
    const onDots = dots.map((dot, i) => {
      const handler = () => { index = i; render(); };
      dot.addEventListener('click', handler);
      return () => dot.removeEventListener('click', handler);
    });
    prev?.addEventListener('click', onPrev);
    next?.addEventListener('click', onNext);
    render();

    return () => {
      submitters.forEach((off) => off());
      prev?.removeEventListener('click', onPrev);
      next?.removeEventListener('click', onNext);
      onDots.forEach((off) => off());
    };
  }, []);

  return null;
}
