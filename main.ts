import {
  Plugin,
  ItemView,
  WorkspaceLeaf,
  Modal,
  TFile,
  Notice,
  App,
  PluginSettingTab,
  Setting
} from 'obsidian';

const VIEW_TYPE_TWEET_MENU = 'tweet-menu-view';

interface WorkLogSettings {
  logFilePath: string;
  template: string;
}

const DEFAULT_SETTINGS: WorkLogSettings = {
  logFilePath: '作業ログ.md',
  template: '{{content}}\n({{datetime}})\n\n---\n'
};

class TweetModal extends Modal {
  onSubmit: (content: string) => void;

  constructor(app: App, onSubmit: (content: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('tweet-modal');

    const textarea = contentEl.createEl('textarea', {
      attr: { placeholder: '今何してる？', rows: '4' }
    });
    textarea.addClass('tweet-textarea');

    const buttonContainer = contentEl.createEl('div', { cls: 'tweet-buttons' });

    buttonContainer.createEl('button', { text: 'キャンセル' })
      .onclick = () => this.close();

    const postBtn = buttonContainer.createEl('button', { text: '投稿', cls: 'mod-cta' });
    postBtn.onclick = () => this.submit(textarea);

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submit(textarea);
      }
    });

    textarea.focus();
  }

  submit(textarea: HTMLTextAreaElement) {
    if (textarea.value.trim()) {
      this.onSubmit(textarea.value);
      this.close();
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

class TweetMenuView extends ItemView {
  plugin: WorkLogPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: WorkLogPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_TWEET_MENU;
  }

  getDisplayText(): string {
    return 'ホーム';
  }

  getIcon(): string {
    return 'home';
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('tweet-menu-container');

    const tweetBtn = container.createEl('button', { cls: 'tweet-button' });
    tweetBtn.createEl('span', { text: '✏️ 作業ログを書く' });
    tweetBtn.onclick = () => this.plugin.openTweetModal();
  }
}

class WorkLogSettingTab extends PluginSettingTab {
  plugin: WorkLogPlugin;

  constructor(app: App, plugin: WorkLogPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '作業ログ設定' });

    new Setting(containerEl)
      .setName('出力ファイル')
      .setDesc('ログを保存するファイルパス')
      .addText(text => text
        .setPlaceholder('作業ログ.md')
        .setValue(this.plugin.settings.logFilePath)
        .onChange(async (value) => {
          this.plugin.settings.logFilePath = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('テンプレート')
      .setDesc('使用可能な変数: {{content}}, {{datetime}}, {{date}}, {{time}}')
      .addTextArea(text => {
        text
          .setPlaceholder(DEFAULT_SETTINGS.template)
          .setValue(this.plugin.settings.template)
          .onChange(async (value) => {
            this.plugin.settings.template = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 6;
        text.inputEl.cols = 40;
      });

    // プレビュー
    const previewContainer = containerEl.createEl('div', { cls: 'template-preview' });
    previewContainer.createEl('h4', { text: 'プレビュー' });
    const previewContent = previewContainer.createEl('pre');

    const updatePreview = () => {
      const preview = this.plugin.processTemplate('サンプルの作業ログです\n複数行もOK');
      previewContent.setText(preview);
    };

    updatePreview();

    // テンプレート変更時にプレビュー更新
    const templateInput = containerEl.querySelector('textarea');
    templateInput?.addEventListener('input', updatePreview);
  }
}

export default class WorkLogPlugin extends Plugin {
  settings!: WorkLogSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_TWEET_MENU, (leaf) => new TweetMenuView(leaf, this));

    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        const emptyLeaves = this.app.workspace.getLeavesOfType('empty');
        emptyLeaves.forEach(leaf => {
          leaf.setViewState({ type: VIEW_TYPE_TWEET_MENU, active: true });
        });
      })
    );

    this.addCommand({
      id: 'open-tweet-modal',
      name: '作業ログを書く',
      callback: () => this.openTweetModal(),
    });

    this.addCommand({
      id: 'open-tweet-menu',
      name: 'ホームを開く',
      callback: () => this.openTweetMenu(),
    });

    this.addRibbonIcon('pencil', '作業ログを書く', () => this.openTweetModal());

    this.addSettingTab(new WorkLogSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  openTweetModal() {
    new TweetModal(this.app, (content) => this.saveLog(content)).open();
  }

  async openTweetMenu() {
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE_TWEET_MENU, active: true });
  }

  processTemplate(content: string): string {
    const now = (window as unknown as { moment: () => { format: (f: string) => string } }).moment();
    return this.settings.template
      .replace(/\{\{content\}\}/g, content)
      .replace(/\{\{datetime\}\}/g, now.format('YYYY-MM-DD HH:mm'))
      .replace(/\{\{date\}\}/g, now.format('YYYY-MM-DD'))
      .replace(/\{\{time\}\}/g, now.format('HH:mm'));
  }

  async saveLog(content: string) {
    const logEntry = this.processTemplate(content);
    const filePath = this.settings.logFilePath;

    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (file instanceof TFile) {
      const currentContent = await this.app.vault.read(file);
      await this.app.vault.modify(file, currentContent + logEntry);
    } else {
      // フォルダが必要なら作成
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
        await this.app.vault.createFolder(dir);
      }
      await this.app.vault.create(filePath, `# 作業ログ\n\n${logEntry}`);
    }

    new Notice('保存しました');
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TWEET_MENU);
  }
}
