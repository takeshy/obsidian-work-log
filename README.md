# Work Log for Obsidian

A simple Obsidian plugin to quickly write and save work logs with timestamps.

## Features

- **Quick Entry Modal** - Press a hotkey or click the ribbon icon to open a modal for quick log entries
- **Home View** - A dedicated view with a button to create new log entries
- **Customizable Templates** - Configure the output format using template variables
- **Auto File Creation** - Automatically creates the log file and folders if they don't exist

## Template Variables

- `{{content}}` - Your log entry text
- `{{datetime}}` - Full date and time (YYYY-MM-DD HH:mm)
- `{{date}}` - Date only (YYYY-MM-DD)
- `{{time}}` - Time only (HH:mm)

## Default Template

```
{{content}}
({{datetime}})

---
```

## Output Example

```
Fixed the login bug
(2025-12-20 17:30)

---
```

## Installation

### Manual Installation
1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder `work-log` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the folder
4. Enable the plugin in Obsidian Settings > Community Plugins

### From Source
```bash
git clone https://github.com/takeshy/obsidian-auto-timestamp
cd obsidian-auto-timestamp
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder.

## Usage

### Using the Command
1. Open the command palette (`Ctrl/Cmd + P`)
2. Search for "Work Log: 作業ログを書く"
3. Enter your log and press Enter or click "投稿"

### Using the Ribbon Icon
Click the pencil icon in the left ribbon to open the log entry modal.

### Using the Home View
1. Open the command palette (`Ctrl/Cmd + P`)
2. Search for "Work Log: ホームを開く"
3. Click the "作業ログを書く" button

## Settings

- **出力ファイル** - The file path where logs are saved (default: `作業ログ.md`)
- **テンプレート** - Customize the log entry format using template variables

## Development

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

## Requirements

- Obsidian v1.0.0 or higher
- Works on both desktop and mobile

## License

MIT
