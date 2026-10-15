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

    // Run parallel aggregated queries instead of 35 separate roundtrips
    const [
      allEmployees,
      taskStatsResult,
      deptTasksResult,
      activeTasksAggregation,
      urgentOrOverdue,
    ] = await Promise.all([
      Employee.find().sort({ name: 1 }).lean(),
      Task.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            todo: { $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Todo', 'In Progress']] },
                      { $lt: ['$dueDate', now] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Task.aggregate([
        {
          $group: {
            _id: '$department',
            totalTasks: { $sum: 1 },
            activeTasks: {
              $sum: { $cond: [{ $in: ['$status', ['Todo', 'In Progress']] }, 1, 0] },
            },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
            },
            overdueTasks: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Todo', 'In Progress']] },
                      { $lt: ['$dueDate', now] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Task.aggregate([
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
      ]),
      Task.find({
        status: { $nin: ['Completed', 'Cancelled'] },
        $or: [{ dueDate: { $lt: now } }, { priority: 'Urgent' }],
      })
        .populate('assignedEmployee')
        .sort({ dueDate: 1 })
        .limit(6)
        .lean(),
    ]);

    // 1. Employee Statistics (computed in-memory from allEmployees)
    const totalEmployees = allEmployees.length;
    let activeEmployees = 0;
    let inactiveEmployees = 0;
    let onLeaveEmployees = 0;

    for (let i = 0; i < allEmployees.length; i++) {
      const st = allEmployees[i].status;
      if (st === 'Active') activeEmployees++;
      else if (st === 'Inactive') inactiveEmployees++;
      else if (st === 'On Leave') onLeaveEmployees++;
    }

    // 2. Task Statistics
    const taskStats = taskStatsResult[0] || {};
    const totalTasks = taskStats.total || 0;
    const todoTasks = taskStats.todo || 0;
    const inProgressTasks = taskStats.inProgress || 0;
    const completedTasks = taskStats.completed || 0;
    const cancelledTasks = taskStats.cancelled || 0;
    const overdueTasksCount = taskStats.overdue || 0;
    const activeTasksTotal = todoTasks + inProgressTasks;

    // 3. Employee Workloads
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

    // 4. Department Breakdown (computed from aggregated deptTasksResult & allEmployees)
    const deptTaskMap = {};
    deptTasksResult.forEach((d) => {
      if (d._id) {
        deptTaskMap[d._id] = d;
      }
    });

    const departmentStats = DEPARTMENTS.map((dept) => {
      const empCount = allEmployees.filter((e) => e.department === dept).length;
      const dData = deptTaskMap[dept] || {};
      return {
        department: dept,
        employeeCount: empCount,
        totalTasks: dData.totalTasks || 0,
        activeTasks: dData.activeTasks || 0,
        completedTasks: dData.completedTasks || 0,
        overdueTasks: dData.overdueTasks || 0,
      };
    });

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
