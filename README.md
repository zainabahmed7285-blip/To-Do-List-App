# ApexTasks &bull; Three-Tier To-Do List Web Application

A full-stack, three-tier To-Do list web application built with clean architectural boundaries between presentation, logic, and data persistence layers.

---

## 🏛️ Architecture Breakdown

This application strictly implements the **Three-Tier Architecture pattern**:

```
+-------------------------------------------------------------+
|                      1. PRESENTATION TIER                   |
|  - Modern Semantic HTML5                                    |
|  - Vanilla CSS3 (Glassmorphism, Dark Mode, Animations)     |
|  - Modular Vanilla JS (Event Controller & REST API Client)  |
+-------------------------------------------------------------+
                              ↕  HTTP / JSON REST API
+-------------------------------------------------------------+
|                     2. APPLICATION / LOGIC TIER             |
|  - Node.js & Express HTTP Server                            |
|  - RESTful Router (`/api/tasks`)                            |
|  - Task Controller (`taskController.js`)                    |
|  - Business Logic & Validation Service (`taskService.js`)    |
+-------------------------------------------------------------+
                              ↕  Data Access Layer (Repository Pattern)
+-------------------------------------------------------------+
|                         3. DATA TIER                        |
|  - Task Repository (`taskRepository.js`)                    |
|  - Relational Database Engine (`data/db.js`)                |
|  - Persistent Atomic JSON Store (`data/database.json`)      |
+-------------------------------------------------------------+
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Run the following command in the project directory:
```bash
npm install
```

### 2. Run the Application
Start the application server:
```bash
npm start
```
Or run in development mode with automatic restart:
```bash
npm run dev
```

### 3. Open in Browser
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📡 REST API Documentation

All API endpoints return standard JSON responses formatted as:
```json
{
  "success": true,
  "data": ...
}
```

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | List tasks (supports `status`, `category`, `priority`, `search`, `sort`) |
| `GET` | `/api/tasks/stats` | Retrieve dashboard aggregate metrics |
| `POST` | `/api/tasks` | Create a new task (validates required fields) |
| `GET` | `/api/tasks/:id` | Fetch task details by unique ID |
| `PUT` | `/api/tasks/:id` | Update task details |
| `PATCH`| `/api/tasks/:id/toggle` | Toggle task completion status |
| `DELETE` | `/api/tasks/:id` | Delete a specific task |
| `DELETE` | `/api/tasks/completed` | Bulk delete all completed tasks |
| `GET` | `/api/health` | Healthcheck endpoint |

---

## ✨ Features

- **Glassmorphic Dark UI**: Custom-tailored dark theme with subtle ambient light spheres and blur effects.
- **Dynamic Metrics Dashboard**: Real-time counter cards displaying Total, Active, Completed, and Overdue tasks.
- **Rich Task Attributes**: Task title, description, category (Work, Personal, Shopping, Health, Finance, General), priority levels (Urgent, High, Medium, Low), and due dates.
- **Instant Search & Multi-Filters**: Real-time debounced keyword search with status filters and category pills.
- **Multiple Sort Modes**: Sort by Latest, Oldest, Highest Priority, or Due Date.
- **Toast Notifications**: Smooth alerts for task creation, completion toggles, and deletions.
- **Keyboard Shortcuts**: Press `/` to focus the search bar, `Esc` to close modals.
