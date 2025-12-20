import { Plugin, Editor } from 'obsidian';

export default class AutoTimestampPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'insert-datetime',
      name: 'Insert datetime with separator',
      editorCallback: (editor: Editor) => {
        const timestamp = this.formatDate(new Date());
        editor.replaceSelection(`(${timestamp})\n\n---\n`);
      },
    });
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const H = String(date.getHours()).padStart(2, '0');
    const M = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${H}:${M}`;
  }
}
