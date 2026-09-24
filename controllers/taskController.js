const taskService = require('../services/taskService');

/**
 * Application / Logic Tier: Task Controller
 * Handles HTTP requests, extracts parameters/body, calls the Task Service,
 * and formats standardized JSON API responses.
 */
class TaskController {
  async getTasks(req, res, next) {
    try {
      const { status, priority, category, search, sort } = req.query;
      const tasks = taskService.getTasks({ status, priority, category, search, sort });
      res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
      });
    } catch (err) {
      next(err);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = taskService.getTaskById(req.params.id);
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (err) {
      next(err);
    }
  }

  async createTask(req, res, next) {
    try {
      const newTask = taskService.createTask(req.body);
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: newTask
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req, res, next) {
    try {
      const updated = taskService.updateTask(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleTask(req, res, next) {
    try {
      const updated = taskService.toggleTaskCompletion(req.params.id);
      res.status(200).json({
        success: true,
        message: `Task marked as ${updated.completed ? 'completed' : 'active'}`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteTask(req, res, next) {
    try {
      taskService.deleteTask(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async clearCompleted(req, res, next) {
    try {
      const count = taskService.clearCompletedTasks();
      res.status(200).json({
        success: true,
        message: `Removed ${count} completed tasks`,
        count
      });
    } catch (err) {
      next(err);
    }
  }

  async getMetrics(req, res, next) {
    try {
      const metrics = taskService.getDashboardMetrics();
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TaskController();
