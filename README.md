# 生成AI・AIエージェント完全入門 — Web教材

仕組みから実践まで学べるオンライン教材。本文（全13章＋付録）はインタラクティブ要素つき。
別途、WebGLによる「AIの内部処理 3D体験」を `/experience/` に収録。

## 構成
- Next.js（App Router）で配信。教材本体は静的HTML/CSS/JSとして `public/` に格納。
- `/` … 教材トップ（`public/index.html` へリダイレクト）
- `/chNN.html` … 各章
- `/experience/index.html` … 3D体験（Three.js + GSAP、ローカル同梱）

## 開発
```bash
npm install
npm run dev      # http://localhost:3000
```

## 本番（Railway 等）
```bash
npm install
npm run build
npm start        # PORT 環境変数を使用
```
Railway は Next.js を自動検出し `next build` → `next start` で起動します。

## 体験型機能（すべてオフライン動作）
- クイズのクリック即判定・採点
- ミニ体験ウィジェット（トークナイザー / Temperature / AI⇄人間 仕分け）
- 学習進捗・達成バッジ（localStorage）
