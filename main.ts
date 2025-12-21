import {
  Plugin,
  WorkspaceLeaf,
  Modal,
  TFile,
  Notice,
  App,
  PluginSettingTab,
  Setting
} from 'obsidian';

// i18n
type TranslationKey =
  | 'writeWorkLog'
  | 'openWorkLog'
  | 'placeholder'
  | 'addImage'
  | 'cancel'
  | 'post'
  | 'saved'
  | 'imageSaveFailed'
  | 'settingsTitle'
  | 'outputFile'
  | 'outputFileDesc'
  | 'template'
  | 'templateDesc'
  | 'imageFolder'
  | 'imageFolderDesc'
  | 'submitKey'
  | 'submitKeyDesc'
  | 'newlineKey'
  | 'newlineKeyDesc'
  | 'preview'
  | 'sampleContent'
  | 'slashCommands'
  | 'slashCommandsDesc'
  | 'commandName'
  | 'commandText'
  | 'addCommand'
  | 'deleteCommand';

type KeyOption = 'Enter' | 'Shift+Enter' | 'Ctrl+Enter' | 'Alt+Enter';

interface SlashCommand {
  id: string;
  name: string;
  text: string;
}

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    writeWorkLog: 'Write Work Log',
    openWorkLog: 'Open Work Log',
    placeholder: "What's happening?",
    addImage: 'Add Image',
    cancel: 'Cancel',
    post: 'Post',
    saved: 'Saved',
    imageSaveFailed: 'Failed to save image',
    settingsTitle: 'Work Log Settings',
    outputFile: 'Output File',
    outputFileDesc: 'File path to save logs',
    template: 'Template',
    templateDesc: 'Available variables: {content}, {datetime}, {date}, {time}',
    imageFolder: 'Image Folder',
    imageFolderDesc: 'Folder path to save attached images',
    submitKey: 'Submit key',
    submitKeyDesc: 'Key to submit the log',
    newlineKey: 'Newline key',
    newlineKeyDesc: 'Key to insert a new line',
    preview: 'Preview',
    sampleContent: 'Sample work log\nMultiple lines OK',
    slashCommands: 'Slash commands',
    slashCommandsDesc: 'Define text templates that can be inserted by typing /command',
    commandName: 'Command name',
    commandText: 'Text to insert',
    addCommand: 'Add command',
    deleteCommand: 'Delete',
  },
  ja: {
    writeWorkLog: '作業ログを書く',
    openWorkLog: '作業ログを開く',
    placeholder: '今何してる？',
    addImage: '画像を追加',
    cancel: 'キャンセル',
    post: '投稿',
    saved: '保存しました',
    imageSaveFailed: '画像の保存に失敗しました',
    settingsTitle: '作業ログ設定',
    outputFile: '出力ファイル',
    outputFileDesc: 'ログを保存するファイルパス',
    template: 'テンプレート',
    templateDesc: '使用可能な変数: {content}, {datetime}, {date}, {time}',
    imageFolder: '画像保存フォルダ',
    imageFolderDesc: '添付画像を保存するフォルダパス',
    submitKey: '送信キー',
    submitKeyDesc: 'ログを送信するキー',
    newlineKey: '改行キー',
    newlineKeyDesc: '改行を挿入するキー',
    preview: 'プレビュー',
    sampleContent: 'サンプルの作業ログです\n複数行もOK',
    slashCommands: 'スラッシュコマンド',
    slashCommandsDesc: '/コマンドで定型文を入力できます',
    commandName: 'コマンド名',
    commandText: '挿入するテキスト',
    addCommand: 'コマンドを追加',
    deleteCommand: '削除',
  },
};

function getLocale(): string {
  const lang = document.documentElement.lang || navigator.language || 'en';
  return lang.startsWith('ja') ? 'ja' : 'en';
}

function t(key: TranslationKey): string {
  const locale = getLocale();
  return translations[locale]?.[key] || translations['en'][key];
}

interface WorkLogSettings {
  logFilePath: string;
  template: string;
  imageFolder: string;
  submitKey: KeyOption;
  newlineKey: KeyOption;
  slashCommands: SlashCommand[];
}

