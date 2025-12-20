# Auto Timestamp for Obsidian

A simple Obsidian plugin that inserts a timestamp with a horizontal separator.

## Screenshot

![Auto Timestamp](image.png)

## Features

- **Insert timestamp** - Quickly insert current date and time with a separator
- **Customizable hotkey** - Assign your preferred keyboard shortcut
- **Simple format** - Clean output: `(YYYY-MM-DD HH:MM)` followed by a horizontal rule

## Output Example

```
(2025-12-20 17:30)

---
```

## Installation

### Manual Installation
1. Download the latest release (`main.js`, `manifest.json`)
2. Create a folder `auto-timestamp` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the folder
4. Enable the plugin in Obsidian Settings > Community Plugins

### From Source
```bash
git clone https://github.com/takeshy/obsidian-auto-timestamp
cd obsidian-auto-timestamp
npm install
npm run build
```

Copy `main.js` and `manifest.json` to your vault's plugin folder.

## Usage

### Using the Command
1. Open the command palette (`Ctrl/Cmd + P`)
2. Search for "Auto Timestamp: Insert datetime with separator"
3. Press Enter to insert the timestamp

### Setting a Hotkey
1. Open Obsidian Settings (`Ctrl/Cmd + ,`)
2. Go to "Hotkeys"
3. Search for "Insert datetime"
4. Click the `+` icon and press your desired key combination

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
