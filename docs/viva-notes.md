# Department Activity & Workflow Management System
## Viva / Defense Preparation Guide & Technical Rationale

This document provides comprehensive answers to typical technical, architectural, and design questions asked during a college project defense, laboratory viva, or technical review.

---

## 1. Project Overview & Motivation

### Q1. What problem does this system solve?
**Answer:**
In higher education institutions—specifically engineering and computer science departments—daily operations suffer from fragmented, manual, and paper-based processes:
- **Approval Bottlenecks:** Student leave/OD (On Duty) forms, event permissions, and resource requests move through physical paper trails or disconnected email threads, resulting in lost requests and zero transparency.
- **Department Activity Tracking:** Seminars, workshops, and guest lectures require administrative sanction and budget clearance, but tracking organizer accountability, actual outcomes, and institutional archives is difficult.
- **Project Allocation Inefficiencies:** Final year capstone and mini-project allocations traditionally involve spreadsheets, conflicting preferences, and manual capacity checks, often resulting in student dissatisfaction and supervisor imbalance.
- **Audit Deficits:** Accrediting bodies (such as NAAC, NBA, and ABET) require complete, timestamped audit trails of departmental decisions, approvals, and student participation.

**Our Solution:**
The **Department Activity & Workflow Management System** is a centralized, role-based platform designed with a **reusable state-machine workflow engine** and a **deterministic project allocation algorithm**. It unites Students, Faculty, Head of Department (HOD), and System Administrators under strict access control and real-time status tracking.

---

## 2. Technology Stack & Architectural Choices

### Q2. Why did you choose React + Vite instead of Next.js or traditional multi-page rendering?
**Answer:**
1. **Single-Page Application (SPA) UX:** Departmental dashboards are highly interactive applications with frequent state updates (approval transitions, preference reordering, filtering, tab switching). An SPA prevents jarring full-page refreshes.
2. **Predictable Client-Side State:** Vite provides lightning-fast Hot Module Replacement (HMR) powered by native ES modules during development and produces highly optimized Rollup bundles for production without SSR server overhead.
3. **No Unnecessary Server-Side Rendering (SSR) Overhead:** A departmental management portal is an authenticated intranet system with private data. It does not require public Search Engine Optimization (SEO). React SPA with client-side JWT handling keeps the backend purely stateless and API-driven.

### Q3. Why TypeScript across both Frontend and Backend?
**Answer:**
- **End-to-End Type Safety:** By using TypeScript on both client and server, data contracts (User, Role, Request, WorkflowInstance, Project, Allocation) match precisely.
- **Refactoring Confidence:** Renaming a property or changing an enum triggers compile-time errors rather than subtle runtime bugs in production or during a live demonstration.
- **Self-Documenting Code:** Code readability is enhanced during a viva inspection; function signatures clearly state accepted inputs and return shapes.

### Q4. Why PostgreSQL instead of MongoDB / NoSQL?
**Answer:**
- **Relational Integrity:** Departmental data is intrinsically relational:
  - A Department has multiple Programs (UG, PG).
  - A Program has multiple Batches.
  - A Batch contains Students.
  - A WorkflowInstance references a Request or Activity, has multiple WorkflowSteps, and generates ApprovalTasks and WorkflowHistory.
- **ACID Compliance:** Financial approvals (budgets for events) and project allocation (where project capacity cannot be exceeded) require strict transactions with atomic rollback capabilities.
- **Referential Actions:** Foreign key constraints (`ON DELETE CASCADE`, `ON DELETE RESTRICT`) prevent orphaned approval tasks or deleted users with active allocations. MongoDB would require manual application-level referential consistency checks.

### Q5. Why Prisma ORM over raw SQL or TypeORM?
**Answer:**
1. **Declarative Schema Modeling:** The single `schema.prisma` file serves as the definitive source of truth for all models, relationships, and enums.
2. **Type-Safe Query Builder:** Prisma generates TypeScript client types automatically (`PrismaClient`). If a query selects relations (`include: { workflowInstance: true }`), the resulting object is strictly typed.
3. **Automated Migrations & Introspection:** `prisma migrate dev` tracks database schema changes in version-controlled SQL files, ensuring zero drift between development, testing, and production environments.

### Q6. Why Node.js & Express for the Backend?
**Answer:**
- **Non-blocking Asynchronous I/O:** Node’s event-driven runtime excels at handling high-concurrency I/O operations (concurrent database queries, file uploads, JWT validation) with low memory footprint.
- **Ecosystem Maturity:** Express provides a lightweight, unopinionated routing foundation allowing us to construct a clean, layered architecture (Routes $\to$ Controllers $\to$ Services $\to$ Prisma ORM) with custom middleware for RBAC, input validation, rate limiting, and error handling.

