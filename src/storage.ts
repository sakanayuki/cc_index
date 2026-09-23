// 端末ごとの記録（localStorage）。読み書きに失敗しても表示は続けられるようにする。

export type SortKey = 'old' | 'new' | 'aiueo' | 'often' | 'recent';
export const SORT_KEYS: SortKey[] = ['old', 'new', 'aiueo', 'often', 'recent'];

export interface PlayRecord {
  count: number;
  last: number;
}

interface State {
  sort: SortKey;
  plays: Record<string, PlayRecord>;
  /** これまでに見たことのあるゲーム ID。未登録なら初回訪問。 */
  seen?: string[];
}

const KEY = 'asobiba:v1';

function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      return {
        sort: SORT_KEYS.includes(raw.sort) ? raw.sort : 'old',
        plays: raw.plays && typeof raw.plays === 'object' ? raw.plays : {},
        seen: Array.isArray(raw.seen) ? raw.seen : undefined,
      };
    }
  } catch {
    /* 読めなければ初期状態 */
  }
  return { sort: 'old', plays: {} };
}

const state = load();

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* プライベートモード等では保存しない */
  }
}

export const getSort = (): SortKey => state.sort;
export const getPlays = (): Readonly<Record<string, PlayRecord>> => state.plays;

export function setSort(sort: SortKey): void {
  state.sort = sort;
  save();
}

export function recordPlay(id: string): void {
  const rec = state.plays[id] ?? { count: 0, last: 0 };
  state.plays[id] = { count: rec.count + 1, last: Date.now() };
  save();
}

/**
 * 前回の訪問以降に追加されたゲーム ID を返し、全ゲームを既読にする。
 * 初めての訪問では全部が新作扱いにならないよう空を返す。
 */
export function takeNewGameIds(allIds: string[]): string[] {
  const seen = state.seen;
  state.seen = allIds;
  save();
  if (!seen) return [];
  const known = new Set(seen);
  return allIds.filter((id) => !known.has(id));
}
