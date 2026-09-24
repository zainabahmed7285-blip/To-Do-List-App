/**
 * Presentation Tier: Application Controller & State Management
 * Coordinates UI events, manages filters, interacts with API Client, and renders dynamic views.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    tasks: [],
    stats: {
      total: 0,
      active: 0,
      completed: 0,
      overdue: 0,
      completionRate: 0
    },
    filters: {
      status: 'all',
      category: 'all',
      priority: '',
      search: '',
      sort: 'created_desc'
    },
    editingTaskId: null,
    isLoading: false
  };

  // DOM Elements Cache
  const elements = {
    // Metrics
    statTotal: document.getElementById('stat-total'),
    statActive: document.getElementById('stat-active'),
    statCompleted: document.getElementById('stat-completed'),
    statProgressBar: document.getElementById('stat-progress-bar'),
    statRateText: document.getElementById('stat-rate-text'),
    statOverdue: document.getElementById('stat-overdue'),
    
    // Controls & Filters
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    sortSelect: document.getElementById('sort-select'),
    priorityFilterSelect: document.getElementById('priority-filter-select'),
    filterStatusButtons: document.querySelectorAll('.filter-segment .filter-btn'),
    categoryPills: document.querySelectorAll('.category-pills .pill-btn'),
    btnClearCompleted: document.getElementById('btn-clear-completed'),

    // Task List & Containers
    taskListContainer: document.getElementById('task-list-container'),
    taskListCount: document.getElementById('task-list-count'),
    activeFilterIndicator: document.getElementById('active-filter-indicator'),
    emptyState: document.getElementById('empty-state'),
    loadingState: document.getElementById('loading-state'),
    btnEmptyAddTask: document.getElementById('btn-empty-add-task'),

    // Modal
    btnOpenNewTask: document.getElementById('btn-open-new-task'),
    taskModal: document.getElementById('task-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    taskForm: document.getElementById('task-form'),
    taskIdInput: document.getElementById('task-id'),
    taskTitleInput: document.getElementById('task-title-input'),
    taskDescInput: document.getElementById('task-desc-input'),
    taskCategorySelect: document.getElementById('task-category-select'),
    taskDueDateInput: document.getElementById('task-duedate-input'),
    titleError: document.getElementById('title-error'),
    priorityRadios: document.querySelectorAll('input[name="priority"]'),

    // Toasts
    toastContainer: document.getElementById('toast-container')
  };

  // Category Icon & Labels Mapping
  const CATEGORY_META = {
    work: { label: 'Work', icon: '💼' },
    personal: { label: 'Personal', icon: '👤' },
    shopping: { label: 'Shopping', icon: '🛒' },
    health: { label: 'Health', icon: '❤️' },
    finance: { label: 'Finance', icon: '💳' },
    general: { label: 'General', icon: '📁' }
  };

  /* ==========================================================================
     Core Data Synchronization
     ========================================================================== */

  async function loadData() {
    setLoading(true);
    try {
      // Parallel fetch for tasks and dashboard metrics
      const [tasks, stats] = await Promise.all([
        window.apiClient.fetchTasks(state.filters),
        window.apiClient.fetchStats()
      ]);

      state.tasks = tasks;
      state.stats = stats;

      renderMetrics();
      renderTasks();
      updateFilterSummary();
    } catch (err) {
      showToast(err.message || 'Failed to sync tasks from server', 'error');
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    state.isLoading = loading;
    if (loading && state.tasks.length === 0) {
      elements.loadingState.classList.remove('hidden');
      elements.emptyState.classList.add('hidden');
    } else {
      elements.loadingState.classList.add('hidden');
    }
  }

  /* ==========================================================================
     UI Rendering
     ========================================================================== */

  function renderMetrics() {
    const { total, active, completed, overdue, completionRate } = state.stats;

    elements.statTotal.textContent = total;
    elements.statActive.textContent = active;
    elements.statCompleted.textContent = completed;
    elements.statOverdue.textContent = overdue;

    elements.statProgressBar.style.width = `${completionRate}%`;
    elements.statRateText.textContent = `${completionRate}% completion rate`;
  }

  function renderTasks() {
    const tasks = state.tasks;
    elements.taskListCount.textContent = `(${tasks.length})`;

    if (tasks.length === 0) {
      elements.taskListContainer.innerHTML = '';
      elements.emptyState.classList.remove('hidden');
      
      if (state.filters.search || state.filters.status !== 'all' || state.filters.category !== 'all' || state.filters.priority) {
        document.getElementById('empty-title').textContent = 'No matching tasks';
        document.getElementById('empty-subtitle').textContent = 'Try tweaking your filters or search keywords.';
      } else {
        document.getElementById('empty-title').textContent = 'Your task list is empty';
        document.getElementById('empty-subtitle').textContent = 'Stay organized by adding your first project task!';
      }
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.taskListContainer.innerHTML = tasks.map(task => createTaskCardHTML(task)).join('');

    attachTaskCardListeners();
  }

  function createTaskCardHTML(task) {
    const isCompleted = Boolean(task.completed);
    const categoryInfo = CATEGORY_META[task.category] || CATEGORY_META.general;
    const dueDateDisplay = formatDueDate(task.dueDate);

    return `
      <article class="task-card priority-${task.priority} ${isCompleted ? 'completed' : ''}" data-id="${task.id}" id="task-${task.id}">
        <div class="task-checkbox-wrap">
          <input 
            type="checkbox" 
            class="custom-checkbox task-toggle-check" 
            id="checkbox-${task.id}" 
            data-id="${task.id}" 
            ${isCompleted ? 'checked' : ''} 
            aria-label="Mark task '${escapeHtml(task.title)}' as ${isCompleted ? 'incomplete' : 'complete'}"
          >
        </div>

        <div class="task-body">
          <div class="task-header-row">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <div class="task-actions">
              <button class="action-btn edit-task-btn" data-id="${task.id}" title="Edit Task" aria-label="Edit Task">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="action-btn delete-btn delete-task-btn" data-id="${task.id}" title="Delete Task" aria-label="Delete Task">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}

          <div class="task-badges">
            <span class="badge badge-priority-${task.priority}">
              ${getPriorityIcon(task.priority)} ${task.priority}
            </span>

            <span class="badge badge-category">
              ${categoryInfo.icon} ${categoryInfo.label}
            </span>

            ${dueDateDisplay.html}
          </div>
        </div>
      </article>
    `;
  }

  function formatDueDate(dueDate) {
    if (!dueDate) return { html: '' };

    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);
    const due = new Date(dueDate);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
    let text = dueDate;
    let isOverdue = false;

    if (diffDays < 0) {
      text = `Overdue (${Math.abs(diffDays)}d ago)`;
      isOverdue = true;
    } else if (diffDays === 0) {
      text = 'Due Today';
    } else if (diffDays === 1) {
      text = 'Due Tomorrow';
    } else if (diffDays <= 7) {
      text = `Due in ${diffDays} days`;
    }

    const html = `
      <span class="badge badge-date ${isOverdue ? 'overdue' : ''}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        ${text}
      </span>
    `;

    return { html, isOverdue };
  }

  function getPriorityIcon(priority) {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟣';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  function updateFilterSummary() {
    const parts = [];
    if (state.filters.status !== 'all') {
      parts.push(`Status: ${capitalize(state.filters.status)}`);
    }
    if (state.filters.category !== 'all') {
      parts.push(`Category: ${capitalize(state.filters.category)}`);
    }
    if (state.filters.priority) {
      parts.push(`Priority: ${capitalize(state.filters.priority)}`);
    }
    if (state.filters.search) {
      parts.push(`Search: "${state.filters.search}"`);
    }

    elements.activeFilterIndicator.textContent = parts.length > 0 
      ? `Filters: ${parts.join(' • ')}`
      : 'Showing all tasks';
  }

  /* ==========================================================================
     Event Bindings & Handlers
     ========================================================================== */

  function attachTaskCardListeners() {
    // Checkbox toggle handlers
    document.querySelectorAll('.task-toggle-check').forEach(box => {
      box.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        try {
          const updated = await window.apiClient.toggleTask(id);
          showToast(`Task marked as ${updated.completed ? 'completed' : 'active'}`, 'success');
          await loadData();
        } catch (err) {
          e.target.checked = !e.target.checked; // revert
          showToast(err.message || 'Failed to update task', 'error');
        }
      });
    });

    // Edit button handlers
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      });
    });

    // Delete button handlers
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        const card = document.getElementById(`task-${id}`);
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
          if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
          }
          await window.apiClient.deleteTask(id);
          showToast('Task removed', 'info');
          await loadData();
        } catch (err) {
          if (card) {
            card.style.opacity = '1';
            card.style.transform = 'none';
          }
          showToast(err.message || 'Failed to delete task', 'error');
        }
      });
    });
  }

  // Filter: Status Buttons
  elements.filterStatusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterStatusButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filters.status = btn.getAttribute('data-status');
      loadData();
    });
  });

  // Filter: Category Pills
  elements.categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.filters.category = pill.getAttribute('data-category');
      loadData();
    });
  });

  // Filter: Priority Select
  elements.priorityFilterSelect.addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    loadData();
  });

  // Sort Select
  elements.sortSelect.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    loadData();
  });

  // Search Input with Debounce
  let searchTimeout = null;
  elements.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    elements.btnClearSearch.classList.toggle('visible', Boolean(val));

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = val;
      loadData();
    }, 250);
  });

  // Clear Search Button
  elements.btnClearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.btnClearSearch.classList.remove('visible');
    state.filters.search = '';
    loadData();
    elements.searchInput.focus();
  });

  // Clear Completed Button
  elements.btnClearCompleted.addEventListener('click', async () => {
    if (state.stats.completed === 0) {
      showToast('No completed tasks to clear', 'info');
      return;
    }
    if (!confirm('Remove all completed tasks? This action cannot be undone.')) return;

    try {
      const res = await window.apiClient.clearCompleted();
      showToast(res.message || 'Completed tasks cleared', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to clear completed tasks', 'error');
    }
  });

  /* ==========================================================================
     Modal Handling (Create & Edit)
     ========================================================================== */

  function openCreateModal() {
    state.editingTaskId = null;
    elements.modalTitle.textContent = 'Create New Task';
    elements.taskForm.reset();
    elements.taskIdInput.value = '';
    elements.titleError.textContent = '';

    // Default to medium priority
    const medRadio = document.querySelector('input[name="priority"][value="medium"]');
    if (medRadio) medRadio.checked = true;

    // Set default due date to tomorrow
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    elements.taskDueDateInput.value = tomorrow;

    elements.taskModal.classList.remove('hidden');
    elements.taskTitleInput.focus();
  }

  function openEditModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    state.editingTaskId = id;
    elements.modalTitle.textContent = 'Edit Task';
    elements.taskIdInput.value = task.id;
    elements.taskTitleInput.value = task.title;
    elements.taskDescInput.value = task.description || '';
    elements.taskCategorySelect.value = task.category || 'general';
    elements.taskDueDateInput.value = task.dueDate || '';
    elements.titleError.textContent = '';

    const priorityRadio = document.querySelector(`input[name="priority"][value="${task.priority}"]`);
    if (priorityRadio) priorityRadio.checked = true;

    elements.taskModal.classList.remove('hidden');
    elements.taskTitleInput.focus();
  }

  function closeModal() {
    elements.taskModal.classList.add('hidden');
    elements.taskForm.reset();
    state.editingTaskId = null;
  }

  elements.btnOpenNewTask.addEventListener('click', openCreateModal);
  elements.btnEmptyAddTask.addEventListener('click', openCreateModal);
  elements.modalCloseBtn.addEventListener('click', closeModal);
  elements.btnCancelModal.addEventListener('click', closeModal);

  // Close modal on outside backdrop click
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) closeModal();
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.taskModal.classList.contains('hidden')) {
      closeModal();
    }
    // Quick search shortcut "/"
    if (e.key === '/' && document.activeElement !== elements.searchInput && elements.taskModal.classList.contains('hidden')) {
      e.preventDefault();
      elements.searchInput.focus();
    }
  });

  // Modal Form Submission
  elements.taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = elements.taskTitleInput.value.trim();
    if (!title) {
      elements.titleError.textContent = 'Please provide a task title.';
      elements.taskTitleInput.focus();
      return;
    }
    elements.titleError.textContent = '';

    const prioritySelected = document.querySelector('input[name="priority"]:checked');
    const priority = prioritySelected ? prioritySelected.value : 'medium';

    const payload = {
      title,
      description: elements.taskDescInput.value.trim(),
      category: elements.taskCategorySelect.value,
      priority,
      dueDate: elements.taskDueDateInput.value || null
    };

    const submitBtn = document.getElementById('btn-submit-task');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      if (state.editingTaskId) {
        await window.apiClient.updateTask(state.editingTaskId, payload);
        showToast('Task updated successfully', 'success');
      } else {
        await window.apiClient.createTask(payload);
        showToast('Task created successfully', 'success');
      }
      closeModal();
      await loadData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Task';
    }
  });

  /* ==========================================================================
     Toast Notifications
     ========================================================================== */

  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
      <span>${icon} ${escapeHtml(message)}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, duration);
  }

  /* ==========================================================================
     Utility Helpers
     ========================================================================== */

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Initial load on bootstrap
  loadData();
});
