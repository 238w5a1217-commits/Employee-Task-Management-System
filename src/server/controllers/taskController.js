import Task, { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';
import Employee, { DEPARTMENTS } from '../models/Employee.js';

/**
 * Helper: Validate Employee assignment and capacity rules
 */
export const validateEmployeeAssignment = async (employeeId, taskStartDate, currentTaskId = null) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return { valid: false, status: 404, message: 'Assigned employee not found' };
  }

  // Business Rule: Inactive employee: always rejected
  if (employee.status === 'Inactive') {
    return {
      valid: false,
      status: 400,
      message: `Cannot assign task to employee "${employee.name}" because their status is Inactive. Tasks can be given only to an Active employee.`,
    };
  }

  // Business Rule: On Leave employee: rejected only if the task's Start Date falls inside the leave period (both dates inclusive)
  if (employee.status === 'On Leave') {
    if (employee.leaveStartDate && employee.leaveEndDate && taskStartDate) {
      const taskStart = new Date(taskStartDate);
      taskStart.setHours(0, 0, 0, 0);

      const leaveStart = new Date(employee.leaveStartDate);
      leaveStart.setHours(0, 0, 0, 0);

      const leaveEnd = new Date(employee.leaveEndDate);
      leaveEnd.setHours(23, 59, 59, 999);

      if (taskStart >= leaveStart && taskStart <= leaveEnd) {
        const fmtStart = new Date(employee.leaveStartDate).toLocaleDateString();
        const fmtEnd = new Date(employee.leaveEndDate).toLocaleDateString();
        return {
          valid: false,
          status: 400,
          message: `Cannot assign task to "${employee.name}". The task start date (${taskStart.toLocaleDateString()}) falls within their leave period (${fmtStart} to ${fmtEnd}).`,
        };
      }
    }
  }

  // Business Rule: Capacity: one employee can hold at most 3 active tasks (Todo + In Progress) at a time
  const activeTasksQuery = {
    assignedEmployee: employee._id,
    status: { $in: ['Todo', 'In Progress'] },
  };

  if (currentTaskId) {
    activeTasksQuery._id = { $ne: currentTaskId };
  }

  const activeCount = await Task.countDocuments(activeTasksQuery);
  if (activeCount >= 3) {
    return {
      valid: false,
      status: 400,
      message: `Employee "${employee.name}" already has ${activeCount} active tasks (Todo / In Progress). Maximum capacity is 3 active tasks.`,
    };
  }

  return { valid: true, employee };
};

/**
 * Helper to compute overdue and snapshot for task response
 */
export const enrichTask = (task) => {
  const now = new Date();
  const isOverdue =
    task.status !== 'Completed' &&
    task.status !== 'Cancelled' &&
    task.dueDate &&
    new Date(task.dueDate) < now;

  // Resolve employee info (fallback to snapshot if employee was deleted)
  const employeeInfo = task.assignedEmployee || {
    _id: task.assignedEmployeeSnapshot?.employeeDocId || null,
    employeeId: task.assignedEmployeeSnapshot?.employeeId || 'N/A',
    name: task.assignedEmployeeSnapshot?.name || 'Unassigned / Former Employee',
    email: task.assignedEmployeeSnapshot?.email || '',
    department: task.assignedEmployeeSnapshot?.department || task.department,
    designation: task.assignedEmployeeSnapshot?.designation || '',
  };

  return {
    ...task,
    isOverdue,
    assignedEmployee: employeeInfo,
  };
};

/**
 * GET /api/tasks
 * Fetch tasks with server-side search, filtering, priority sorting, and pagination
 */
