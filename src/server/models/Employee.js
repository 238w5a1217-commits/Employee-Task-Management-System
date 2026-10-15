import mongoose from 'mongoose';

export const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave'];

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Employee email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: '{VALUE} is not a valid department. Must be Development, Design, QA, HR, or Sales',
      },
    },
    designation: {
      type: String,
      trim: true,
      default: 'Specialist',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: EMPLOYEE_STATUSES,
        message: '{VALUE} is not a valid employee status',
      },
      default: 'Active',
    },
    leaveStartDate: {
      type: Date,
      default: null,
    },
    leaveEndDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for checking if currently on leave today
employeeSchema.virtual('isOnLeaveCurrently').get(function () {
  if (this.status !== 'On Leave' || !this.leaveStartDate || !this.leaveEndDate) {
    return false;
  }
  const now = new Date();
  const start = new Date(this.leaveStartDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(this.leaveEndDate);
  end.setHours(23, 59, 59, 999);
  return now >= start && now <= end;
});

// Validation hook for Leave dates
employeeSchema.pre('validate', function (next) {
  if (this.status === 'On Leave') {
    if (!this.leaveStartDate || !this.leaveEndDate) {
      this.invalidate('leaveStartDate', 'Both leave start date and leave end date are required when status is On Leave');
    } else if (new Date(this.leaveEndDate) < new Date(this.leaveStartDate)) {
      this.invalidate('leaveEndDate', 'Leave end date cannot be earlier than leave start date');
    }
  } else {
    // Clear leave dates if status is not On Leave
    this.leaveStartDate = null;
    this.leaveEndDate = null;
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
