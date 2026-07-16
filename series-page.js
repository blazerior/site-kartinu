/* series-page.js — shared logic for all series pages */
'use strict';

(function () {
  /* Merge series-specific translations injected via window.SERIES_TRANSLATIONS */
  if (typeof translations !== 'undefined' && window.SERIES_TRANSLATIONS) {
    Object.assign(translations.ru, window.SERIES_TRANSLATIONS.ru);
    Object.assign(translations.en, window.SERIES_TRANSLATIONS.en);
    applyLang(currentLang);
  }

  /* Navbar always scrolled on series pages */
  const navbarEl = document.getElementById('navbar');
  if (navbarEl) {
    window.addEventListener('scroll', () => {
      navbarEl.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
    navbarEl.classList.add('scrolled');
  }

  /* Reveal on scroll */
  const revEls = document.querySelectorAll('.reveal');
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  revEls.forEach(el => revObs.observe(el));

  /* Read-more toggle */
  const descCollapse = document.getElementById('descCollapse');
  const descToggle   = document.getElementById('descToggle');
  if (descCollapse && descToggle) {
    const toggleText = descToggle.querySelector('.desc-toggle-text');
    const getLang = () => typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (key) => (window.SERIES_TRANSLATIONS?.[getLang()]?.[key]) || (translations?.[getLang()]?.[key]) || '';
    descToggle.addEventListener('click', () => {
      const open = descCollapse.classList.contains('expanded');
      descCollapse.classList.toggle('collapsed', open);
      descCollapse.classList.toggle('expanded', !open);
      descToggle.classList.toggle('open', !open);
      descToggle.setAttribute('aria-expanded', String(!open));
      toggleText.textContent = t(open ? 'toggle.more' : 'toggle.less');
    });
  }

  /* Thumbnail switcher */
  document.querySelectorAll('.work-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const mainImg = document.getElementById(thumb.dataset.main);
      if (!mainImg) return;
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = thumb.dataset.src;
        mainImg.alt = thumb.dataset.alt || '';
        mainImg.style.transition = 'opacity 0.4s ease';
        mainImg.style.opacity = '1';
      }, 200);
      thumb.closest('.work-images').querySelectorAll('.work-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  /* Lightbox */
  const lb     = document.getElementById('lightbox');
  const lbImg  = document.getElementById('lightboxImg');
  const lbCap  = document.getElementById('lightboxCaption');
  const lbCls  = document.getElementById('lightboxClose');
  const lbPrev = document.getElementById('lightboxPrev');
  const lbNext = document.getElementById('lightboxNext');
  if (!lb) return;

  let imgs = [], idx = 0;
  const build = () => { imgs = Array.from(document.querySelectorAll('.work-main-img img')).map(i => ({ src: i.src, alt: i.alt })); };
  build();

  const show = () => {
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = imgs[idx].src; lbImg.alt = imgs[idx].alt;
      lbCap.textContent = imgs[idx].alt;
      lbImg.style.transition = 'opacity 0.3s ease'; lbImg.style.opacity = '1';
    }, 150);
  };
  const open  = i => { idx = i; show(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };

  document.querySelectorAll('.work-main-img').forEach((wrap, i) => {
    wrap.addEventListener('click', () => { imgs[i] = { src: wrap.querySelector('img').src, alt: wrap.querySelector('img').alt }; open(i); });
  });
  lbCls.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  lbPrev.addEventListener('click', () => { idx = (idx - 1 + imgs.length) % imgs.length; show(); });
  lbNext.addEventListener('click', () => { idx = (idx + 1) % imgs.length; show(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft')  { idx = (idx - 1 + imgs.length) % imgs.length; show(); }
    if (e.key === 'ArrowRight') { idx = (idx + 1) % imgs.length; show(); }
  });
})();
