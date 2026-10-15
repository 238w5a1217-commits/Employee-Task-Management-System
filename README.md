<p align="center">
  <img src="public/logo.png" width="160" alt="Roots Media Marketing" />
</p>

# Roots Media Marketing — Employee & Task Management System
**MERN Stack Developer Technical Assessment**

An enterprise-grade, single-repository Employee & Task Management System built with **React**, **Node.js**, **Express**, and **MongoDB (Mongoose)**. The backend strictly enforces all business rules, lifecycle transition integrity, workload limits, and leave schedules, while the frontend offers a responsive, aesthetic executive dashboard with synchronized URL query state.

---

## 🚀 Key Features

### 1. Strict Back-End Business Rules
- **Business Departments**: `Development`, `Design`, `QA`, `HR`, `Sales`.
- **Assignment Rules**:
  - Tasks can be assigned only to **Active** employees.
  - **Inactive** employees: Always rejected with `400 Bad Request`.
  - **On Leave** employees: Rejected *only* if the task's `startDate` falls inside the employee's leave window (`leaveStartDate <= task.startDate <= leaveEndDate`, inclusive).
- **Date Verification**:
  - `dueDate` cannot be earlier than `startDate` (`dueDate >= startDate`).
- **Status Lifecycle Flow**:
  - `Todo` → `In Progress` → `Completed`
  - `Todo` / `In Progress` → `Cancelled`
  - Any other transition is rejected with `400 Bad Request`.
  - New tasks always start in `Todo` status.
  - Status is changed **only** through the dedicated `PUT /api/tasks/:id/status` endpoint.
  - `Completed` and `Cancelled` tasks cannot be modified via `PUT /api/tasks/:id`.
- **Completed Date Integrity**:
  - `completedDate` is stamped by the backend server when a task transitions to `Completed`. It is never accepted from client input.
- **Workload Capacity**:
  - One employee can hold at most **3 active tasks** (`Todo` + `In Progress`) at any time.
- **Overdue Detection**:
  - Computed consistently across all endpoints: `now > dueDate` AND `status` is neither `Completed` nor `Cancelled`.
  - Filterable (`isOverdue=true`), displayed with glowing warning badges and urgency countdowns.
- **Employee Deletion Safety**:
  - Employees with `Todo` or `In Progress` tasks **cannot be deleted** (returns `400 Bad Request`).
  - When an employee with historical completed tasks is deleted, their information is permanently preserved on the tasks via an embedded `assignedEmployeeSnapshot` schema.

### 2. Modern Front-End Experience
- **Unified Single Folder Architecture**: Both Express server and Vite React app live seamlessly in a single folder.
- **URL-Driven State**: Search queries, department filters, priority filters, status filters, overdue flags, sort options, and page numbers persist in URL query parameters (e.g. `/tasks?status=In%20Progress&priority=High&page=2`). Refreshes and shared URLs reproduce the exact view.
- **Smart Status Modal**: Displays only valid next transitions based on current status.
- **Capacity Gauges**: Dynamic workload bars displaying `0/3`, `1/3`, `2/3`, or `3/3 (Full Capacity)`.
- **Export to CSV**: Streams all tasks matching current filters directly into CSV format.
- **Friendly Notifications**: Toast notification system for server validation errors, conflicts, and success messages.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, React Router v7, Lucide Icons, Vite 6, Custom Modern CSS System (Plus Jakarta Sans, Glassmorphism, Micro-animations).
- **Backend**: Node.js 22, Express 4, Mongoose 8 (MongoDB Atlas), Cors, Dotenv, Morgan.
- **Database**: MongoDB Atlas Replica Set.

---

## 📁 Project Structure