---

## 3. Security, Authentication & Role-Based Access Control (RBAC)

### Q7. How is Authentication implemented?
**Answer:**
1. **Stateless JWT Tokens:** Upon entering valid credentials, the server signs a JSON Web Token (JWT) with HMAC-SHA256 containing `{ id, email, role, departmentId }` and a configurable expiration (default 24 hours).
2. **Password Security:** User passwords are never stored in plaintext. Passwords are salted and hashed using `bcryptjs` with a cost factor of 10 (`bcrypt.hash(password, 10)`).
3. **Session Verification:** Protected routes use `requireAuth` middleware to verify the `Authorization: Bearer <token>` header, validate the cryptographic signature, check expiration, and retrieve the latest active user status from the database.

### Q8. How does the RBAC system enforce authorization?
**Answer:**
Instead of scattering role checks inside controllers, authorization is handled by modular, declarative middleware:
```typescript
// Centralized RBAC Middleware
router.post('/activities', requireAuth, requireRole(Role.ROLE_FACULTY), activityController.create);
router.post('/approvals/:taskId/action', requireAuth, requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]), approvalController.takeAction);
```
- **Hierarchical Scopes:**
  - `ROLE_STUDENT`: Read-only access to their profile, assigned batch/program, their own requests, submit project preferences, view their allocated project, view public activities/announcements.
  - `ROLE_FACULTY`: Access their assigned students, submit project proposals, manage their activities, review assigned student requests.
  - `ROLE_HOD`: Department-wide scope. Review and approve/reject all requests, activity budgets, and project proposals; execute and finalize project allocations; view audit trails and reports.
  - `ROLE_ADMIN`: System-wide scope. User management, academic structure configuration (Departments, Programs, Batches), workflow rules, announcements.

### Q9. How do you prevent Common Web Vulnerabilities (OWASP Top 10)?
**Answer:**
1. **SQL Injection:** Mitigated completely through Prisma ORM, which utilizes parameterized prepared statements.
2. **XSS (Cross-Site Scripting):** React automatically escapes HTML strings rendered in JSX. Express uses `helmet` middleware to set secure HTTP headers (Content-Security-Policy, X-XSS-Protection).
3. **Broken Object Level Authorization (BOLA/IDOR):** Request and preference endpoints verify that the authenticated `req.user.id` matches the resource's `studentId` or `requesterId`, unless the actor holds `ROLE_HOD` or `ROLE_ADMIN`.
4. **Input Validation:** Every payload is validated against strict `Zod` schemas before touching database logic, stripping unpermitted fields and rejecting malformed inputs.
5. **Brute Force Attacks:** `express-rate-limit` throttles authentication endpoints to 10 requests per 15-minute window per IP.

---

## 4. Reusable Workflow Engine Design

### Q10. What makes your workflow engine "reusable"? Why didn't you hardcode approval logic?
**Answer:**
Hardcoding approval logic inside individual controllers leads to duplicate code, inconsistent state transitions, and fragile extensions whenever a new request type or approval step is introduced.

Our system abstracts workflow into generic state-machine entities:
- **`Workflow`**: Defines the workflow archetype (e.g., `STUDENT_REQUEST`, `FACULTY_ACTIVITY`, `PROJECT_PROPOSAL`).
- **`WorkflowInstance`**: An execution instance bound polymorphically via `entityType` and `entityId` to the underlying domain model (`Request`, `Activity`, `ProjectProposal`).
- **`WorkflowStep`**: Defines the ordered steps in the workflow pipeline (e.g., Step 1: Faculty Advisor Review, Step 2: HOD Sanction).
- **`ApprovalTask`**: Represents an actionable item assigned to a specific role or user, with states: `PENDING`, `APPROVED`, `REJECTED`.
- **`WorkflowHistory`**: An append-only audit trail logging every transition: `{ previousStatus, newStatus, action, actorId, comments, timestamp }`.

**Transitions supported:**
$$\text{DRAFT} \longrightarrow \text{SUBMITTED} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \begin{cases} \text{APPROVED} \longrightarrow \text{COMPLETED} \\ \text{REJECTED} \longrightarrow \text{CANCELLED} \end{cases}$$

When an approval task is decided:
1. `workflowService.takeAction(taskId, actorId, action, comments)` executes atomically in a transaction.
2. The current task is updated with decision metadata.
3. If approved and further steps exist, the next `ApprovalTask` is spawned.
4. If approved on the terminal step, `WorkflowInstance.status` becomes `APPROVED` and syncs to the parent entity.
5. In-app notifications are automatically dispatched to the requester.

