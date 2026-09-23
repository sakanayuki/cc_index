import './styles/theme.gen.css';
import './styles/main.css';
import data from './games.json';
import strings from './strings.json';
import { COLOR_NAMES, SHAPE_NAMES, type Game, type ShapeName } from './design';
import { shapePath } from './shapes';
import { Spring } from './spring';
import { SORT_KEYS, getPlays, getSort, recordPlay, setSort, takeNewGameIds, type SortKey } from './storage';

type TextKey = keyof typeof strings.text;

interface Entry extends Game {
  /** games.json 上の位置（= 古い順） */
  order: number;
  color: NonNullable<Game['color']>;
  shape: ShapeName;
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// 色と形は games.json の位置で自動割当（指定があればそちらを優先）。
// 形は色と周期をずらし、同じ組み合わせが続かないようにする。
const entries: Entry[] = (data.games as Game[]).map((g, i) => ({
  ...g,
  order: i,
  color: g.color ?? COLOR_NAMES[i % COLOR_NAMES.length],
  shape: g.shape ?? SHAPE_NAMES[(i * 3) % SHAPE_NAMES.length],
}));

const newIds = new Set(takeNewGameIds(entries.map((e) => e.id)));

const SORT_TEXT: Record<SortKey, 'sortOld' | 'sortNew' | 'sortAiueo' | 'sortOften' | 'sortRecent'> = {
  old: 'sortOld',
  new: 'sortNew',
  aiueo: 'sortAiueo',
  often: 'sortOften',
  recent: 'sortRecent',
};

const collator = new Intl.Collator('ja');

function sorted(sort: SortKey): Entry[] {
  const plays = getPlays();
  const byOrder = (a: Entry, b: Entry) => a.order - b.order;
  // 遊んだことがないゲームは古い順で後ろに並べる
  const byPlays = (key: 'count' | 'last') => (a: Entry, b: Entry) =>
    (plays[b.id]?.[key] ?? 0) - (plays[a.id]?.[key] ?? 0) || byOrder(a, b);
  const compare = {
    old: byOrder,
    new: (a: Entry, b: Entry) => b.order - a.order,
    aiueo: (a: Entry, b: Entry) => collator.compare(a.name, b.name) || byOrder(a, b),
    often: byPlays('count'),
    recent: byPlays('last'),
  }[sort];
  const list = [...entries].sort(compare);
  // 新作は並び順に関係なく先頭へ
  return [...list.filter((e) => newIds.has(e.id)), ...list.filter((e) => !newIds.has(e.id))];
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function shapeSvg(shape: ShapeName, className: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add(className);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', shapePath(shape));
  svg.append(path);
  return svg;
}

/** 押すと形が丸くしぼみ、離すとバネで元の形に戻る */
function attachPressMorph(card: HTMLElement, shape: ShapeName, path: SVGPathElement) {
  const spring = new Spring(1, (v) => {
    path.setAttribute('d', shapePath(shape, v));
    card.style.setProperty('--press', String(1 - v));
  });
  const press = () => !reducedMotion.matches && spring.to(0, 1400, 0.9);
  const release = () => spring.to(1, 800, 0.45);
  card.addEventListener('pointerdown', press);
  for (const type of ['pointerup', 'pointerleave', 'pointercancel'] as const) card.addEventListener(type, release);
  // bfcache から戻ってきたときに押下状態を戻す
  addEventListener('pageshow', () => spring.to(1, 800, 0.45));
}

function createCard(entry: Entry): HTMLLIElement {
  const item = el('li', 'grid__item');
  item.style.viewTransitionName = `game-${entry.id}`;

  const card = el('a', `card c-${entry.color}`);
  card.href = entry.url;
  card.addEventListener('click', () => recordPlay(entry.id));

  const art = el('span', 'card__art');
  const svg = shapeSvg(entry.shape, 'card__shape');
  art.append(svg, el('span', 'card__emoji emoji', entry.emoji));
  card.append(art, el('span', 'card__name', entry.name));

  if (newIds.has(entry.id)) {
    card.classList.add('card--new');
    card.append(el('span', 'card__badge', strings.text.newBadge));
  }

  attachPressMorph(card, entry.shape, svg.querySelector('path')!);
  item.append(card);
  return item;
}

const grid = document.getElementById('games')!;
const cards = new Map(entries.map((e) => [e.id, createCard(e)]));

function renderGrid(sort: SortKey) {
  // 要素を作り直さず並べ替えるだけにして、押下中のアニメーション等を保つ
  grid.replaceChildren(...sorted(sort).map((e) => cards.get(e.id)!));
}

function renderSortChips() {
  const container = document.getElementById('sort-chips')!;
  const chips = SORT_KEYS.map((key) => {
    const chip = el('button', 'chip');
    chip.type = 'button';
    chip.setAttribute('role', 'radio');
    chip.dataset.sort = key;
    chip.append(el('span', 'chip__icon emoji', strings.emoji[SORT_TEXT[key]]), el('span', 'chip__label', strings.text[SORT_TEXT[key]]));
    chip.addEventListener('click', () => select(key));
    return chip;
  });

  const update = (current: SortKey) => {
    for (const chip of chips) {
      const selected = chip.dataset.sort === current;
      chip.setAttribute('aria-checked', String(selected));
      chip.tabIndex = selected ? 0 : -1;
    }
  };

  const select = (key: SortKey) => {
    if (key === getSort()) return;
    setSort(key);
    update(key);
    const apply = () => renderGrid(key);
    if (document.startViewTransition && !reducedMotion.matches) document.startViewTransition(apply);
    else apply();
  };

  // ラジオグループとして矢印キーでも選べるようにする
  container.addEventListener('keydown', (ev) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (!delta) return;
    ev.preventDefault();
    const index = (SORT_KEYS.indexOf(getSort()) + delta + SORT_KEYS.length) % SORT_KEYS.length;
    select(SORT_KEYS[index]);
    chips[index].focus();
  });

  container.replaceChildren(...chips);
  update(getSort());
}

function renderBanner() {
  if (newIds.size === 0) return;
  const banner = document.getElementById('new-banner')!;
  const title = el('p', 'banner__title');
  title.append(el('span', 'emoji', strings.emoji.banner), ` ${strings.text.bannerTitle}`);
  const names = el('ul', 'banner__names');
  for (const e of entries.filter((e) => newIds.has(e.id))) {
    const name = el('li', `banner__name c-${e.color}`);
    name.append(el('span', 'emoji', e.emoji), ` ${e.name}`);
    names.append(name);
  }
  const close = el('button', 'banner__close');
  close.type = 'button';
  close.setAttribute('aria-label', strings.text.bannerClose);
  close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 19 5 17.6 10.6 12 5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z"/></svg>';
  close.addEventListener('click', () => {
    banner.classList.add('banner--leaving');
    banner.addEventListener('animationend', () => (banner.hidden = true), { once: true });
    if (reducedMotion.matches) banner.hidden = true;
  });
  banner.append(shapeSvg('sunny', 'banner__deco'), title, names, close);
  banner.hidden = false;
}

for (const node of document.querySelectorAll<HTMLElement>('[data-text]')) {
  node.textContent = strings.text[node.dataset.text as TextKey];
}
for (const path of document.querySelectorAll<SVGPathElement>('path[data-shape]')) {
  path.setAttribute('d', shapePath(path.dataset.shape as ShapeName));
}

renderBanner();
renderSortChips();
renderGrid(getSort());
