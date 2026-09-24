const taskRepository = require('../repositories/taskRepository');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_CATEGORIES = ['general', 'work', 'personal', 'shopping', 'health', 'finance'];

const PRIORITY_WEIGHTS = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

/**
 * Application / Logic Tier: Task Service
 * Implements business rules, validation, transformation, filtering, and metric aggregations.
 */
class TaskService {
  /**
   * Fetch tasks with business filtering, search, and sorting.
   */
  getTasks({ status, priority, category, search, sort }) {
    let tasks = taskRepository.getAll();

    // 1. Status Filter
    if (status === 'active') {
      tasks = tasks.filter(t => !t.completed);
    } else if (status === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    // 2. Priority Filter
    if (priority && VALID_PRIORITIES.includes(priority.toLowerCase())) {
      tasks = tasks.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
    }

    // 3. Category Filter
    if (category && category !== 'all') {
      tasks = tasks.filter(t => (t.category || 'general').toLowerCase() === category.toLowerCase());
    }

    // 4. Keyword Search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 5. Sorting
    tasks.sort((a, b) => {
      switch (sort) {
        case 'dueDate_asc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);

        case 'dueDate_desc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate) - new Date(a.dueDate);

        case 'priority_desc':
          return (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);

        case 'priority_asc':
          return (PRIORITY_WEIGHTS[a.priority] || 0) - (PRIORITY_WEIGHTS[b.priority] || 0);

        case 'created_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);

        case 'created_desc':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return tasks;
  }

  getTaskById(id) {
    const task = taskRepository.getById(id);
    if (!task) {
      const error = new Error(`Task with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return task;
  }

  createTask(payload) {
    this.validateTaskInput(payload, false);

    const taskData = {
      title: payload.title.trim(),
      description: payload.description ? payload.description.trim() : '',
      priority: (payload.priority || 'medium').toLowerCase(),
      category: (payload.category || 'general').toLowerCase(),
      dueDate: payload.dueDate || null,
      completed: false
    };

    return taskRepository.create(taskData);
  }

  updateTask(id, payload) {
    this.getTaskById(id); // Throws 404 if not found
    this.validateTaskInput(payload, true);

    const updateData = {};
    if (payload.title !== undefined) updateData.title = payload.title.trim();
    if (payload.description !== undefined) updateData.description = payload.description.trim();
    if (payload.priority !== undefined) updateData.priority = payload.priority.toLowerCase();
    if (payload.category !== undefined) updateData.category = payload.category.toLowerCase();
    if (payload.dueDate !== undefined) updateData.dueDate = payload.dueDate;
    if (payload.completed !== undefined) updateData.completed = Boolean(payload.completed);

    return taskRepository.update(id, updateData);
  }

  toggleTaskCompletion(id) {
    const task = this.getTaskById(id);
    return taskRepository.update(id, { completed: !task.completed });
  }

  deleteTask(id) {
    this.getTaskById(id); // Ensure task exists
    return taskRepository.delete(id);
  }

  clearCompletedTasks() {
    return taskRepository.clearCompleted();
  }

  getDashboardMetrics() {
    const tasks = taskRepository.getAll();
    const today = new Date().toISOString().split('T')[0];

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    // Overdue: not completed and due date is in the past
    const overdue = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Breakdown by priority
    const priorityBreakdown = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    tasks.forEach(t => {
      const p = (t.priority || 'medium').toLowerCase();
      if (priorityBreakdown[p] !== undefined) {
        priorityBreakdown[p]++;
      }
    });

    return {
      total,
      completed,
      active,
      overdue,
      completionRate,
      priorityBreakdown
    };
  }

  validateTaskInput(data, isPartial = false) {
    if (!isPartial || data.title !== undefined) {
      if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
        const error = new Error('Task title is required and cannot be empty.');
        error.statusCode = 400;
        throw error;
      }
      if (data.title.trim().length > 150) {
        const error = new Error('Task title cannot exceed 150 characters.');
        error.statusCode = 400;
        throw error;
      }
    }

    if (data.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(data.priority.toLowerCase())) {
        const error = new Error(`Invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
    }

    if (data.category !== undefined) {
      if (!VALID_CATEGORIES.includes(data.category.toLowerCase())) {
        const error = new Error(`Invalid category. Allowed values: ${VALID_CATEGORIES.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
    }

    if (data.dueDate) {
      const parsedDate = new Date(data.dueDate);
      if (isNaN(parsedDate.getTime())) {
        const error = new Error('Invalid due date format. Please provide a valid date.');
        error.statusCode = 400;
        throw error;
      }
    }
  }
}

module.exports = new TaskService();
