const crypto = require('crypto');
const db = require('../data/db');

/**
 * Data Tier: Task Repository
 * Encapsulates all persistence and query operations for Tasks.
 */
class TaskRepository {
  constructor() {
    this.tableName = 'tasks';
  }

  getAll() {
    return db.getTable(this.tableName);
  }

  getById(id) {
    const tasks = this.getAll();
    return tasks.find(t => t.id === id) || null;
  }

  create(taskData) {
    const tasks = this.getAll();
    const newTask = {
      id: crypto.randomUUID(),
      title: taskData.title.trim(),
      description: (taskData.description || '').trim(),
      priority: taskData.priority || 'medium', // low, medium, high, urgent
      category: taskData.category || 'general', // general, work, personal, shopping, health
      dueDate: taskData.dueDate || null,
      completed: Boolean(taskData.completed || false),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    db.saveTable(this.tableName, tasks);
    return newTask;
  }

  update(id, updateData) {
    const tasks = this.getAll();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const existing = tasks[index];
    const updatedTask = {
      ...existing,
      ...updateData,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt, // Immutable creation timestamp
      updatedAt: new Date().toISOString()
    };

    tasks[index] = updatedTask;
    db.saveTable(this.tableName, tasks);
    return updatedTask;
  }

  delete(id) {
    const tasks = this.getAll();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const deleted = tasks.splice(index, 1)[0];
    db.saveTable(this.tableName, tasks);
    return deleted;
  }

  clearCompleted() {
    const tasks = this.getAll();
    const remaining = tasks.filter(t => !t.completed);
    const removedCount = tasks.length - remaining.length;
    db.saveTable(this.tableName, remaining);
    return removedCount;
  }
}

module.exports = new TaskRepository();
