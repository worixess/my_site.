'use strict';
// FLOREA is a static demo site: no backend, purchases or tracking.
// Only a list of saved bouquets is stored locally in this browser.

const favoritesKey = 'florea.favorite-bouquets.v1';
const cards = Array.from(document.querySelectorAll('.product-card'));
const validIds = new Set(cards.map(card => card.dataset.id));
const favoritesDialog = document.getElementById('favoritesDialog');
const favoriteList = document.getElementById('favoriteList');
const favoriteCount = document.getElementById('favoriteCount');
const toast = document.getElementById('toast');
let toastTimer;
let favorites = new Set();

try {
  const saved = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
  if (Array.isArray(saved)) favorites = new Set(saved.filter(id => validIds.has(id)));
} catch (error) {
  favorites = new Set();
}

function persistFavorites() {
  try { localStorage.setItem(favoritesKey, JSON.stringify([...favorites])); } catch (error) { /* Storage may be disabled. */ }
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function updateFavorites() {
  favoriteCount.textContent = String(favorites.size);
  document.querySelectorAll('[data-favorite]').forEach(button => {
    const isSaved = favorites.has(button.dataset.favorite);
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? '♥' : '♡';
    const title = cards.find(card => card.dataset.id === button.dataset.favorite)?.dataset.title || 'букет';
    button.setAttribute('aria-label', (isSaved ? 'Удалить ' : 'Добавить ') + 'букет «' + title + '» ' + (isSaved ? 'из подборки' : 'в подборку'));
  });
  renderFavoriteList();
}

function renderFavoriteList() {
  favoriteList.replaceChildren();
  if (favorites.size === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-fav';
    const symbol = document.createElement('span');
    symbol.textContent = '✿';
    empty.append(symbol, document.createTextNode('Здесь пока пусто. Нажмите ♡ рядом с понравившимся букетом.'));
    favoriteList.append(empty);
    return;
  }

  cards.filter(card => favorites.has(card.dataset.id)).forEach(card => {
    const row = document.createElement('div');
    row.className = 'favorite-row';
    const image = document.createElement('img');
    image.src = card.querySelector('img').getAttribute('src');
    image.alt = card.querySelector('img').getAttribute('alt');
    image.width = 75;
    image.height = 75;
    const info = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = card.dataset.title;
    const desc = document.createElement('p');
    desc.textContent = card.querySelector('.product-kind').textContent;
    info.append(title, desc);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Удалить «' + card.dataset.title + '»');
    remove.addEventListener('click', () => {
      favorites.delete(card.dataset.id);
      persistFavorites();
      updateFavorites();
    });
    row.append(image, info, remove);
    favoriteList.append(row);
  });
}

document.querySelectorAll('[data-favorite]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.favorite;
  if (favorites.has(id)) {
    favorites.delete(id);
    notify('Убрали из подборки');
  } else {
    favorites.add(id);
    notify('Сохранили в подборку ♡');
  }
  persistFavorites();
  updateFavorites();
}));

function openFavorites() {
  if (typeof favoritesDialog.showModal === 'function' && !favoritesDialog.open) {
    favoritesDialog.showModal();
  } else if (!favoritesDialog.open) {
    favoritesDialog.setAttribute('open', '');
  }
}

for (const id of ['favoritesOpen', 'favoritesBelow', 'ctaFavorites']) {
  document.getElementById(id).addEventListener('click', openFavorites);
}

document.getElementById('closeDialog').addEventListener('click', () => favoritesDialog.close());
favoritesDialog.addEventListener('click', event => {
  if (event.target === favoritesDialog) favoritesDialog.close();
});

document.getElementById('clearFavorites').addEventListener('click', () => {
  favorites.clear();
  persistFavorites();
  updateFavorites();
  notify('Подборка очищена');
});

document.getElementById('copyFavorites').addEventListener('click', async () => {
  if (!favorites.size) {
    notify('Сначала выберите хотя бы один букет ♡');
    return;
  }
  const list = cards.filter(card => favorites.has(card.dataset.id)).map(card => '• ' + card.dataset.title).join('\n');
  const text = 'Моя цветочная подборка FLOREA:\n' + list + '\n\nhttps://andrey12-sys.github.io/My-repositories1/';
  try {
    await navigator.clipboard.writeText(text);
    notify('Список скопирован!');
  } catch (error) {
    notify('Не удалось скопировать — откройте сайт по HTTPS');
  }
});

const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
filterButtons.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  filterButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
}));

const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
function closeMenu() {
  nav.classList.remove('open');
  menuToggle.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
}
menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.classList.toggle('is-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in-view');
    observer.unobserve(entry.target);
  }), { threshold: .07, rootMargin: '0px 0px -25px 0px' });
  revealElements.forEach(el => observer.observe(el));
} else {
  revealElements.forEach(el => el.classList.add('in-view'));
}

const progress = document.getElementById('progress');
const header = document.getElementById('header');
let rafPending = false;
function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = (max ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0) + '%';
  header.classList.toggle('scrolled', window.scrollY > 15);
  rafPending = false;
}
window.addEventListener('scroll', () => {
  if (!rafPending) { rafPending = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();

document.getElementById('year').textContent = String(new Date().getFullYear());
updateFavorites();