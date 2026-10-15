import Employee, { DEPARTMENTS } from '../models/Employee.js';
import Task from '../models/Task.js';
import { enrichTask } from './taskController.js';

/**
 * GET /api/dashboard
 * Server-calculated statistics, employee workloads, department breakdown, and overdue metrics
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // 1. Employee Statistics
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeaveEmployees,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Employee.countDocuments({ status: 'Inactive' }),
      Employee.countDocuments({ status: 'On Leave' }),
    ]);

    // 2. Task Statistics
    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      overdueTasksCount,
    ] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'Todo' }),
      Task.countDocuments({ status: 'In Progress' }),
      Task.countDocuments({ status: 'Completed' }),
      Task.countDocuments({ status: 'Cancelled' }),
      Task.countDocuments({
        status: { $nin: ['Completed', 'Cancelled'] },
        dueDate: { $lt: now },
      }),
    ]);

    const activeTasksTotal = todoTasks + inProgressTasks;

    // 3. Employee Workloads (calculated on server)
    const allEmployees = await Employee.find().sort({ name: 1 }).lean();

    // Aggregate active tasks grouped by assignedEmployee
    const activeTasksAggregation = await Task.aggregate([
      {
        $match: {
          status: { $in: ['Todo', 'In Progress'] },
          assignedEmployee: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$assignedEmployee',
          activeTasks: { $sum: 1 },
          tasks: {
            $push: {
              _id: '$_id',
              title: '$title',
              status: '$status',
              priority: '$priority',
              dueDate: '$dueDate',
            },
          },
        },
      },
    ]);

    const workloadMap = {};
    activeTasksAggregation.forEach((item) => {
      workloadMap[item._id.toString()] = {
        count: item.activeTasks,
        tasks: item.tasks,
      };
    });

    const employeeWorkloads = allEmployees.map((emp) => {
      const activeData = workloadMap[emp._id.toString()] || { count: 0, tasks: [] };
      const activeCount = activeData.count;
      const capacityPercent = Math.min(100, Math.round((activeCount / 3) * 100));

      return {
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        status: emp.status,
        activeTasksCount: activeCount,
        maxCapacity: 3,
        capacityRemaining: Math.max(0, 3 - activeCount),
        capacityPercent,
        isAtCapacity: activeCount >= 3,
        tasks: activeData.tasks,
      };
    });

    // 4. Department Breakdown
    const departmentStats = await Promise.all(
      DEPARTMENTS.map(async (dept) => {
        const [empCount, tasksCount, activeCount, completedCount, overdueCount] = await Promise.all([
          Employee.countDocuments({ department: dept }),
          Task.countDocuments({ department: dept }),
          Task.countDocuments({ department: dept, status: { $in: ['Todo', 'In Progress'] } }),
          Task.countDocuments({ department: dept, status: 'Completed' }),
          Task.countDocuments({
            department: dept,
            status: { $nin: ['Completed', 'Cancelled'] },
            dueDate: { $lt: now },
          }),
        ]);

        return {
          department: dept,
          employeeCount: empCount,
          totalTasks: tasksCount,
          activeTasks: activeCount,
          completedTasks: completedCount,
          overdueTasks: overdueCount,
        };
      })
    );

    // 5. Urgent or Overdue Tasks (Limit 5 for quick actions widget)
    const urgentOrOverdue = await Task.find({
      status: { $nin: ['Completed', 'Cancelled'] },
      $or: [{ dueDate: { $lt: now } }, { priority: 'Urgent' }],
    })
      .populate('assignedEmployee')
      .sort({ dueDate: 1 })
      .limit(6)
      .lean();

    res.json({
      overview: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: inactiveEmployees,
          onLeave: onLeaveEmployees,
        },
        tasks: {
          total: totalTasks,
          active: activeTasksTotal,
          todo: todoTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          cancelled: cancelledTasks,
          overdue: overdueTasksCount,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      },
      employeeWorkloads,
      departmentStats,
      attentionTasks: urgentOrOverdue.map(enrichTask),
    });
  } catch (error) {
    next(error);
  }
};
