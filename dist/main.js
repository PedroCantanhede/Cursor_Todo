"use strict";
class TodoList {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.searchTerm = '';
        this.searchInput = document.getElementById('searchInput');
        this.taskList = document.getElementById('taskList');
        this.tasksCounter = document.getElementById('tasksCounter');
        this.initializeEventListeners();
        this.loadTasks();
        this.renderTasks();
    }
    initializeEventListeners() {
        var _a, _b, _c, _d;
        // Abrir modal ao clicar em adicionar tarefa
        (_a = document.getElementById('addTask')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.openModal());
        // Barra de pesquisa
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = this.searchInput.value.toLowerCase();
            this.renderTasks();
        });
        // Modal: cancelar
        (_b = document.getElementById('modal-cancel')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => this.closeModal());
        // Modal: submit
        (_c = document.getElementById('modal-form')) === null || _c === void 0 ? void 0 : _c.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTaskFromModal();
        });
        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target;
                this.currentFilter = target.dataset.filter || 'all';
                this.updateActiveFilter();
                this.renderTasks();
            });
        });
        // Limpar concluídas
        (_d = document.getElementById('clearCompleted')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => this.clearCompleted());
    }
    openModal(task) {
        document.getElementById('modal-overlay').style.display = 'flex';
        const titleInput = document.getElementById('modal-title');
        const descInput = document.getElementById('modal-desc');
        const catTrabalho = document.querySelector('input[name="modal-category"][value="Trabalho"]');
        const catPessoal = document.querySelector('input[name="modal-category"][value="Pessoal"]');
        if (task) {
            titleInput.value = task.titulo;
            descInput.value = task.descricao;
            if (task.categoria === 'Trabalho') {
                catTrabalho.checked = true;
            }
            else {
                catPessoal.checked = true;
            }
            this.editingTaskId = task.id;
        }
        else {
            titleInput.value = '';
            descInput.value = '';
            catTrabalho.checked = true;
            this.editingTaskId = null;
        }
        setTimeout(() => {
            titleInput.focus();
        }, 100);
    }
    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    }
    addTaskFromModal() {
        var _a;
        const titulo = document.getElementById('modal-title').value.trim();
        const descricao = document.getElementById('modal-desc').value.trim();
        const categoria = (_a = document.querySelector('input[name="modal-category"]:checked')) === null || _a === void 0 ? void 0 : _a.value;
        if (!titulo)
            return;
        if (this.editingTaskId) {
            this.tasks = this.tasks.map(task => task.id === this.editingTaskId ? Object.assign(Object.assign({}, task), { titulo, descricao, categoria }) : task);
        }
        else {
            const task = {
                id: Date.now(),
                titulo,
                descricao,
                categoria,
                completed: false,
                isEditing: false
            };
            this.tasks.push(task);
        }
        this.saveTasks();
        this.renderTasks();
        this.closeModal();
    }
    toggleTask(id) {
        this.tasks = this.tasks.map(task => task.id === id ? Object.assign(Object.assign({}, task), { completed: !task.completed }) : task);
        this.saveTasks();
        this.renderTasks();
    }
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
    }
    startEditing(id) {
        this.tasks = this.tasks.map(task => (Object.assign(Object.assign({}, task), { isEditing: task.id === id })));
        this.renderTasks();
    }
    saveEdit(id, newContent) {
        const content = newContent.trim();
        if (!content) {
            this.deleteTask(id);
            return;
        }
        this.tasks = this.tasks.map(task => task.id === id ? Object.assign(Object.assign({}, task), { content, isEditing: false }) : task);
        this.saveTasks();
        this.renderTasks();
    }
    cancelEdit(id) {
        this.tasks = this.tasks.map(task => (Object.assign(Object.assign({}, task), { isEditing: false })));
        this.renderTasks();
    }
    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.renderTasks();
    }
    updateActiveFilter() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const target = btn;
            target.classList.toggle('active', target.dataset.filter === this.currentFilter);
        });
    }
    getFilteredTasks() {
        let filtered = this.tasks;
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
        }
        if (this.searchTerm) {
            filtered = filtered.filter(task => task.titulo.toLowerCase().includes(this.searchTerm));
        }
        return filtered;
    }
    renderCategoryCards() {
        const workCount = this.tasks.filter(t => t.categoria === 'Trabalho').length;
        const workPending = this.tasks.filter(t => t.categoria === 'Trabalho' && !t.completed).length;
        const personalCount = this.tasks.filter(t => t.categoria === 'Pessoal').length;
        const personalPending = this.tasks.filter(t => t.categoria === 'Pessoal' && !t.completed).length;
        const workCountEl = document.getElementById('work-tasks-count');
        const personalCountEl = document.getElementById('personal-tasks-count');
        const workBar = document.getElementById('work-progress-bar');
        const personalBar = document.getElementById('personal-progress-bar');
        if (workCountEl)
            workCountEl.textContent = `${workCount} tarefa${workCount !== 1 ? 's' : ''}`;
        if (personalCountEl)
            personalCountEl.textContent = `${personalCount} tarefa${personalCount !== 1 ? 's' : ''}`;
        // Progresso: percentual de tarefas não concluídas
        if (workBar) {
            workBar.style.width = workCount === 0 ? '0%' : `${Math.round((workPending / workCount) * 100)}%`;
        }
        if (personalBar) {
            personalBar.style.width = personalCount === 0 ? '0%' : `${Math.round((personalPending / personalCount) * 100)}%`;
        }
    }
    renderTasks() {
        this.renderCategoryCards();
        this.taskList.innerHTML = '';
        const filteredTasks = this.getFilteredTasks();
        filteredTasks.forEach(task => {
            var _a, _b, _c;
            const li = document.createElement('li');
            li.className = (task.completed ? 'completed ' : '') + (task.categoria === 'Pessoal' ? 'pessoal' : 'trabalho');
            li.innerHTML = `
                <button class="complete-btn">
                    <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                </button>
                <span class="task-title">${task.titulo}</span>
                <div class="task-actions">
                    <button class="edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            (_a = li.querySelector('.complete-btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTask(task.id);
            });
            (_b = li.querySelector('.edit-btn')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(task);
            });
            (_c = li.querySelector('.delete-btn')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            });
            li.addEventListener('click', (e) => {
                if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn') || e.target.closest('.complete-btn'))
                    return;
                this.openDetailModal(task);
            });
            this.taskList.appendChild(li);
        });
        // Atualizar contador
        const remainingTasks = this.tasks.filter(task => !task.completed).length;
        this.tasksCounter.textContent = `${remainingTasks} tarefa${remainingTasks !== 1 ? 's' : ''} restante${remainingTasks !== 1 ? 's' : ''}`;
    }
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
    }
    openDetailModal(task) {
        var _a;
        // Cria um modal simples para exibir detalhes
        let detailModal = document.getElementById('detail-modal-overlay');
        if (!detailModal) {
            detailModal = document.createElement('div');
            detailModal.id = 'detail-modal-overlay';
            detailModal.className = 'modal-overlay';
            detailModal.innerHTML = `
                <div class="modal">
                    <h2>${task.titulo}</h2>
                    <div style="margin-bottom: 10px; color: #666;">${task.categoria}</div>
                    <div style="margin-bottom: 18px; color: #444;">${task.descricao || '<em>Sem descrição</em>'}</div>
                    <div class="modal-actions">
                        <button id="detail-close">Fechar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(detailModal);
        }
        else {
            detailModal.querySelector('h2').textContent = task.titulo;
            detailModal.querySelector('div').textContent = task.categoria;
            detailModal.querySelectorAll('div')[1].innerHTML = task.descricao || '<em>Sem descrição</em>';
            detailModal.style.display = 'flex';
        }
        detailModal.style.display = 'flex';
        (_a = detailModal.querySelector('#detail-close')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            detailModal.style.display = 'none';
        });
    }
}
// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    new TodoList();
});
