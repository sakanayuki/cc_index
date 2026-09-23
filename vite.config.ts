import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { validateGames, type Game } from './src/design.ts';

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const readJson = (p: string) => JSON.parse(readFileSync(resolve(p), 'utf8'));

type Theme = ReturnType<typeof import('./scripts/theme.ts').generateTheme>;

/**
 * scripts/theme.ts を実行して配色を生成する。
 * material-color-utilities は Node から直接 import できない（拡張子なしの import を含む）ため、
 * rolldown で1ファイルにまとめてから読み込む。
 */
async function loadTheme(): Promise<Theme> {
  const { build } = await import('rolldown');
  const { output } = await build({ input: resolve('scripts/theme.ts'), platform: 'node', write: false, output: { format: 'esm' } });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`);
  return mod.generateTheme();
}

/**
 * - games.json を検証（不正ならビルド失敗）
 * - M3 カラートークンの CSS を生成
 * - 使用文字だけに絞った Google Fonts（M PLUS Rounded 1c / Noto Color Emoji）の読込タグを注入
 */
function asobiba(): Plugin {
  let theme: Theme;
  return {
    name: 'asobiba',
    async buildStart() {
      const { games } = readJson('src/games.json') as { games: Game[] };
      const errors = validateGames(games);
      if (errors.length) this.error(`games.json に問題があります:\n  ${errors.join('\n  ')}`);
      theme = await loadTheme();
      writeFileSync(resolve('src/styles/theme.gen.css'), theme.css);
      this.addWatchFile(resolve('src/games.json'));
      this.addWatchFile(resolve('src/strings.json'));
    },
    transformIndexHtml() {
      const { games } = readJson('src/games.json') as { games: Game[] };
      const strings = readJson('src/strings.json') as { text: Record<string, string>; emoji: Record<string, string> };
      const uniq = (s: string) => [...new Set(s)].join('');
      const text = uniq(
        'あいうえおABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?！？、。 ' +
          Object.values(strings.text).join('') +
          games.map((g) => g.name).join(''),
      );
      const emoji = uniq(Object.values(strings.emoji).join('') + games.map((g) => g.emoji).join(''));
      const font = (family: string, chars: string) =>
        `https://fonts.googleapis.com/css2?family=${family}&display=swap&text=${encodeURIComponent(chars)}`;
      return [
        { tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: light)', content: theme.lightSurface }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: theme.darkSurface }, injectTo: 'head' },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' }, injectTo: 'head' },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }, injectTo: 'head' },
        { tag: 'link', attrs: { rel: 'stylesheet', href: font('M+PLUS+Rounded+1c:wght@500;700;800', text) }, injectTo: 'head' },
        { tag: 'link', attrs: { rel: 'stylesheet', href: font('Noto+Color+Emoji', emoji) }, injectTo: 'head' },
      ];
    },
  };
}

export default defineConfig({
  // https://sakanayuki.github.io/cc_index/ で公開
  base: '/cc_index/',
  plugins: [asobiba()],
});
