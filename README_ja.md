# Work Log for Obsidian

タイムスタンプ付きの作業ログを素早く記録するシンプルな Obsidian プラグインです。

## 機能

- **クイック入力モーダル** - ホットキーまたはリボンアイコンで素早くログを入力
- **新規タブビュー** - 新規タブにログ作成ボタンを表示
- **カスタマイズ可能なテンプレート** - テンプレート変数で出力形式を設定
- **画像添付** - ペースト、ドラッグ&ドロップ、ファイル選択で画像を追加
- **スラッシュコマンド** - /コマンドで定型文を素早く入力
- **自動ファイル作成** - ログファイルとフォルダを自動作成

## テンプレート変数

- `{content}` - ログ入力テキスト
- `{datetime}` - 日時 (YYYY-MM-DD HH:mm)
- `{date}` - 日付のみ (YYYY-MM-DD)
- `{time}` - 時刻のみ (HH:mm)

## デフォルトテンプレート

```
{content}
({datetime})

---
```

## 出力例

![Result](result.png)

## インストール

### 手動インストール
1. 最新リリース（`main.js`、`manifest.json`、`styles.css`）をダウンロード
2. Vault の `.obsidian/plugins/` ディレクトリに `work-log` フォルダを作成
3. ダウンロードしたファイルをコピー
4. Obsidian 設定 > コミュニティプラグイン でプラグインを有効化

### ソースからビルド
```bash
git clone https://github.com/takeshy/obsidian-work-log
cd obsidian-work-log
npm install
npm run build
```

`main.js`、`manifest.json`、`styles.css` を Vault のプラグインフォルダにコピーしてください。

## 使い方

### コマンドを使用
1. コマンドパレットを開く（`Ctrl/Cmd + P`）
2. "Work Log: 作業ログを書く" を検索
3. ログを入力して Enter または「投稿」をクリック

![Input Modal](tweet.png)

### リボンアイコンを使用
左リボンの鉛筆アイコンをクリックしてログ入力モーダルを開きます。

### 新規タブビュー
新規タブを開くと、作業ログの作成・表示ボタンが表示されます。

![New Tab](new_tab.png)

## 設定

![Settings](settings.png)

- **出力ファイル** - ログを保存するファイルパス（デフォルト: `work-log.md`）
- **テンプレート** - テンプレート変数を使用してログ形式をカスタマイズ
- **画像保存フォルダ** - 添付画像を保存するフォルダパス
- **送信キー** - ログを送信するキー（Enter、Shift+Enter、Ctrl+Enter、Alt+Enter）
- **改行キー** - 改行を挿入するキー
- **スラッシュコマンド** - /コマンドで入力できる定型文を定義

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