```text
employee-task/
├── server.js                 # Server entrypoint (delegates to src/server/server.js)
├── index.html                # Vite HTML entry
├── vite.config.js            # Vite configuration with /api reverse proxy
├── package.json              # Unified dependencies & npm scripts
├── .env                      # Environment configurations
├── .env.example              # Environment variables template
├── dist/                     # Production bundle (generated on npm run build)
├── src/                      # Complete Application Codebase
│   ├── server/               # BACKEND SYSTEM (Consolidated inside src/)
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & DNS resolver
│   │   ├── controllers/
│   │   │   ├── employeeController.js # Employee CRUD, workload, deletion logic
│   │   │   ├── taskController.js     # Task CRUD, status lifecycle, capacity, CSV
│   │   │   └── dashboardController.js# Workload analytics & department breakdown
│   │   ├── middleware/
│   │   │   └── errorHandler.js       # Centralized error handler (400, 404, 409, 500)
│   │   ├── models/
│   │   │   ├── Employee.js           # Employee Schema, department enum, leave checks
│   │   │   └── Task.js               # Task Schema, overdue virtual, snapshot schema
│   │   ├── routes/
│   │   │   ├── employeeRoutes.js     # /api/employees routes
│   │   │   ├── taskRoutes.js         # /api/tasks routes & status update API
│   │   │   └── dashboardRoutes.js    # /api/dashboard route
│   │   └── server.js                 # Express server & API routes
│   │
│   ├── components/           # REUSABLE FRONTEND COMPONENTS
│   │   ├── Navbar.jsx        # Fully responsive brand header with mobile drawer
│   │   ├── Badge.jsx         # Status, priority, department, and overdue badges
│   │   ├── WorkloadBar.jsx   # 0 to 3 capacity meter bar
│   │   ├── Pagination.jsx    # Pagination with per-page limit selector
│   │   ├── StatusModal.jsx   # State machine modal enforcing allowed transitions
│   │   ├── ConfirmModal.jsx  # Reusable confirmation modal for deletions
│   │   ├── Skeleton.jsx      # Shimmer loading placeholders
│   │   └── EmptyState.jsx    # Clean empty states
│   ├── context/
│   │   └── NotificationContext.jsx # Toast notification alert system
│   ├── pages/                # APPLICATION SCREENS
│   │   ├── Dashboard.jsx     # Executive dashboard, workload & overdue alerts
│   │   ├── EmployeeList.jsx  # Employee table with URL query sync & capacity
│   │   ├── EmployeeForm.jsx  # Add/Edit employee with dynamic leave validation
│   │   ├── EmployeeDetails.jsx# Creative profile, workload gauge, task history
│   │   ├── TaskList.jsx      # Task management, URL filter sync, CSV download
│   │   ├── TaskForm.jsx      # Add/Edit task with employee capacity dropdown
│   │   └── TaskDetails.jsx   # Visual lifecycle pipeline & status transition controls
│   ├── services/
│   │   └── api.js            # Axios client with centralized /api endpoints
│   ├── App.jsx               # Route definitions and responsive layout
│   ├── index.css             # Comprehensive modern mobile-first CSS design system
│   └── main.jsx              # React DOM root entry
└── README.md                 # System documentation & technical interview answers
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+ or v22+)
- NPM (v9+)
- MongoDB Atlas cluster URI (configured in `.env`)

### 1. Clone & Install Dependencies
```bash
# Clone the repository or extract the zip
cd "employee task"

# Install all dependencies (frontend + backend unified)
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (matching `.env.example`):
```env
PORT=5000
MONGODB_URI=
NODE_ENV=development
```

### 3. Running the Application

#### Development Mode (Concurrent Server & Frontend)
Runs the backend API on port 5000 and the Vite hot-reloading dev server on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production Build & Unified Server
Builds the React frontend and serves both API and frontend on port 5000:
```bash
npm run build
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 📡 REST API Overview

### Employee Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/employees` | List employees with search, department & status filters, sorting, and pagination. Includes active workload counts. |
| `POST` | `/api/employees` | Register employee. Returns `409` for duplicate `employeeId` or `email`. |
| `GET` | `/api/employees/:id` | View employee profile, workload capacity gauge, active tasks, and history. |
| `PUT` | `/api/employees/:id` | Update profile details and leave schedules. |
| `DELETE` | `/api/employees/:id` | Delete employee. **Blocked (400)** if employee holds active tasks. Preserves snapshot on old tasks. |

### Task Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | List tasks with search (title/employee), department, priority, status, overdue filters, importance sorting, pagination. |
| `POST` | `/api/tasks` | Create task. Starts as `Todo`. Enforces capacity (max 3), active status, and leave range rules. |
| `GET` | `/api/tasks/export` | Export CSV of **all** tasks matching current active filters. |
| `GET` | `/api/tasks/:id` | View task details, pipeline tracker, assignee snapshot, and overdue status. |
| `PUT` | `/api/tasks/:id` | Edit task details. **Blocked (400)** for Completed/Cancelled tasks. Status cannot be changed here. |
| `PUT` | `/api/tasks/:id/status`| **Dedicated Status Update API**. Validates allowed transitions. Stamps `completedDate`. |
| `DELETE` | `/api/tasks/:id` | Delete task. |

### Dashboard Endpoint
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Returns server-calculated counts, overdue tasks, employee workload allocations, and department breakdowns. |

---

## 🧠 Database Schema & Relationships

### `Employee` Schema
- `employeeId`: String, Unique, Trimmed, Uppercase (e.g., `EMP001`).
- `name`: String, Required.
- `email`: String, Unique, Lowercase.
- `department`: Enum: `['Development', 'Design', 'QA', 'HR', 'Sales']`.
- `designation`: String.
- `phone`: String.
- `status`: Enum: `['Active', 'Inactive', 'On Leave']`.
- `leaveStartDate`, `leaveEndDate`: Dates (required if `status === 'On Leave'`).

### `Task` Schema
- `title`: String, Required.
- `description`: String.
- `department`: Enum: `['Development', 'Design', 'QA', 'HR', 'Sales']`.
- `priority`: Enum: `['Low', 'Medium', 'High', 'Urgent']`.
- `status`: Enum: `['Todo', 'In Progress', 'Completed', 'Cancelled']`. Default: `'Todo'`.
- `startDate`: Date, Required.
- `dueDate`: Date, Required (`dueDate >= startDate`).
- `completedDate`: Date (set automatically by server upon completion).
- `assignedEmployee`: ObjectId ref `Employee`.
- `assignedEmployeeSnapshot`: Embedded document storing `{ employeeDocId, employeeId, name, email, department, designation }`.
- `isOverdue` (Virtual): `now > dueDate && !['Completed', 'Cancelled'].includes(status)`.

