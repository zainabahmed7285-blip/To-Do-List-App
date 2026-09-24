const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Aggregate statistics
router.get('/stats', (req, res, next) => taskController.getMetrics(req, res, next));

// Batch actions
router.delete('/completed', (req, res, next) => taskController.clearCompleted(req, res, next));

// CRUD endpoints
router.get('/', (req, res, next) => taskController.getTasks(req, res, next));
router.post('/', (req, res, next) => taskController.createTask(req, res, next));
router.get('/:id', (req, res, next) => taskController.getTaskById(req, res, next));
router.put('/:id', (req, res, next) => taskController.updateTask(req, res, next));
router.patch('/:id/toggle', (req, res, next) => taskController.toggleTask(req, res, next));
router.delete('/:id', (req, res, next) => taskController.deleteTask(req, res, next));

module.exports = router;