---

## 5. Project Preference & Allocation Algorithm

### Q11. How does the Project Allocation Algorithm work?
**Answer:**
The allocation engine is encapsulated in `allocationService.ts`. It follows a deterministic, capacity-constrained greedy algorithm:
1. **Input Phase:**
   - Filters students belonging to a target `programId` and `batchId`.
   - Fetches their ranked project preferences ($1, 2, 3, \dots, N$) submitted through the portal.
   - Fetches approved project proposals offering seats in that program and batch with their `maxStudents` capacity.
2. **Deterministic Ordering:**
   - Students are sorted deterministically by **CGPA descending**, with **Roll Number ascending** as a deterministic tie-breaker.
3. **Greedy Matching with Constraints:**
   - For each student, the algorithm iterates through their preferences in rank order (Rank 1 first).
   - If the requested project has remaining capacity (`currentAllocations.length < project.maxStudents`), the student is allocated to that project.
   - The project's filled count is incremented.
   - If all preferred projects are filled to capacity, the student remains unallocated with an explicit status note (`NO_CAPACITY_AVAILABLE`).
4. **Draft $\to$ Preview $\to$ Finalize Two-Phase Commit:**
   - The HOD runs **"Run Auto Allocation"**, creating draft allocation records (`status = DRAFT`).
   - The HOD can inspect the preview distribution, project occupancy, and unallocated students.
   - Once satisfied, the HOD clicks **"Finalize Allocation"** (`status = FINALIZED`).
   - Once finalized, allocation visibility unlocks for students ("My Allocated Project") and faculty supervisors ("My Assigned Students").

### Q12. How can this algorithm be extended for future requirements?
**Answer:**
Because the allocation engine is cleanly decoupled behind `IAllocationService`:
- We can plug in **Hungarian algorithm / Gale-Shapley Stable Marriage** matching for mutual student-faculty preference balancing.
- We can add **multi-factor weighting**: $\text{Score} = 0.5 \times \text{CGPA} + 0.3 \times \text{SkillMatch} + 0.2 \times \text{InterviewScore}$.
- We can enforce faculty workload limits (e.g., no faculty member can mentor more than 3 teams).

---

## 6. Academic Hierarchy & Multi-Program Support

### Q13. How does the system handle both UG and PG programs?
**Answer:**
We avoided hardcoded strings or flags. Instead, we created normalized database entities:
$$\text{Department} \longrightarrow \text{Program (type: UG / PG)} \longrightarrow \text{Batch (e.g., 2023–2027)} \longrightarrow \text{StudentProfile}$$
- A student belongs to a specific `Program` and `Batch`.
- A project proposal is targeted to a specific `Program` and `Batch`.
- When a student views project proposals or submits preferences, the API queries:
  ```typescript
  where: { programId: student.programId, batchId: student.batchId, status: ProjectStatus.APPROVED }
  ```
- This ensures UG students never see or collide with PG project offerings, and different batches are completely isolated.

---

## 7. Audit Logging & System Transparency

### Q14. What is the Audit Logging mechanism?
**Answer:**
Every state-mutating operation (login, create request, approval decision, user creation, project allocation run) invokes `auditService.log()`:
- Records: `userId`, `action`, `entityType`, `entityId`, `details` (JSON payload with diffs/metadata), and `ipAddress`.
- The audit table is strictly append-only. No user—not even the Admin—can edit or delete audit logs through the application.
- The HOD and Admin dashboards feature a dedicated, filterable Audit Log explorer for institutional governance.

---

## 8. Viva Quick Troubleshooting / Live Demo FAQs

| Question | Quick Answer / Demonstration Route |
| :--- | :--- |
| **How to show real-time notifications?** | Log in as HOD, approve student1's request. Switch to student1; notice the bell icon badge counter increment with the approval message. |
| **How to prove RBAC works?** | Log in as `student1@department.local`. Try to navigate to `/approvals` or `/admin/users`. The route guard immediately redirects to `/dashboard`. |
| **Where are the Swagger API docs?** | Visit `http://localhost:5000/api-docs`. All REST endpoints, schemas, and parameters are documented interactively. |
| **How do you prevent duplicate preferences?** | Database schema enforces a composite unique constraint: `@@unique([studentId, projectId])` and `@@unique([studentId, rank])`. |
| **Can we attach files to requests?** | Yes, Multer middleware stores uploaded documents in `server/uploads/` with sanitized filenames and records metadata in the `Document` table. |
