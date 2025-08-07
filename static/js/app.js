// Global variables
let currentTaskId = null;
let tasks = [];
let taskModal, deleteModal, toast;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize Bootstrap components
    taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    toast = new bootstrap.Toast(document.getElementById('toast'));
    
    // Event listeners
    setupEventListeners();
    
    // Load initial data
    loadTasks();
}

function setupEventListeners() {
    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', showTaskModal);
    
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    
    // Delete confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    
    // Modal reset on hide
    document.getElementById('taskModal').addEventListener('hidden.bs.modal', resetTaskForm);
}

// Load tasks from API
async function loadTasks() {
    try {
        showLoading(true);
        const params = new URLSearchParams();
        
        const search = document.getElementById('searchInput').value;
        const status = document.getElementById('statusFilter').value;
        const priority = document.getElementById('priorityFilter').value;
        
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        
        const response = await fetch(`/api/tasks?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
            tasks = data.tasks;
            renderTasks();
        } else {
            showToast('Error loading tasks: ' + data.error, 'error');
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Failed to load tasks. Please check your connection.', 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

// Render tasks in the UI
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    
    if (tasks.length === 0) {
        showEmptyState();
        hideAddButtons();
        return;
    }
    
    hideEmptyState();
    showAddButtons();
    
    const tasksHtml = tasks.map(task => createTaskCard(task)).join('');
    container.innerHTML = tasksHtml;
}

// Create HTML for a single task card with enhanced design
function createTaskCard(task) {
    const statusClass = getStatusClass(task.status);
    const priorityClass = getPriorityClass(task.priority);
    const statusIcon = getStatusIcon(task.status);
    const priorityIcon = getPriorityIcon(task.priority);
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
    const createdDate = new Date(task.created_at).toLocaleDateString();
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
    
    return `
        <div class="task-card mb-4 ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}" data-priority="${task.priority}">
            <div class="card-body p-4">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="task-header flex-grow-1">
                        <h5 class="task-title mb-2">${escapeHtml(task.title)}</h5>
                        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-ghost btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <ul class="dropdown-menu shadow">
                            <li><a class="dropdown-item" href="#" onclick="editTask(${task.id})">
                                <i class="fas fa-edit me-2 text-info"></i>Edit Task
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="showDeleteModal(${task.id})">
                                <i class="fas fa-trash me-2"></i>Delete Task
                            </a></li>
                        </ul>
                    </div>
                </div>
                
                <!-- Status and Priority badges -->
                <div class="task-badges mb-3">
                    <span class="badge status-badge ${statusClass}">
                        ${statusIcon} ${formatStatus(task.status)}
                    </span>
                    <span class="badge priority-badge ${priorityClass}">
                        ${priorityIcon} ${formatPriority(task.priority)}
                    </span>
                    ${isOverdue ? '<span class="badge overdue-badge"><i class="fas fa-exclamation-triangle"></i> Overdue</span>' : ''}
                </div>
                
                <!-- Task meta information -->
                <div class="task-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt meta-icon"></i>
                        <span class="meta-label">Due:</span>
                        <span class="meta-value ${isOverdue ? 'text-danger' : ''}">${dueDate}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock meta-icon"></i>
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${createdDate}</span>
                    </div>
                </div>
                
                <!-- Mobile action buttons -->
                <div class="d-md-none mt-4">
                    <div class="mobile-actions">
                        <button class="btn btn-outline-info btn-sm" onclick="editTask(${task.id})">
                            <i class="fas fa-edit me-1"></i> Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="showDeleteModal(${task.id})">
                            <i class="fas fa-trash me-1"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
            <div class="task-card-glow"></div>
        </div>
    `;
}

// Show task modal for adding or editing
function showTaskModal(taskId = null) {
    currentTaskId = taskId;
    const modalTitle = document.getElementById('taskModalTitle');
    const saveBtn = document.getElementById('saveTaskBtn');
    
    if (taskId) {
        modalTitle.textContent = 'Edit Task';
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" style="display: none;"></span>Update Task';
        populateTaskForm(taskId);
    } else {
        modalTitle.textContent = 'Add New Task';
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" style="display: none;"></span>Save Task';
        resetTaskForm();
    }
    
    taskModal.show();
}

// Populate form with task data for editing
function populateTaskForm(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDueDate').value = task.due_date || '';
}

// Reset task form
function resetTaskForm() {
    document.getElementById('taskForm').reset();
    document.getElementById('taskForm').classList.remove('was-validated');
    document.getElementById('taskPriority').value = 'medium';
    currentTaskId = null;
}

// Handle task form submission
async function handleTaskSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const form = event.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const saveBtn = document.getElementById('saveTaskBtn');
    const spinner = saveBtn.querySelector('.spinner-border');
    
    try {
        // Show loading state
        saveBtn.disabled = true;
        spinner.style.display = 'inline-block';
        
        const formData = {
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            due_date: document.getElementById('taskDueDate').value || null
        };
        
        const url = currentTaskId ? `/api/tasks/${currentTaskId}` : '/api/tasks';
        const method = currentTaskId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            taskModal.hide();
            loadTasks(); // Reload tasks
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showToast('Failed to save task. Please try again.', 'error');
    } finally {
        // Hide loading state
        saveBtn.disabled = false;
        spinner.style.display = 'none';
    }
}

// Edit task
function editTask(taskId) {
    showTaskModal(taskId);
}

// Show delete confirmation modal
function showDeleteModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentTaskId = taskId;
    document.getElementById('deleteTaskTitle').textContent = `"${task.title}"`;
    deleteModal.show();
}

// Confirm delete task
async function confirmDelete() {
    if (!currentTaskId) return;
    
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    const spinner = deleteBtn.querySelector('.spinner-border');
    
    try {
        // Show loading state
        deleteBtn.disabled = true;
        spinner.style.display = 'inline-block';
        
        const response = await fetch(`/api/tasks/${currentTaskId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            deleteModal.hide();
            loadTasks(); // Reload tasks
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task. Please try again.', 'error');
    } finally {
        // Hide loading state
        deleteBtn.disabled = false;
        spinner.style.display = 'none';
        currentTaskId = null;
    }
}

// Apply search and filters
function applyFilters() {
    loadTasks();
}

// Show/hide loading state
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const tasksContainer = document.getElementById('tasksContainer');
    
    if (show) {
        loadingState.style.display = 'block';
        tasksContainer.style.display = 'none';
        hideEmptyState();
    } else {
        loadingState.style.display = 'none';
        tasksContainer.style.display = 'block';
    }
}

// Show/hide empty state
function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('tasksContainer').innerHTML = '';
    showLoading(false);
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
}

