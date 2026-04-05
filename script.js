// 待办清单应用
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('soggytodo-tasks')) || [];
        this.currentTheme = localStorage.getItem('soggytodo-theme') || 'light';

        // DOM元素
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.tasksList = document.getElementById('tasksList');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.themeToggle = document.getElementById('themeToggle');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');

        // 初始化
        this.init();
    }

    init() {
        this.applyTheme();
        this.renderTasks();
        this.updateStats();
        this.setupEventListeners();

        // 聚焦输入框
        setTimeout(() => {
            this.taskInput.focus();
        }, 100);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 添加任务
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // 主题切换
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // 清除已完成任务
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());
    }

    // 添加新任务
    addTask() {
        const taskText = this.taskInput.value.trim();

        if (!taskText) {
            this.showMessage('请输入任务内容', 'warning');
            this.taskInput.focus();
            return;
        }

        // 创建新任务对象
        const newTask = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // 添加到任务数组
        this.tasks.unshift(newTask);

        // 保存到localStorage
        this.saveTasks();

        // 渲染新任务
        this.renderTasks();

        // 清空输入框
        this.taskInput.value = '';
        this.taskInput.focus();

        // 更新统计
        this.updateStats();

        // 显示成功消息
        this.showMessage('任务添加成功', 'success');
    }

    // 渲染所有任务
    renderTasks() {
        if (this.tasks.length === 0) {
            this.tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>暂无任务</h3>
                    <p>添加你的第一个待办事项吧！</p>
                </div>
            `;
            return;
        }

        // 生成任务列表HTML
        const tasksHTML = this.tasks.map(task => this.createTaskHTML(task)).join('');
        this.tasksList.innerHTML = tasksHTML;

        // 为每个任务添加事件监听器
        this.tasks.forEach(task => {
            const taskElement = document.getElementById(`task-${task.id}`);
            if (!taskElement) return;

            // 完成状态切换
            const checkbox = taskElement.querySelector('.task-checkbox');
            checkbox.addEventListener('click', () => this.toggleTaskCompletion(task.id));

            // 删除任务
            const deleteBtn = taskElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        });
    }

    // 创建单个任务HTML
    createTaskHTML(task) {
        return `
            <div id="task-${task.id}" class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}"
                     aria-label="${task.completed ? '标记为未完成' : '标记为已完成'}">
                </div>
                <div class="task-content">
                    ${this.escapeHTML(task.text)}
                </div>
                <div class="task-actions">
                    <button class="delete-btn" aria-label="删除任务">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // 切换任务完成状态
    toggleTaskCompletion(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;

        this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
        this.saveTasks();

        // 更新UI
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
            taskElement.classList.toggle('completed');
            const checkbox = taskElement.querySelector('.task-checkbox');
            checkbox.classList.toggle('checked');
        }

        // 更新统计
        this.updateStats();

        // 显示消息
        const message = this.tasks[taskIndex].completed ? '任务标记为已完成' : '任务标记为未完成';
        this.showMessage(message, 'info');
    }

    // 删除任务
    deleteTask(taskId) {
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
            taskElement.classList.add('removing');

            // 等待动画完成
            setTimeout(() => {
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showMessage('任务已删除', 'info');
            }, 300);
        }
    }

    // 清除所有已完成任务
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(task => task.completed).length;

        if (completedCount === 0) {
            this.showMessage('没有已完成的任务', 'warning');
            return;
        }

        if (!confirm(`确定要删除 ${completedCount} 个已完成的任务吗？`)) {
            return;
        }

        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showMessage(`已删除 ${completedCount} 个已完成任务`, 'success');
    }

    // 更新统计信息
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;
    }

    // 切换主题
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('soggytodo-theme', this.currentTheme);
        this.applyTheme();

        // 更新按钮文本
        const icon = this.themeToggle.querySelector('i');
        const text = this.themeToggle.querySelector('span');

        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = '浅色模式';
            this.showMessage('已切换为深色模式', 'info');
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = '深色模式';
            this.showMessage('已切换为浅色模式', 'info');
        }
    }

    // 应用主题
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);

        // 更新按钮初始状态
        const icon = this.themeToggle.querySelector('i');
        const text = this.themeToggle.querySelector('span');

        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = '浅色模式';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = '深色模式';
        }
    }

    // 保存任务到localStorage
    saveTasks() {
        localStorage.setItem('soggytodo-tasks', JSON.stringify(this.tasks));
    }

    // 显示消息提示
    showMessage(text, type = 'info') {
        // 移除现有的消息
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
            <span>${text}</span>
        `;

        // 添加到页面
        document.body.appendChild(message);

        // 显示消息
        setTimeout(() => {
            message.classList.add('show');
        }, 10);

        // 3秒后自动隐藏
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, 300);
        }, 3000);
    }

    // 获取消息图标
    getMessageIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }

    // 转义HTML，防止XSS
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 添加消息样式
const style = document.createElement('style');
style.textContent = `
    .message {
        position: fixed;
        top: 1rem;
        right: 1rem;
        padding: 0.75rem 1rem;
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.3s, transform 0.3s;
        max-width: 300px;
    }

    .message.show {
        opacity: 1;
        transform: translateY(0);
    }

    .message-success {
        background-color: #10b981;
        color: white;
        border-left: 4px solid #059669;
    }

    .message-warning {
        background-color: #f59e0b;
        color: white;
        border-left: 4px solid #d97706;
    }

    .message-info {
        background-color: var(--primary-color);
        color: white;
        border-left: 4px solid var(--primary-dark);
    }

    .message-error {
        background-color: #ef4444;
        color: white;
        border-left: 4px solid #dc2626;
    }

    .message i {
        font-size: 1.25rem;
    }

    @media (max-width: 640px) {
        .message {
            left: 1rem;
            right: 1rem;
            max-width: none;
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoApp();

    // 全局导出（用于调试）
    window.todoApp = app;
});