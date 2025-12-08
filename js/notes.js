// 笔记模块
const NotesModule = {
  notes: [],

  async init() {
    this.notes = await Storage.get('notes', []);
    this.render();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('add-note').addEventListener('click', () => this.add());
  },

  render() {
    const list = document.getElementById('notes-list');
    
    if (this.notes.length === 0) {
      list.innerHTML = '<div class="empty-state">暂无笔记</div>';
      return;
    }

    list.innerHTML = this.notes.map(note => `
      <div class="note-item" data-id="${note.id}">
        <div class="note-header">
          <span class="note-title">${this.escapeHtml(note.title || '无标题')}</span>
          <span class="note-date">${this.formatDate(note.createdAt)}</span>
        </div>
        <div class="note-content">${this.escapeHtml(note.content)}</div>
        <div class="note-actions">
          <button class="note-edit" data-id="${note.id}"><i class="fas fa-edit"></i> 编辑</button>
          <button class="note-delete" data-id="${note.id}"><i class="fas fa-trash"></i> 删除</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.note-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.delete(parseInt(e.currentTarget.dataset.id));
      });
    });

    list.querySelectorAll('.note-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.edit(parseInt(e.currentTarget.dataset.id));
      });
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  async add() {
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!content) return;

    this.notes.unshift({
      id: Date.now(),
      title,
      content,
      createdAt: new Date().toISOString()
    });

    await Storage.set('notes', this.notes);
    this.render();
    titleInput.value = '';
    contentInput.value = '';
  },

  edit(id) {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      document.getElementById('note-title').value = note.title;
      document.getElementById('note-content').value = note.content;
      this.delete(id, false);
    }
  },

  async delete(id, save = true) {
    this.notes = this.notes.filter(n => n.id !== id);
    if (save) await Storage.set('notes', this.notes);
    this.render();
  }
};