const DEFAULT_SETTINGS: WorkLogSettings = {
  logFilePath: 'work-log.md',
  template: '{content}\n({datetime})\n\n---\n',
  imageFolder: 'attachments',
  submitKey: 'Enter',
  newlineKey: 'Shift+Enter',
  slashCommands: []
};

const KEY_OPTIONS: KeyOption[] = ['Enter', 'Shift+Enter', 'Ctrl+Enter', 'Alt+Enter'];

class TweetModal extends Modal {
  plugin: WorkLogPlugin;
  onSubmit: (content: string) => void;
  textarea!: HTMLTextAreaElement;
  imagePreviewContainer!: HTMLElement;
  pendingImages: { file: File; preview: string }[] = [];
  autocompleteContainer!: HTMLElement;
  filteredCommands: SlashCommand[] = [];
  autocompleteIndex = 0;

  constructor(app: App, plugin: WorkLogPlugin, onSubmit: (content: string) => void) {
    super(app);
    this.plugin = plugin;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.addClass('tweet-modal');

    // モーダルサイズを直接設定
    modalEl.style.width = '600px';
    modalEl.style.maxWidth = '90vw';

    // オートコンプリートコンテナ
    this.autocompleteContainer = contentEl.createEl('div', { cls: 'slash-autocomplete' });
    this.autocompleteContainer.style.display = 'none';

    // テキストエリア（自動リサイズ）
    this.textarea = contentEl.createEl('textarea', {
      attr: { placeholder: t('placeholder'), rows: '3' }
    });
    this.textarea.addClass('tweet-textarea');
    this.textarea.addEventListener('input', () => {
      this.autoResize();
      this.handleInputChange();
    });

    // 画像プレビューエリア
    this.imagePreviewContainer = contentEl.createEl('div', { cls: 'image-preview-container' });

    // 隠しファイル入力
    const fileInput = contentEl.createEl('input', {
      attr: { type: 'file', accept: 'image/*', multiple: 'true' }
    });
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => this.handleFileSelect(e);

    // ツールバー（画像ボタン + アクションボタン）
    const toolbar = contentEl.createEl('div', { cls: 'tweet-toolbar' });

    // 画像追加ボタン
    const imageBtn = toolbar.createEl('button', { cls: 'tweet-image-btn' });
    imageBtn.innerHTML = `🖼️ ${t('addImage')}`;
    imageBtn.onclick = () => this.selectImage();

    // スペーサー
    toolbar.createEl('div', { cls: 'tweet-toolbar-spacer' });

    // キャンセルボタン
    const cancelBtn = toolbar.createEl('button', { text: t('cancel'), cls: 'tweet-cancel-btn' });
    cancelBtn.onclick = () => this.close();

    // 投稿ボタン
    const postBtn = toolbar.createEl('button', { text: t('post'), cls: 'mod-cta' });
    postBtn.onclick = () => this.submit();

    // ペースト対応
    this.textarea.addEventListener('paste', (e) => this.handlePaste(e));

    // キーボード対応
    this.textarea.addEventListener('keydown', (e) => this.handleKeydown(e));

    // ドラッグ&ドロップ対応
    contentEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      contentEl.addClass('drag-over');
    });
    contentEl.addEventListener('dragleave', () => {
      contentEl.removeClass('drag-over');
    });
    contentEl.addEventListener('drop', (e) => this.handleDrop(e));

    this.textarea.focus();
  }

  autoResize() {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  handleInputChange() {
    const value = this.textarea.value;
    const commands = this.plugin.settings.slashCommands;

    if (value.startsWith('/') && commands.length > 0) {
      const query = value.slice(1).toLowerCase();
      this.filteredCommands = commands.filter(cmd =>
        cmd.name.toLowerCase().startsWith(query)
      );
      if (this.filteredCommands.length > 0) {
        this.showAutocomplete();
      } else {
        this.hideAutocomplete();
      }
    } else {
      this.hideAutocomplete();
    }
  }

  showAutocomplete() {
    this.autocompleteContainer.empty();
    this.autocompleteIndex = 0;

    this.filteredCommands.forEach((cmd, index) => {
      const item = this.autocompleteContainer.createEl('div', {
        cls: `slash-autocomplete-item ${index === this.autocompleteIndex ? 'active' : ''}`
      });
      item.createEl('span', { cls: 'slash-autocomplete-name', text: `/${cmd.name}` });
      item.createEl('span', { cls: 'slash-autocomplete-text', text: cmd.text.substring(0, 50) + (cmd.text.length > 50 ? '...' : '') });

      item.onclick = () => this.selectCommand(index);
      item.onmouseenter = () => {
        this.autocompleteIndex = index;
        this.updateAutocompleteSelection();
      };
    });

    this.autocompleteContainer.style.display = 'block';
  }

  hideAutocomplete() {
    this.autocompleteContainer.style.display = 'none';
    this.filteredCommands = [];
  }

  updateAutocompleteSelection() {
    const items = this.autocompleteContainer.querySelectorAll('.slash-autocomplete-item');
    items.forEach((item, index) => {
      item.toggleClass('active', index === this.autocompleteIndex);
    });
  }

  selectCommand(index: number) {
    const cmd = this.filteredCommands[index];
    if (cmd) {
      this.textarea.value = cmd.text;
      this.hideAutocomplete();
      this.autoResize();
      this.textarea.focus();
    }
  }

  matchesKey(e: KeyboardEvent, key: KeyOption): boolean {
    if (e.key !== 'Enter') return false;
    switch (key) {
      case 'Enter':
        return !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey;
      case 'Shift+Enter':
        return e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey;
      case 'Ctrl+Enter':
        return (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey;
      case 'Alt+Enter':
        return e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey;
      default:
        return false;
    }
  }

  handleKeydown(e: KeyboardEvent) {
    // オートコンプリートが表示中
    if (this.filteredCommands.length > 0 && this.autocompleteContainer.style.display !== 'none') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.autocompleteIndex = Math.min(this.autocompleteIndex + 1, this.filteredCommands.length - 1);
        this.updateAutocompleteSelection();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.autocompleteIndex = Math.max(this.autocompleteIndex - 1, 0);
        this.updateAutocompleteSelection();
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        this.selectCommand(this.autocompleteIndex);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hideAutocomplete();
        return;
      }
    }

    if (this.matchesKey(e, this.plugin.settings.submitKey)) {
      e.preventDefault();
      this.submit();
    }
  }

  selectImage() {
    const fileInput = this.contentEl.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  async handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    for (const file of Array.from(input.files)) {
      if (file.type.startsWith('image/')) {
        await this.addImage(file);
      }
    }
    input.value = '';
  }

  async handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await this.addImage(file);
        }
      }
    }
  }

  async handleDrop(e: DragEvent) {
    e.preventDefault();
    this.contentEl.removeClass('drag-over');

    const files = e.dataTransfer?.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await this.addImage(file);
      }
    }
  }

  async addImage(file: File) {
    const preview = URL.createObjectURL(file);
    this.pendingImages.push({ file, preview });
    this.updateImagePreviews();
  }

  updateImagePreviews() {
    this.imagePreviewContainer.empty();

    this.pendingImages.forEach((img, index) => {
      const wrapper = this.imagePreviewContainer.createEl('div', { cls: 'image-preview-item' });

      const imgEl = wrapper.createEl('img', { attr: { src: img.preview } });
      imgEl.addClass('image-preview-thumb');

      const removeBtn = wrapper.createEl('button', { cls: 'image-remove-btn', text: '×' });
      removeBtn.onclick = () => {
        URL.revokeObjectURL(img.preview);
        this.pendingImages.splice(index, 1);
        this.updateImagePreviews();
      };
    });
  }

  async submit() {
    const text = this.textarea.value.trim();
    if (!text && this.pendingImages.length === 0) return;

    // 画像を保存してマークダウンリンクを生成
    const imageLinks: string[] = [];
    for (const img of this.pendingImages) {
      const link = await this.plugin.saveImage(img.file);
      if (link) {
        imageLinks.push(link);
      }
      URL.revokeObjectURL(img.preview);
    }

    // コンテンツを組み立て
    let content = text;
    if (imageLinks.length > 0) {
      content += '\n' + imageLinks.join('\n');
    }

    this.onSubmit(content);
    this.close();
  }

  onClose() {
    // プレビューURLを解放
    this.pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
    this.pendingImages = [];
    this.contentEl.empty();
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

    containerEl.createEl('h2', { text: t('settingsTitle') });

    new Setting(containerEl)
      .setName(t('outputFile'))
      .setDesc(t('outputFileDesc'))
      .addText(text => text
        .setPlaceholder('Work-log.md')
        .setValue(this.plugin.settings.logFilePath)
        .onChange(async (value) => {
          this.plugin.settings.logFilePath = value;
          await this.plugin.saveSettings();
        }));

    let previewContent: HTMLElement;
    const updatePreview = () => {
      const preview = this.plugin.processTemplate(t('sampleContent'));
      previewContent.setText(preview);
    };

    new Setting(containerEl)
      .setName(t('template'))
      .setDesc(t('templateDesc'))
      .addTextArea(text => {
        text
          .setPlaceholder(DEFAULT_SETTINGS.template)
          .setValue(this.plugin.settings.template)
          .onChange(async (value) => {
            this.plugin.settings.template = value;
            await this.plugin.saveSettings();
            updatePreview();
          });
        text.inputEl.rows = 6;
        text.inputEl.cols = 40;
      });

    // プレビュー（テンプレートの直下に配置）
    const previewContainer = containerEl.createEl('div', { cls: 'template-preview' });
    previewContainer.createEl('h4', { text: t('preview') });
    previewContent = previewContainer.createEl('pre');
    updatePreview();

    new Setting(containerEl)
      .setName(t('imageFolder'))
      .setDesc(t('imageFolderDesc'))
      .addText(text => text
        .setPlaceholder('Attachments')
        .setValue(this.plugin.settings.imageFolder)
        .onChange(async (value) => {
          this.plugin.settings.imageFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t('submitKey'))
      .setDesc(t('submitKeyDesc'))
      .addDropdown(dropdown => dropdown
        .addOptions(Object.fromEntries(KEY_OPTIONS.map(k => [k, k])))
        .setValue(this.plugin.settings.submitKey)
        .onChange(async (value) => {
          this.plugin.settings.submitKey = value as KeyOption;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t('newlineKey'))
      .setDesc(t('newlineKeyDesc'))
      .addDropdown(dropdown => dropdown
        .addOptions(Object.fromEntries(KEY_OPTIONS.map(k => [k, k])))
        .setValue(this.plugin.settings.newlineKey)
        .onChange(async (value) => {
          this.plugin.settings.newlineKey = value as KeyOption;
          await this.plugin.saveSettings();
        }));

    // スラッシュコマンド設定
    containerEl.createEl('h3', { text: t('slashCommands') });
    containerEl.createEl('p', { text: t('slashCommandsDesc'), cls: 'setting-item-description' });

    const commandsContainer = containerEl.createEl('div', { cls: 'slash-commands-container' });
    this.renderSlashCommands(commandsContainer);
  }

  renderSlashCommands(container: HTMLElement) {
    container.empty();

    this.plugin.settings.slashCommands.forEach((cmd, index) => {
      const cmdEl = container.createEl('div', { cls: 'slash-command-item' });

      const nameInput = cmdEl.createEl('input', {
        attr: { type: 'text', placeholder: t('commandName') },
        cls: 'slash-command-name'
      });
      nameInput.value = cmd.name;
      nameInput.onchange = async () => {
        this.plugin.settings.slashCommands[index].name = nameInput.value;
        await this.plugin.saveSettings();
      };

      const textInput = cmdEl.createEl('input', {
        attr: { type: 'text', placeholder: t('commandText') },
        cls: 'slash-command-text'
      });
      textInput.value = cmd.text;
      textInput.onchange = async () => {
        this.plugin.settings.slashCommands[index].text = textInput.value;
        await this.plugin.saveSettings();
      };

      const deleteBtn = cmdEl.createEl('button', { text: t('deleteCommand'), cls: 'slash-command-delete' });
      deleteBtn.onclick = async () => {
        this.plugin.settings.slashCommands.splice(index, 1);
        await this.plugin.saveSettings();
        this.renderSlashCommands(container);
      };
    });

    // 追加ボタン
    const addBtn = container.createEl('button', { text: t('addCommand'), cls: 'slash-command-add' });
    addBtn.onclick = async () => {
      this.plugin.settings.slashCommands.push({
        id: Date.now().toString(),
        name: '',
        text: ''
      });
      await this.plugin.saveSettings();
      this.renderSlashCommands(container);
    };
  }
}

export default class WorkLogPlugin extends Plugin {
  settings!: WorkLogSettings;

  async onload() {
    await this.loadSettings();

    // emptyビューにボタンを追加
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.addButtonToEmptyViews();
      })
    );

    // 初回実行
    this.app.workspace.onLayoutReady(() => {
      this.addButtonToEmptyViews();
    });

    this.addCommand({
      id: 'open-tweet-modal',
      name: t('writeWorkLog'),
      callback: () => this.openTweetModal(),
    });

    this.addRibbonIcon('pencil', t('writeWorkLog'), () => this.openTweetModal());

    this.addSettingTab(new WorkLogSettingTab(this.app, this));
  }

  addButtonToEmptyViews() {
    const emptyLeaves = this.app.workspace.getLeavesOfType('empty');
    emptyLeaves.forEach(leaf => {
      this.addButtonToLeaf(leaf);
    });
  }

  addButtonToLeaf(leaf: WorkspaceLeaf) {
    const container = leaf.view.containerEl;

    // 既に追加済みの場合はスキップ
    if (container.querySelector('.worklog-button-wrapper')) {
      return;
    }

    // empty-state-container を探す
    const emptyStateContainer = container.querySelector('.empty-state-container');
    if (!emptyStateContainer) {
      return;
    }

    // ボタンを作成して先頭に追加
    const wrapper = document.createElement('div');
    wrapper.addClass('worklog-button-wrapper');

    // 作業ログを書くボタン
    const writeBtn = document.createElement('button');
    writeBtn.addClass('tweet-button');
    writeBtn.innerHTML = `✏️ ${t('writeWorkLog')}`;
    writeBtn.onclick = () => this.openTweetModal();

    // 作業ログを開くボタン
    const openBtn = document.createElement('button');
    openBtn.addClass('tweet-button', 'tweet-button-secondary');
    openBtn.innerHTML = `📖 ${t('openWorkLog')}`;
    openBtn.onclick = () => this.openWorkLog();

    wrapper.appendChild(writeBtn);
    wrapper.appendChild(openBtn);
    emptyStateContainer.insertBefore(wrapper, emptyStateContainer.firstChild);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  openTweetModal() {
    new TweetModal(this.app, this, (content) => this.saveLog(content)).open();
  }

  async openWorkLog() {
    const filePath = this.settings.logFilePath;
    let file = this.app.vault.getAbstractFileByPath(filePath);

    // ファイルが存在しない場合は作成
    if (!(file instanceof TFile)) {
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
        await this.app.vault.createFolder(dir);
      }
      await this.app.vault.create(filePath, '');
      file = this.app.vault.getAbstractFileByPath(filePath);
    }

    if (file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }

  async saveImage(file: File): Promise<string | null> {
    try {
      const now = (window as unknown as { moment: () => { format: (f: string) => string } }).moment();
      const timestamp = now.format('YYYYMMDDHHmmss');
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `worklog-${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const folderPath = this.settings.imageFolder;

      // フォルダが存在しなければ作成
      if (!this.app.vault.getAbstractFileByPath(folderPath)) {
        await this.app.vault.createFolder(folderPath);
      }

      const filePath = `${folderPath}/${fileName}`;
      const arrayBuffer = await file.arrayBuffer();
      await this.app.vault.createBinary(filePath, arrayBuffer);

      // Obsidian形式の画像リンクを返す
      return `![[${fileName}]]`;
    } catch (error) {
      console.error('Failed to save image:', error);
      new Notice(t('imageSaveFailed'));
      return null;
    }
  }

  processTemplate(content: string): string {
    const now = (window as unknown as { moment: () => { format: (f: string) => string } }).moment();
    return this.settings.template
      .replace(/\{content\}/g, content)
      .replace(/\{datetime\}/g, now.format('YYYY-MM-DD HH:mm'))
      .replace(/\{date\}/g, now.format('YYYY-MM-DD'))
      .replace(/\{time\}/g, now.format('HH:mm'));
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
      await this.app.vault.create(filePath, logEntry);
    }

    new Notice(t('saved'));
  }

  onunload() {
    // 追加したボタンを削除
    document.querySelectorAll('.worklog-button-wrapper').forEach(el => el.remove());
  }
}
