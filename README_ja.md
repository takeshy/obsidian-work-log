# Auto Timestamp for Obsidian

タイムスタンプと水平線を挿入するシンプルな Obsidian プラグインです。

## スクリーンショット

![Auto Timestamp](image.png)

## 機能

- **タイムスタンプ挿入** - 現在の日時を素早く挿入
- **ホットキー設定可能** - お好みのキーボードショートカットを割り当て可能
- **シンプルな形式** - `(YYYY-MM-DD HH:MM)` の後に水平線を出力

## 出力例

```
(2025-12-20 17:30)

---
```

## インストール

### 手動インストール
1. 最新リリース（`main.js`、`manifest.json`）をダウンロード
2. Vault の `.obsidian/plugins/` ディレクトリに `auto-timestamp` フォルダを作成
3. ダウンロードしたファイルをコピー
4. Obsidian 設定 > コミュニティプラグイン でプラグインを有効化

### ソースからビルド
```bash
git clone https://github.com/takeshy/obsidian-auto-timestamp
cd obsidian-auto-timestamp
npm install
npm run build
```

`main.js` と `manifest.json` を Vault のプラグインフォルダにコピーしてください。

## 使い方

### コマンドを使用
1. コマンドパレットを開く（`Ctrl/Cmd + P`）
2. "Auto Timestamp: Insert datetime with separator" を検索
3. Enter を押してタイムスタンプを挿入

### ホットキーを設定
1. Obsidian 設定を開く（`Ctrl/Cmd + ,`）
2. 「ホットキー」に移動
3. "Insert datetime" で検索
4. `+` アイコンをクリックして、お好みのキーの組み合わせを押す

## 開発

```bash
# 依存パッケージのインストール
npm install

# 開発ビルド（ウォッチモード）
npm run dev

# プロダクションビルド
npm run build

# リント
npm run lint
```

## 動作要件

- Obsidian v1.0.0 以上
- デスクトップ版・モバイル版両対応

## ライセンス

MIT
