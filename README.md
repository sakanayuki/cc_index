# あそびば

こども向けのゲームをまとめたリンク集です。Material 3 Expressive のデザインで作っています。

公開URL: https://sakanayuki.github.io/cc_index/

## ゲームの追加方法

`src/games.json` の `games` 配列の**末尾**に1行追加して、`main` に push するだけです。
配列の順番が「ふるいじゅん」の並びになり、新しく追加したゲームは次に訪れたときに
「あたらしい ゲームが きたよ！」のお知らせと New!! バッジで先頭に表示されます（その訪問の間だけ）。

```json
{ "id": "newgame", "name": "あたらしいゲーム", "emoji": "🎮", "url": "https://sakanayuki.github.io/cc_newgame/" }
```

| 項目 | 必須 | 説明 |
| --- | --- | --- |
| `id` | ○ | 英小文字・数字・ハイフン。一度決めたら変えない（遊んだ記録や新作判定に使う） |
| `name` | ○ | ひらがな / カタカナのみ |
| `emoji` | ○ | カードに表示する絵文字 |
| `url` | ○ | `https://` で始まるゲームのURL |
| `color` | | `red` `orange` `yellow` `green` `teal` `blue` `purple` `pink`（省略時は自動） |
| `shape` | | `cookie4` `sunny` `flower` `pentagon` `cookie9` `clover` `cookie6` `cookie12`（省略時は自動） |

記入ミスがあるとビルドが失敗し、GitHub Actions のログに原因が表示されます。

## 開発

```sh
npm ci
npm run dev      # 開発サーバー
npm run build    # dist/ に出力
npm run preview  # ビルド結果の確認（/cc_index/ 配下）
```

## デプロイ

`main` への push（または Actions 画面からの手動実行）で `.github/workflows/deploy.yml` が
ビルドし、GitHub Pages に公開します。初回のみリポジトリの
**Settings → Pages → Build and deployment → Source** を **GitHub Actions** にしてください。

## しくみ

- **配色**: `scripts/theme.ts` がシードカラー（#FFA000）と各カード色から M3 のカラートークン
  （2025 仕様 / Vibrant）をビルド時に生成します。ライト / ダークは端末設定に追従します。
- **形状**: M3 Expressive の形状（クッキー・花・サンバースト等）を `src/shapes.ts` で描画します。
  カードを押すと形が丸くしぼみ、離すとバネのように戻ります。
- **フォント**: M PLUS Rounded 1c と Noto Color Emoji を、実際に使う文字だけに絞って Google Fonts から読み込みます。
- **記録**: 並び順・遊んだ回数/日時・既読ゲームは端末の localStorage に保存します（サーバーには送信しません）。
