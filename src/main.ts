interface Task {
    id: number;
    titulo: string;
    descricao: string;
    categoria: 'Trabalho' | 'Pessoal';
    completed: boolean;
    isEditing?: boolean;
}

class TodoList {
    private tasks: Task[] = [];
    private searchInput: HTMLInputElement;
    private taskList: HTMLUListElement;
    private tasksCounter: HTMLSpanElement;
    private currentFilter: string = 'all';
    private editingTaskId: number | null = null;
    private searchTerm: string = '';

    constructor() {
        this.searchInput = document.getElementById('searchInput') as HTMLInputElement;
        this.taskList = document.getElementById('taskList') as HTMLUListElement;
        this.tasksCounter = document.getElementById('tasksCounter') as HTMLSpanElement;

        this.initializeEventListeners();
        this.loadTasks();
        this.renderTasks();
    }

    private initializeEventListeners(): void {
        // Abrir modal ao clicar em adicionar tarefa
        document.getElementById('addTask')?.addEventListener('click', () => this.openModal());
        // Barra de pesquisa
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = this.searchInput.value.toLowerCase();
            this.renderTasks();
        });

        // Modal: cancelar
        document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
        // Modal: submit
        document.getElementById('modal-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTaskFromModal();
        });

        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                this.currentFilter = target.dataset.filter || 'all';
                this.updateActiveFilter();
                this.renderTasks();
            });
        });

        // Limpar concluídas
        document.getElementById('clearCompleted')?.addEventListener('click', () => this.clearCompleted());
    }

    private openModal(task?: Task): void {
        (document.getElementById('modal-overlay') as HTMLElement).style.display = 'flex';
        const titleInput = document.getElementById('modal-title') as HTMLInputElement;
        const descInput = document.getElementById('modal-desc') as HTMLTextAreaElement;
        const catTrabalho = document.querySelector('input[name="modal-category"][value="Trabalho"]') as HTMLInputElement;
        const catPessoal = document.querySelector('input[name="modal-category"][value="Pessoal"]') as HTMLInputElement;
        if (task) {
            titleInput.value = task.titulo;
            descInput.value = task.descricao;
            if (task.categoria === 'Trabalho') {
                catTrabalho.checked = true;
            } else {
                catPessoal.checked = true;
            }
            this.editingTaskId = task.id;
        } else {
            titleInput.value = '';
            descInput.value = '';
            catTrabalho.checked = true;
            this.editingTaskId = null;
        }
        setTimeout(() => {
            titleInput.focus();
        }, 100);
    }

    private closeModal(): void {
        (document.getElementById('modal-overlay') as HTMLElement).style.display = 'none';
    }

    private addTaskFromModal(): void {
        const titulo = (document.getElementById('modal-title') as HTMLInputElement).value.trim();
        const descricao = (document.getElementById('modal-desc') as HTMLTextAreaElement).value.trim();
        const categoria = (document.querySelector('input[name="modal-category"]:checked') as HTMLInputElement)?.value as 'Trabalho' | 'Pessoal';
        if (!titulo) return;
        if (this.editingTaskId) {
            this.tasks = this.tasks.map(task =>
                task.id === this.editingTaskId ? { ...task, titulo, descricao, categoria } : task
            );
        } else {
            const task: Task = {
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

    private toggleTask(id: number): void {
        this.tasks = this.tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.saveTasks();
        this.renderTasks();
    }

    private deleteTask(id: number): void {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
    }

    private startEditing(id: number): void {
        this.tasks = this.tasks.map(task => ({
            ...task,
            isEditing: task.id === id
        }));
        this.renderTasks();
    }

    private saveEdit(id: number, newContent: string): void {
        const content = newContent.trim();
        if (!content) {
            this.deleteTask(id);
            return;
        }

        this.tasks = this.tasks.map(task => 
            task.id === id ? { ...task, content, isEditing: false } : task
        );
        this.saveTasks();
        this.renderTasks();
    }

    private cancelEdit(id: number): void {
        this.tasks = this.tasks.map(task => ({
            ...task,
            isEditing: false
        }));
        this.renderTasks();
    }

    private clearCompleted(): void {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.renderTasks();
    }

    private updateActiveFilter(): void {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const target = btn as HTMLElement;
            target.classList.toggle('active', target.dataset.filter === this.currentFilter);
        });
    }

    private getFilteredTasks(): Task[] {
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

    private renderCategoryCards(): void {
        const workCount = this.tasks.filter(t => t.categoria === 'Trabalho').length;
        const workPending = this.tasks.filter(t => t.categoria === 'Trabalho' && !t.completed).length;
        const personalCount = this.tasks.filter(t => t.categoria === 'Pessoal').length;
        const personalPending = this.tasks.filter(t => t.categoria === 'Pessoal' && !t.completed).length;

        const workCountEl = document.getElementById('work-tasks-count');
        const personalCountEl = document.getElementById('personal-tasks-count');
        const workBar = document.getElementById('work-progress-bar') as HTMLElement;
        const personalBar = document.getElementById('personal-progress-bar') as HTMLElement;

        if (workCountEl) workCountEl.textContent = `${workCount} tarefa${workCount !== 1 ? 's' : ''}`;
        if (personalCountEl) personalCountEl.textContent = `${personalCount} tarefa${personalCount !== 1 ? 's' : ''}`;

        // Progresso: percentual de tarefas não concluídas
        if (workBar) {
            workBar.style.width = workCount === 0 ? '0%' : `${Math.round((workPending / workCount) * 100)}%`;
        }
        if (personalBar) {
            personalBar.style.width = personalCount === 0 ? '0%' : `${Math.round((personalPending / personalCount) * 100)}%`;
        }
    }

    private renderTasks(): void {
        this.renderCategoryCards();
        this.taskList.innerHTML = '';
        const filteredTasks = this.getFilteredTasks();

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = (task.completed ? 'completed ' : '') + (task.categoria === 'Pessoal' ? 'pessoal' : 'trabalho');
            li.innerHTML = `
                <button class="complete-btn">
                    <i class="fas ${task.completed ? 'fa-check' : 'fa-circle'}"></i>
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
            li.querySelector('.complete-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTask(task.id);
            });
            li.querySelector('.edit-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(task);
            });
            li.querySelector('.delete-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            });
            li.addEventListener('click', (e) => {
                if ((e.target as HTMLElement).closest('.edit-btn') || (e.target as HTMLElement).closest('.delete-btn') || (e.target as HTMLElement).closest('.complete-btn')) return;
                this.openDetailModal(task);
            });
            this.taskList.appendChild(li);
        });
        // Atualizar contador
        const remainingTasks = this.tasks.filter(task => !task.completed).length;
        this.tasksCounter.textContent = `${remainingTasks} tarefa${remainingTasks !== 1 ? 's' : ''} restante${remainingTasks !== 1 ? 's' : ''}`;
    }

    private saveTasks(): void {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    private loadTasks(): void {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
    }

    private openDetailModal(task: Task): void {
        // Sempre remove qualquer modal anterior
        document.getElementById('detail-modal-overlay')?.remove();
        // Cria um novo modal
        const detailModal = document.createElement('div');
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
        detailModal.style.display = 'flex';
        detailModal.querySelector('#detail-close')?.addEventListener('click', () => {
            detailModal.remove();
        });
    }
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    new TodoList();
}); 