### How Employee Deletion Is Handled
When an employee is deleted:
1. The backend first checks if the employee has any active tasks (`Todo` or `In Progress`). If `activeTasksCount > 0`, the deletion is **rejected with `400 Bad Request`**.
2. If the employee only has completed or cancelled tasks, the deletion proceeds.
3. Before deleting the document, the backend updates the task records so that `assignedEmployeeSnapshot` preserves the employee's name (e.g., `"Sarah Jenkins (Former)"`), ID, and department. Even after the employee document is removed, historical tasks and CSV exports remain fully readable without broken references.

---

## 📝 Answers to Technical Assessment Questions

### 1. Where do you validate status transitions and why?
**Answer**:
Status transitions are validated strictly on the **Back-End** in the dedicated `PUT /api/tasks/:id/status` controller (`controllers/taskController.js`).
- **Why**: Frontend dropdowns can be bypassed via direct API calls (e.g., Postman, curl, or malicious scripts). By isolating status updates to a dedicated endpoint and validating transitions against a state machine dictionary (`Todo → ['In Progress', 'Cancelled']`, `In Progress → ['Completed', 'Cancelled']`), we ensure data integrity and prevent illegal jumps (e.g. `Todo → Completed` skipping execution, or editing closed tasks).

### 2. Why does Completed Date come from the backend?
**Answer**:
`completedDate` is set automatically to `new Date()` by the server when the status changes to `Completed`.
- **Why**: Client machines have inconsistent clock times, different timezones, or can be manipulated by users to fake SLA completion times. Setting `completedDate` on the server guarantees authoritative, tamper-proof timestamps for compliance and performance auditing.

### 3. How do you block inactive / on-leave assignment?
**Answer**:
In `controllers/taskController.js`, the helper `validateEmployeeAssignment` is executed prior to creating or reassigning a task:
- If `employee.status === 'Inactive'`, it rejects with `400 Bad Request: "Cannot assign task to an inactive employee."`
- If `employee.status === 'On Leave'`, the function normalizes the task's `startDate` and the employee's `leaveStartDate` / `leaveEndDate` to start-of-day (00:00:00) and end-of-day (23:59:59). If `leaveStart <= taskStart <= leaveEnd`, it returns `400 Bad Request`. If the task starts outside that leave window, assignment is permitted.

### 4. Why are filtering and pagination on the backend?
**Answer**:
- **Scalability & Performance**: In production systems with tens of thousands of tasks, fetching all records to the browser wastes bandwidth, exhausts device memory, and creates severe browser lag.
- **Accuracy**: Server-side filtering and counting ensure that pagination metadata (total matching records, total pages) and workload metrics are computed accurately across the entire database, not just the currently loaded slice.

### 5. Why do filters live in the URL?
**Answer**:
Storing filters, search queries, sort criteria, and page numbers in URL search parameters (`/tasks?status=In%20Progress&priority=High&page=2`):
- **Deep Linking & Sharing**: Enables team members to share exact filtered views with one another via URL.
- **Browser Navigation**: Supports browser Back/Forward navigation naturally without resetting state.
- **State Persistence**: Refreshing the page preserves the user's active filter workspace rather than clearing it back to default.

### 6. What can go wrong if two requests assign a 4th active task at the same time?
**Answer**:
**Race Condition (Check-Then-Act)**:
If two concurrent requests arrive simultaneously for an employee currently holding 2 active tasks:
1. Request A counts active tasks and reads `2`.
2. Request B counts active tasks and reads `2`.
3. Both requests see `count < 3` and proceed to create the task.
4. Both tasks are saved, resulting in the employee holding **4 active tasks**, violating the business capacity rule.

**How to solve it in production**:
1. **MongoDB Multi-Document ACID Transactions**: Wrap the check and task insertion in a transaction with a read-write lock or snapshot isolation.
2. **Atomic Counter with Optimistic Locking**: Maintain an `activeTasksCount` field directly on the `Employee` document, and perform an atomic update:
   ```javascript
   Employee.findOneAndUpdate(
     { _id: employeeId, status: 'Active', activeTasksCount: { $lt: 3 } },
     { $inc: { activeTasksCount: 1 } }
   );
   ```
   If no document matches, the capacity has been exceeded and the second request fails atomically.

---

## 📦 Deployment Instructions

### Deploying to Render / Railway / Heroku
1. Push this repository to GitHub.
2. Connect the repository in [Render](https://render.com).
3. Set the build command:
   ```bash
   npm install && npm run build
   ```
4. Set the start command:
   ```bash
   npm start
   ```
5. Add the environment variable:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `PORT`: `5000` (or host provided).
   - `NODE_ENV`: `production`.

---
*Created for Roots Media Marketing Technical Assignment by MERN Stack Candidate.*
