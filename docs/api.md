# REST API Specification

## Department Activity & Workflow Management System

This document outlines the RESTful API endpoints available at `/api`. Interactive documentation is available via Swagger UI at `/api-docs`.

---

## Base Configuration

- **Base URL:** `http://localhost:5000/api`
- **Swagger Documentation:** `http://localhost:5000/api-docs`
- **Standard Response Envelope:**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... }
  }
  ```
- **Error Response Envelope:**
  ```json
  {
    "success": false,
    "message": "Human-readable error description",
    "errors": [ ... ]
  }
  ```

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticate user; returns JWT token and user profile |
| `POST` | `/auth/logout` | Authenticated | Invalidate client session token |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile and role details |

---

## 2. Department Requests (`/requests`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/requests` | Authenticated | List requests (scoped to user or department for HOD) |
| `POST` | `/requests` | Student/Faculty | Submit new request (OD, Leave, Permissions, Resources) |
| `GET` | `/requests/:id` | Authenticated | Retrieve request details with workflow timeline |
| `POST` | `/requests/:id/cancel`| Requester/Admin | Cancel submitted request |

---

## 3. Department Activities (`/activities`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/activities` | Authenticated | List activities (Seminars, Workshops, Conferences) |
| `POST` | `/activities` | Faculty/HOD | Propose departmental activity with budget |
| `GET` | `/activities/:id` | Authenticated | Retrieve activity details and budget approval status |
| `PATCH` | `/activities/:id/status` | HOD/Admin | Transition activity execution status |

---

## 4. Approval Workflows (`/approvals`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/approvals/pending` | HOD/Admin/Faculty | Fetch pending approval tasks assigned to caller's role |
| `POST` | `/approvals/:taskId/action` | Assigned Approver | Submit approval decision (`APPROVE` or `REJECT`) with comments |

---

## 5. Projects & Allocation (`/projects`, `/preferences`, `/allocations`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects` | Authenticated | List approved projects (or proposals for faculty/HOD) |
| `POST` | `/projects` | Faculty/HOD | Submit new capstone/mini-project proposal |
| `GET` | `/projects/:id` | Authenticated | Retrieve project details, supervisor info, and capacity |
| `GET` | `/preferences` | Student | Get student's current submitted project preferences |
| `POST` | `/preferences` | Student | Submit/update ranked preferences ($1 \dots N$) |
| `GET` | `/allocations` | Authenticated | Fetch allocation overview for batch/program |
| `POST` | `/allocations/generate` | HOD/Admin | Execute deterministic auto-allocation algorithm (Draft) |
| `POST` | `/allocations/finalize` | HOD/Admin | Finalize project allocation, making assignments visible |
| `GET` | `/allocations/my` | Student | Retrieve student's assigned project |

---

## 6. Faculty & Students Directories (`/faculty`, `/students`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/faculty` | Authenticated | Directory of faculty members, specializations, and projects |
| `GET` | `/faculty/my-students` | Faculty | List students mentored or supervised by the logged-in faculty |
| `GET` | `/students` | HOD/Admin/Faculty | Student directory with Roll, CGPA, and allocation status |

---

## 7. Reports, Audit & Notifications (`/reports`, `/audit`, `/notifications`, `/announcements`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reports/dashboard` | HOD/Admin | Summary statistics, activity metrics, and allocation stats |
| `GET` | `/audit` | HOD/Admin | Immutable system audit log with actor and diff details |
| `GET` | `/notifications` | Authenticated | In-app alerts for the current user |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark notification as read |
| `GET` | `/announcements` | Authenticated | Departmental broadcast notices |
| `POST` | `/announcements` | HOD/Admin | Publish departmental announcement |
