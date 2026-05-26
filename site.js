/* ============================================================
   Звёздный — общий скрипт для всех страниц.
   Инжектит header/footer, держит nav-state, reveal, форму.
   ============================================================ */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const THEME_KEY = 'theme';

function readTheme() {
  try { return localStorage.getItem(THEME_KEY); }
  catch { return null; }
}

function writeTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); }
  catch { /* ignore */ }
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('theme-dark', isDark);
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.textContent = isDark ? '☼' : '☾';
  btn.setAttribute('aria-pressed', String(isDark));
  btn.setAttribute('aria-label', isDark ? 'Включить дневную тему' : 'Включить ночную тему');
  btn.title = isDark ? 'Дневная тема' : 'Ночная тема';
}

applyTheme(readTheme() === 'dark' ? 'dark' : 'light');

/* -------- Подгрузка partials -------- */
async function injectPartial(slot, url) {
  const el = document.getElementById(slot);
  if (!el) return;
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) return;
    el.outerHTML = await r.text();
  } catch (e) { /* ignore */ }
}

async function boot() {
  await Promise.all([
    injectPartial('site-header', '_partials/header.html'),
    injectPartial('site-footer', '_partials/footer.html'),
  ]);

  // подсветить активный пункт меню
  const active = document.body.dataset.page;
  if (active) {
    document.querySelectorAll('.topnav a').forEach(a => {
      if (a.dataset.page === active) a.classList.add('is-active');
    });
  }

  initBurger();
  initScroll();
  initReveal();
  initForm();
  initGallery();
  initTheme();
  initBentoSpotlight();
}

/* -------- THEME (light/dark) -------- */
function initTheme() {
  const btn = document.getElementById('themeToggle');
  applyTheme(document.body.classList.contains('theme-dark') ? 'dark' : 'light');
  if (btn) btn.addEventListener('click', () => {
    const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(next);
    writeTheme(next);
  });
}

/* -------- BENTO + CARD spotlight (radial-glow по курсору) -------- */
function initBentoSpotlight() {
  if (prefersReduced) return;
  const cells = document.querySelectorAll('.bento__cell, .card');
  cells.forEach(cell => {
    let raf = null;
    cell.addEventListener('pointermove', (e) => {
      const r = cell.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        cell.style.setProperty('--mx', x + '%');
        cell.style.setProperty('--my', y + '%');
      });
    });
  });
}

/* -------- Бургер -------- */
function initBurger() {
  const burger = document.getElementById('burger');
  const topnav = document.getElementById('topnav');
  if (!burger || !topnav) return;
  burger.addEventListener('click', () => topnav.classList.toggle('open'));
  topnav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => topnav.classList.remove('open'))
  );
}

/* -------- Scroll: nav-state + parallax -------- */
function initScroll() {
  const top = document.querySelector('.topbar');
  const heroPhoto = document.getElementById('heroPhoto');
  const parallaxNodes = document.querySelectorAll('[data-parallax]');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (top) top.classList.toggle('scrolled', y > 40);
      if (!prefersReduced) {
        if (heroPhoto) heroPhoto.style.transform = `scale(1.04) translateY(${y * 0.18}px)`;
        parallaxNodes.forEach(el => {
          const k = parseFloat(el.dataset.parallax) || 0.15;
          const rect = el.parentElement.getBoundingClientRect();
          const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * k;
          el.style.transform = `translateY(${offset}px)`;
        });
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* -------- Reveal на скролле -------- */
function initReveal() {
  const targets = document.querySelectorAll(
    '.chapter__head, .chapter__col, .castle__text, .rooms__head, .card, ' +
    '.table__split > *, .services h4, .place__head, .place__dist li, .place__map, ' +
    '.book__col, .book__form, .page__head, .post, .gal__item, .price-row, .feature'
  );
  targets.forEach(el => el.classList.add('reveal-up'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => io.observe(el));
}

/* -------- Booking form -------- */
function initForm() {
  const form = document.getElementById('bookForm');
  if (!form) return;
  const today = new Date().toISOString().slice(0, 10);
  form.querySelectorAll('input[type=date]').forEach(i => i.min = today);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Это демо на GitHub Pages. Форма не отправляется, но на боевом сайте подключается к заявкам.');
    form.reset();
  });
}

/* -------- Галерея на странице номера -------- */
function initGallery() {
  const gal = document.querySelector('.gal');
  if (!gal) return;
  const main = gal.querySelector('.gal__main img');
  gal.querySelectorAll('.gal__thumb').forEach(t => {
    t.addEventListener('click', () => {
      gal.querySelectorAll('.gal__thumb.is-active').forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
      if (main) main.src = t.dataset.full || t.querySelector('img').src;
    });
  });
}

document.addEventListener('DOMContentLoaded', boot);
