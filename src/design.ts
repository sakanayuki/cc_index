// カードに割り当てる色と形状の定義。ビルド時（vite.config.ts）と実行時の両方から参照する。

/** カード色のシード。M3 のダイナミックカラーでライト/ダーク両方のトーンを生成する。 */
export const CARD_COLORS = {
  red: '#E53935',
  orange: '#FB8C00',
  yellow: '#FDD835',
  green: '#43A047',
  teal: '#00ACC1',
  blue: '#1E88E5',
  purple: '#8E24AA',
  pink: '#EC407A',
} as const;

/**
 * M3 Expressive の形状ライブラリを極座標 r(θ) = 1 + a·cos(nθ) で近似したもの。
 * n: 山の数 / a: 山の深さ。a を 0 に近づけると円にモーフィングする。
 */
export const SHAPES = {
  cookie4: { n: 4, a: 0.09 },
  sunny: { n: 16, a: 0.028 },
  flower: { n: 8, a: 0.1 },
  pentagon: { n: 5, a: 0.07 },
  cookie9: { n: 9, a: 0.05 },
  clover: { n: 4, a: 0.17 },
  cookie6: { n: 6, a: 0.075 },
  cookie12: { n: 12, a: 0.036 },
} as const;

export type CardColor = keyof typeof CARD_COLORS;
export type ShapeName = keyof typeof SHAPES;

export const COLOR_NAMES = Object.keys(CARD_COLORS) as CardColor[];
export const SHAPE_NAMES = Object.keys(SHAPES) as ShapeName[];

export interface Game {
  id: string;
  name: string;
  emoji: string;
  url: string;
  color?: CardColor;
  shape?: ShapeName;
}

export const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
/** ひらがな・カタカナ・長音・空白・！？のみ */
export const NAME_PATTERN = /^[ぁ-ゟ゠-ヿ　 ！？!?]+$/u;

/** games.json の内容を検証し、問題点のリストを返す（空なら正常）。 */
export function validateGames(games: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(games) || games.length === 0) return ['games は1件以上の配列である必要があります'];
  const ids = new Set<string>();
  games.forEach((g: Partial<Game>, i) => {
    const at = `games[${i}]${g?.id ? ` (${g.id})` : ''}`;
    if (typeof g?.id !== 'string' || !ID_PATTERN.test(g.id)) errors.push(`${at}: id は英小文字・数字・ハイフンで指定してください`);
    else if (ids.has(g.id)) errors.push(`${at}: id が重複しています`);
    else ids.add(g.id);
    if (typeof g?.name !== 'string' || !NAME_PATTERN.test(g.name)) errors.push(`${at}: name はひらがな/カタカナで指定してください`);
    if (typeof g?.emoji !== 'string' || g.emoji.length === 0) errors.push(`${at}: emoji が必要です`);
    if (typeof g?.url !== 'string' || !/^https:\/\//.test(g.url)) errors.push(`${at}: url は https:// で始まる必要があります`);
    if (g?.color !== undefined && !(g.color in CARD_COLORS)) errors.push(`${at}: color は ${COLOR_NAMES.join(' / ')} のいずれか`);
    if (g?.shape !== undefined && !(g.shape in SHAPES)) errors.push(`${at}: shape は ${SHAPE_NAMES.join(' / ')} のいずれか`);
  });
  return errors;
}
