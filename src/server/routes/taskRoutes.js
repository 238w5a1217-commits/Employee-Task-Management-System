import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  exportTasksCSV,
} from '../controllers/taskController.js';

const router = express.Router();

// CSV export must be registered before /:id parameter route
router.get('/export', exportTasksCSV);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// Dedicated status update API: PUT /api/tasks/:id/status
router.put('/:id/status', updateTaskStatus);

export default router;
