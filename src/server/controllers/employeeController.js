import Employee, { DEPARTMENTS, EMPLOYEE_STATUSES } from '../models/Employee.js';
import Task from '../models/Task.js';

/**
 * GET /api/employees
 * List employees with search, department filter, status filter, sorting, and pagination
 * Also returns active task counts for workload visualization
 */
export const getEmployees = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, department, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    // Search by name, employeeId, or email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { employeeId: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by department
    if (department && department !== 'All') {
      if (!DEPARTMENTS.includes(department)) {
        return res.status(400).json({ error: `Invalid department: ${department}` });
      }
      query.department = department;
    }

    // Filter by status
    if (status && status !== 'All') {
      if (!EMPLOYEE_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status: ${status}` });
      }
      query.status = status;
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'name', 'employeeId', 'department', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach workload counts (active tasks = Todo + In Progress) for each employee
    const employeeIds = employees.map((emp) => emp._id);
    const activeTasksAggregation = await Task.aggregate([
      {
        $match: {
          assignedEmployee: { $in: employeeIds },
          status: { $in: ['Todo', 'In Progress'] },
        },
      },
      {
        $group: {
          _id: '$assignedEmployee',
          activeCount: { $sum: 1 },
        },
      },
    ]);

    const activeMap = {};
    activeTasksAggregation.forEach((item) => {
      activeMap[item._id.toString()] = item.activeCount;
    });

    const employeesWithWorkload = employees.map((emp) => {
      const activeCount = activeMap[emp._id.toString()] || 0;
      return {
        ...emp,
        activeTasksCount: activeCount,
        maxCapacity: 3,
        capacityRemaining: Math.max(0, 3 - activeCount),
        isAtCapacity: activeCount >= 3,
      };
    });

    res.json({
      employees: employeesWithWorkload,
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
 * GET /api/employees/:id
 * Get single employee details with their tasks and statistics
 */
export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id).lean();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Fetch all tasks associated with this employee
    const tasks = await Task.find({
      $or: [
        { assignedEmployee: id },
        { 'assignedEmployeeSnapshot.employeeDocId': id },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Compute task stats
    const now = new Date();
    let todoCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let overdueCount = 0;

    const enrichedTasks = tasks.map((t) => {
      const isOverdue =
        t.status !== 'Completed' &&
        t.status !== 'Cancelled' &&
        new Date(t.dueDate) < now;

      if (t.status === 'Todo') todoCount++;
      if (t.status === 'In Progress') inProgressCount++;
      if (t.status === 'Completed') completedCount++;
      if (t.status === 'Cancelled') cancelledCount++;
      if (isOverdue) overdueCount++;

      return {
        ...t,
        isOverdue,
      };
    });

    const activeTasksCount = todoCount + inProgressCount;

    res.json({
      employee: {
        ...employee,
        activeTasksCount,
        maxCapacity: 3,
        capacityRemaining: Math.max(0, 3 - activeTasksCount),
        isAtCapacity: activeTasksCount >= 3,
      },
      tasks: enrichedTasks,
      stats: {
        totalTasks: tasks.length,
        activeTasksCount,
        todoCount,
        inProgressCount,
        completedCount,
        cancelledCount,
        overdueCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/employees
 * Create a new employee with duplicate checks (409) and validation
 */
export const createEmployee = async (req, res, next) => {
  try {
    const { employeeId, name, email, department, designation, phone, status, leaveStartDate, leaveEndDate } = req.body;

    // Check duplicate employeeId
    const existingId = await Employee.findOne({ employeeId: employeeId?.trim()?.toUpperCase() });
    if (existingId) {
      return res.status(409).json({ error: `Employee ID "${employeeId}" already exists` });
    }

    // Check duplicate email
    const existingEmail = await Employee.findOne({ email: email?.trim()?.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: `Email address "${email}" is already registered` });
    }

    const employee = new Employee({
      employeeId,
      name,
      email,
      department,
      designation,
      phone,
      status: status || 'Active',
      leaveStartDate: status === 'On Leave' ? leaveStartDate : null,
      leaveEndDate: status === 'On Leave' ? leaveEndDate : null,
    });

    await employee.save();
    res.status(201).json({
      message: 'Employee created successfully',
      employee,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Field';
      return res.status(409).json({ error: `Duplicate value for ${field}` });
    }
    next(error);
  }
};

/**
 * PUT /api/employees/:id
 * Update an existing employee with duplicate checks and validation
 */
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { employeeId, name, email, department, designation, phone, status, leaveStartDate, leaveEndDate } = req.body;

    // Check duplicate employeeId against other documents
    if (employeeId && employeeId.trim().toUpperCase() !== employee.employeeId) {
      const existingId = await Employee.findOne({
        _id: { $ne: id },
        employeeId: employeeId.trim().toUpperCase(),
      });
      if (existingId) {
        return res.status(409).json({ error: `Employee ID "${employeeId}" already exists` });
      }
      employee.employeeId = employeeId.trim().toUpperCase();
    }

    // Check duplicate email against other documents
    if (email && email.trim().toLowerCase() !== employee.email) {
      const existingEmail = await Employee.findOne({
        _id: { $ne: id },
        email: email.trim().toLowerCase(),
      });
      if (existingEmail) {
        return res.status(409).json({ error: `Email address "${email}" is already registered` });
      }
      employee.email = email.trim().toLowerCase();
    }

    if (name) employee.name = name.trim();
    if (department) employee.department = department;
    if (designation !== undefined) employee.designation = designation;
    if (phone !== undefined) employee.phone = phone;

    if (status) {
      employee.status = status;
      if (status === 'On Leave') {
        employee.leaveStartDate = leaveStartDate;
        employee.leaveEndDate = leaveEndDate;
      } else {
        employee.leaveStartDate = null;
        employee.leaveEndDate = null;
      }
    }

    await employee.save();

    // Also update snapshot info on active tasks to keep details current
    await Task.updateMany(
      { assignedEmployee: employee._id },
      {
        $set: {
          'assignedEmployeeSnapshot.employeeId': employee.employeeId,
          'assignedEmployeeSnapshot.name': employee.name,
          'assignedEmployeeSnapshot.email': employee.email,
          'assignedEmployeeSnapshot.department': employee.department,
          'assignedEmployeeSnapshot.designation': employee.designation,
        },
      }
    );

    res.json({
      message: 'Employee updated successfully',
      employee,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate field value violates unique constraint' });
    }
    next(error);
  }
};

/**
 * DELETE /api/employees/:id
 * Business Rule: Delete employee not allowed while employee has Todo / In Progress tasks!
 * Old tasks must still show meaningful employee details if employee is later deleted.
 */
export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check for active tasks (Todo or In Progress)
    const activeTasksCount = await Task.countDocuments({
      assignedEmployee: id,
      status: { $in: ['Todo', 'In Progress'] },
    });

    if (activeTasksCount > 0) {
      return res.status(400).json({
        error: `Cannot delete employee "${employee.name}". They currently have ${activeTasksCount} active task(s) (Todo / In Progress). Please reassign or complete these tasks first.`,
      });
    }

    // Preserve employee snapshot on any historical tasks (Completed or Cancelled)
    await Task.updateMany(
      { assignedEmployee: id },
      {
        $set: {
          'assignedEmployeeSnapshot.employeeDocId': employee._id,
          'assignedEmployeeSnapshot.employeeId': employee.employeeId,
          'assignedEmployeeSnapshot.name': `${employee.name} (Former)`,
          'assignedEmployeeSnapshot.email': employee.email,
          'assignedEmployeeSnapshot.department': employee.department,
          'assignedEmployeeSnapshot.designation': employee.designation,
        },
        $unset: { assignedEmployee: 1 },
      }
    );

    await Employee.findByIdAndDelete(id);

    res.json({
      message: `Employee "${employee.name}" deleted successfully. Historical task records have been preserved.`,
    });
  } catch (error) {
    next(error);
  }
};