export const getTasks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const {
      search,
      department,
      priority,
      status,
      assignedEmployee,
      isOverdue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Filter by department
    if (department && department !== 'All') {
      if (!DEPARTMENTS.includes(department)) {
        return res.status(400).json({ error: `Invalid department: ${department}` });
      }
      query.department = department;
    }

    // Filter by priority
    if (priority && priority !== 'All') {
      if (!TASK_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `Invalid priority: ${priority}` });
      }
      query.priority = priority;
    }

    // Filter by status
    if (status && status !== 'All') {
      if (!TASK_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status: ${status}` });
      }
      query.status = status;
    }

    // Filter by assigned employee
    if (assignedEmployee && assignedEmployee !== 'All') {
      query.$or = [
        { assignedEmployee },
        { 'assignedEmployeeSnapshot.employeeDocId': assignedEmployee },
      ];
    }

    // Filter by overdue
    const now = new Date();
    if (isOverdue === 'true') {
      query.status = { $nin: ['Completed', 'Cancelled'] };
      query.dueDate = { $lt: now };
    } else if (isOverdue === 'false') {
      // Either completed/cancelled OR dueDate >= now
      query.$or = [
        { status: { $in: ['Completed', 'Cancelled'] } },
        { dueDate: { $gte: now } },
      ];
    }

    // Search by task title or assigned employee name
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      // Find employees whose names match the search
      const matchingEmployees = await Employee.find({ name: searchRegex }).select('_id');
      const matchingEmpIds = matchingEmployees.map((e) => e._id);

      const searchConditions = [
        { title: searchRegex },
        { 'assignedEmployeeSnapshot.name': searchRegex },
      ];

      if (matchingEmpIds.length > 0) {
        searchConditions.push({ assignedEmployee: { $in: matchingEmpIds } });
      }

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // Priority importance order: Urgent (4), High (3), Medium (2), Low (1)
    let tasks;
    let total = 0;

    if (sortBy === 'priority') {
      const priorityDirection = sortOrder === 'asc' ? 1 : -1;
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            priorityWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Urgent'] }, then: 4 },
                  { case: { $eq: ['$priority', 'High'] }, then: 3 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'Low'] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { priorityWeight: priorityDirection, createdAt: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $lookup: {
                  from: 'employees',
                  localField: 'assignedEmployee',
                  foreignField: '_id',
                  as: 'assignedEmployee',
                },
              },
              {
                $unwind: {
                  path: '$assignedEmployee',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
          },
        },
      ];

      const aggResult = await Task.aggregate(pipeline);
      total = aggResult[0]?.metadata[0]?.total || 0;
      tasks = aggResult[0]?.data || [];
    } else {
      const allowedSortFields = ['createdAt', 'dueDate', 'title', 'startDate'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      total = await Task.countDocuments(query);
      tasks = await Task.find(query)
        .populate('assignedEmployee')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    const enrichedTasks = tasks.map(enrichTask);

    res.json({
      tasks: enrichedTasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/:id
 * Get single task details
 */
export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('assignedEmployee').lean();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: enrichTask(task) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks
 * Business Rules:
 * - New tasks start as Todo
 * - Assignment only to Active employee (inactive rejected, on leave rejected if startDate in leave range)
 * - Capacity: employee can hold at most 3 active tasks
 * - Due date cannot be earlier than start date
 * - Completed date is never taken from frontend
 */
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      department,
      priority,
      startDate,
      dueDate,
      assignedEmployee,
    } = req.body;

    // Validate dates
    if (!startDate || !dueDate) {
      return res.status(400).json({ error: 'Both start date and due date are required' });
    }

    const start = new Date(startDate);
    const due = new Date(dueDate);
    if (due < start) {
      return res.status(400).json({ error: 'Due date cannot be earlier than start date' });
    }

    // Validate employee assignment & capacity
    const assignmentValidation = await validateEmployeeAssignment(assignedEmployee, startDate);
    if (!assignmentValidation.valid) {
      return res.status(assignmentValidation.status).json({ error: assignmentValidation.message });
    }

    const employee = assignmentValidation.employee;

    // Build task document - new tasks start as Todo, completedDate is null
    const task = new Task({
      title,
      description,
      department: department || employee.department,
      priority: priority || 'Medium',
      status: 'Todo',
      startDate,
      dueDate,
      completedDate: null,
      assignedEmployee: employee._id,
      assignedEmployeeSnapshot: {
        employeeDocId: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
      },
    });

    await task.save();
    const populated = await Task.findById(task._id).populate('assignedEmployee').lean();

    res.status(201).json({
      message: 'Task created successfully in "Todo" status',
      task: enrichTask(populated),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    next(error);
  }
};

/**
 * PUT /api/tasks/:id
 * Edit task details (title, description, priority, dates, assigned employee)
 * Business Rules:
 * - Completed and Cancelled tasks CANNOT be edited
 * - Status CANNOT be changed through this endpoint (use PUT /api/tasks/:id/status)
 * - Completed Date is never taken from frontend
 * - Due Date cannot be earlier than Start Date
 * - Capacity & Assignment rules verified if employee or startDate changes
 */
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Business Rule: Completed and Cancelled tasks cannot be edited
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      return res.status(400).json({
        error: `Task cannot be edited because its current status is "${task.status}". Completed and Cancelled tasks are permanently locked from modifications.`,
      });
    }

    const {
      title,
      description,
      department,
      priority,
      startDate,
      dueDate,
      assignedEmployee,
    } = req.body;

    const newStart = startDate ? new Date(startDate) : new Date(task.startDate);
    const newDue = dueDate ? new Date(dueDate) : new Date(task.dueDate);

    // Business Rule: Due date cannot be earlier than start date
    if (newDue < newStart) {
      return res.status(400).json({ error: 'Due date cannot be earlier than start date' });
    }

    // Check employee assignment and capacity rules if employee or startDate changed
    const targetEmployeeId = assignedEmployee || task.assignedEmployee;
    const isEmployeeOrDateChanged =
      (assignedEmployee && assignedEmployee.toString() !== task.assignedEmployee?.toString()) ||
      (startDate && new Date(startDate).getTime() !== new Date(task.startDate).getTime());

    if (isEmployeeOrDateChanged) {
      const validation = await validateEmployeeAssignment(targetEmployeeId, newStart, task._id);
      if (!validation.valid) {
        return res.status(validation.status).json({ error: validation.message });
      }

      const emp = validation.employee;
      task.assignedEmployee = emp._id;
      task.assignedEmployeeSnapshot = {
        employeeDocId: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
      };
    }

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (department) task.department = department;
    if (priority) task.priority = priority;
    if (startDate) task.startDate = startDate;
    if (dueDate) task.dueDate = dueDate;

    // Completed Date and Status are NOT editable here
    await task.save();

    const populated = await Task.findById(task._id).populate('assignedEmployee').lean();
    res.json({
      message: 'Task updated successfully',
      task: enrichTask(populated),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    next(error);
  }
};

/**
 * PUT /api/tasks/:id/status
 * Dedicated Status Update API
 * Business Rules:
 * - Status flow:
 *   - Todo → In Progress
 *   - Todo → Cancelled
 *   - In Progress → Completed
 *   - In Progress → Cancelled
 * - Any other transition is rejected!
 * - Completed Date is set by backend when task becomes Completed, never taken from frontend.
 * - Completed and Cancelled tasks cannot be edited.
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body;

    if (!nextStatus) {
      return res.status(400).json({ error: 'New status is required' });
    }

    if (!TASK_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        error: `Invalid status "${nextStatus}". Allowed values: ${TASK_STATUSES.join(', ')}`,
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentStatus = task.status;

    // Check if task is already finalized
    if (currentStatus === 'Completed' || currentStatus === 'Cancelled') {
      return res.status(400).json({
        error: `Cannot change status of a "${currentStatus}" task. Completed and Cancelled tasks are finalized.`,
      });
    }

    // Allowed transition map:
    // Todo -> In Progress, Cancelled
    // In Progress -> Completed, Cancelled
    const allowedTransitions = {
      Todo: ['In Progress', 'Cancelled'],
      'In Progress': ['Completed', 'Cancelled'],
    };

    const validNextStatuses = allowedTransitions[currentStatus] || [];

    if (!validNextStatuses.includes(nextStatus)) {
      return res.status(400).json({
        error: `Invalid status transition from "${currentStatus}" to "${nextStatus}". Allowed next statuses: ${validNextStatuses.join(', ')}.`,
      });
    }

    // Apply valid transition
    task.status = nextStatus;

    // Business Rule: Completed Date is set by backend when task becomes Completed
    if (nextStatus === 'Completed') {
      task.completedDate = new Date();
    }

    await task.save();

    const populated = await Task.findById(task._id).populate('assignedEmployee').lean();
    res.json({
      message: `Task status updated from "${currentStatus}" to "${nextStatus}" successfully`,
      task: enrichTask(populated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.findByIdAndDelete(id);
    res.json({ message: `Task "${task.title}" deleted successfully` });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/export
 * Export CSV downloads all tasks matching current filters (not only the visible page)
 */
export const exportTasksCSV = async (req, res, next) => {
  try {
    const {
      search,
      department,
      priority,
      status,
      assignedEmployee,
      isOverdue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (department && department !== 'All') query.department = department;
    if (priority && priority !== 'All') query.priority = priority;
    if (status && status !== 'All') query.status = status;

    if (assignedEmployee && assignedEmployee !== 'All') {
      query.$or = [
        { assignedEmployee },
        { 'assignedEmployeeSnapshot.employeeDocId': assignedEmployee },
      ];
    }

    const now = new Date();
    if (isOverdue === 'true') {
      query.status = { $nin: ['Completed', 'Cancelled'] };
      query.dueDate = { $lt: now };
    } else if (isOverdue === 'false') {
      query.$or = [
        { status: { $in: ['Completed', 'Cancelled'] } },
        { dueDate: { $gte: now } },
      ];
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingEmployees = await Employee.find({ name: searchRegex }).select('_id');
      const matchingEmpIds = matchingEmployees.map((e) => e._id);

      const searchConditions = [
        { title: searchRegex },
        { 'assignedEmployeeSnapshot.name': searchRegex },
      ];

      if (matchingEmpIds.length > 0) {
        searchConditions.push({ assignedEmployee: { $in: matchingEmpIds } });
      }

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const allowedSortFields = ['createdAt', 'dueDate', 'title', 'startDate'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Fetch ALL matching tasks without pagination limit
    const tasks = await Task.find(query)
      .populate('assignedEmployee')
      .sort({ [sortField]: sortDirection })
      .lean();

    const enrichedTasks = tasks.map(enrichTask);

    // Build CSV
    const csvRows = [];
    const headers = [
      'Task ID',
      'Title',
      'Department',
      'Priority',
      'Status',
      'Is Overdue',
      'Start Date',
      'Due Date',
      'Completed Date',
      'Employee ID',
      'Employee Name',
      'Employee Email',
    ];
    csvRows.push(headers.join(','));

    enrichedTasks.forEach((t) => {
      const escape = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const fmtDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

      const row = [
        escape(t._id),
        escape(t.title),
        escape(t.department),
        escape(t.priority),
        escape(t.status),
        escape(t.isOverdue ? 'YES' : 'NO'),
        escape(fmtDate(t.startDate)),
        escape(fmtDate(t.dueDate)),
        escape(fmtDate(t.completedDate)),
        escape(t.assignedEmployee?.employeeId || ''),
        escape(t.assignedEmployee?.name || ''),
        escape(t.assignedEmployee?.email || ''),
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\r\n');
    const filename = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
