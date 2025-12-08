// 待办事项模块
const TodoModule = {
  todos: [],

  async init() {
    this.todos = await Storage.get('todos', []);
    this.render();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('add-todo').addEventListener('click', () => this.add());
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.add();
    });

    document.getElementById('todo-list').addEventListener('click', (e) => {
      const item = e.target.closest('.todo-item');
      if (!item) return;

      const id = parseInt(item.dataset.id);
      if (e.target.classList.contains('todo-checkbox')) {
        this.toggle(id);
      } else if (e.target.closest('.todo-delete')) {
        this.delete(id);
      }
    });
  },

  render() {
    const list = document.getElementById('todo-list');
    
    if (this.todos.length === 0) {
      list.innerHTML = '<li class="empty-state">暂无待办事项</li>';
      return;
    }

    list.innerHTML = this.todos.map(todo => `
      <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
        <button class="todo-delete"><i class="fas fa-trash"></i></button>
      </li>
    `).join('');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  async add() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;

    this.todos.unshift({
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    });

    await Storage.set('todos', this.todos);
    this.render();
    input.value = '';
  },

  async toggle(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      await Storage.set('todos', this.todos);
      this.render();
    }
  },

  async delete(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    await Storage.set('todos', this.todos);
    this.render();
  }
};