// Show/hide add task buttons based on task existence
function showAddButtons() {
    // Show navbar add button
    document.getElementById('addTaskBtn').style.display = 'inline-block';
    // Show floating add button
    document.getElementById('floatingAddBtn').style.display = 'block';
}

function hideAddButtons() {
    // Hide navbar add button
    document.getElementById('addTaskBtn').style.display = 'none';
    // Hide floating add button
    document.getElementById('floatingAddBtn').style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastBody = document.getElementById('toastBody');
    const toastHeader = document.querySelector('#toast .toast-header i');
    
    // Set message
    toastBody.textContent = message;
    
    // Set icon based on type
    toastHeader.className = `fas me-2 ${getToastIcon(type)}`;
    
    // Show toast
    toast.show();
}

// Enhanced utility functions with modern styling
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'in_progress': 'status-progress',
        'completed': 'status-completed'
    };
    return classes[status] || 'status-default';
}

function getPriorityClass(priority) {
    const classes = {
        'low': 'priority-low',
        'medium': 'priority-medium',
        'high': 'priority-high'
    };
    return classes[priority] || 'priority-default';
}

function getStatusIcon(status) {
    const icons = {
        'pending': '<i class="fas fa-clock"></i>',
        'in_progress': '<i class="fas fa-spinner fa-spin"></i>',
        'completed': '<i class="fas fa-check-circle"></i>'
    };
    return icons[status] || '<i class="fas fa-circle"></i>';
}

function getPriorityIcon(priority) {
    const icons = {
        'low': '<i class="fas fa-arrow-down"></i>',
        'medium': '<i class="fas fa-minus"></i>',
        'high': '<i class="fas fa-arrow-up"></i>'
    };
    return icons[priority] || '<i class="fas fa-circle"></i>';
}

function formatStatus(status) {
    const formats = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    };
    return formats[status] || status;
}

function formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function getToastIcon(type) {
    const icons = {
        'success': 'fa-check-circle text-success',
        'error': 'fa-exclamation-circle text-danger',
        'warning': 'fa-exclamation-triangle text-warning',
        'info': 'fa-info-circle text-primary'
    };
    return icons[type] || icons.info;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
