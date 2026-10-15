import mongoose from 'mongoose';
import { DEPARTMENTS } from './Employee.js';

export const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: '{VALUE} is not a valid department',
      },
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: TASK_PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: TASK_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'Todo',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedDate: {
      type: Date,
      default: null,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Assigned employee is required'],
    },
    // Snapshot of employee details at time of assignment or update.
    // Preserves employee info on old tasks even if employee is deleted later.
    assignedEmployeeSnapshot: {
      employeeDocId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      employeeId: { type: String, default: '' },
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      department: { type: String, default: '' },
      designation: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for overdue calculation
// Today is later than Due Date AND status is not Completed or Cancelled
taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Completed' || this.status === 'Cancelled') {
    return false;
  }
  if (!this.dueDate) return false;

  const now = new Date();
  const due = new Date(this.dueDate);
  // Compare end of due date or exact date
  return now > due;
});

// Pre-validate hook for date check: Due date cannot be earlier than start date
taskSchema.pre('validate', function (next) {
  if (this.startDate && this.dueDate) {
    const start = new Date(this.startDate);
    const due = new Date(this.dueDate);
    if (due < start) {
      this.invalidate('dueDate', 'Due date cannot be earlier than start date');
    }
  }
  next();
});

// Compound and Single Indexes for optimized query execution
taskSchema.index({ assignedEmployee: 1, status: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ department: 1, status: 1 });
taskSchema.index({ 'assignedEmployeeSnapshot.employeeDocId': 1 });


const Task = mongoose.model('Task', taskSchema);

export default Task;
