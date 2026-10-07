# Department Activity & Workflow Management System

A production-structured, full-stack departmental enterprise portal engineered for college **Computer Science & Engineering** departments. Built specifically for academic laboratory evaluation, university viva examinations, and continuous institutional deployment.

---

## Table of Contents
1. [Overview & Key Objectives](#overview--key-objectives)
2. [Technology Stack](#technology-stack)
3. [System Architecture & Visual Diagrams](#system-architecture--visual-diagrams)
   - [3.1 High-Level System Architecture](#31-high-level-system-architecture)
   - [3.2 Database Entity-Relationship (ER) Model](#32-database-entity-relationship-er-model)
   - [3.3 Reusable Workflow State Machine](#33-reusable-workflow-state-machine)
   - [3.4 Deterministic Project Allocation Algorithm](#34-deterministic-project-allocation-algorithm)
4. [Demo Accounts & Credentials](#demo-accounts--credentials)
5. [Local Installation & Setup Guide](#local-installation--setup-guide)
6. [Docker & Containerized Setup](#docker--containerized-setup)
7. [Automated Testing & Code Quality](#automated-testing--code-quality)
8. [Documentation Reference](#documentation-reference)

---

## 1. Overview & Key Objectives

In higher education institutions, academic departments manage a complex array of overlapping workflows: student on-duty (OD) and leave requests, faculty workshops and guest lectures, capstone project proposals, preference selection, supervisor allocation, and institutional accreditation reporting.

This system replaces disjointed spreadsheets, paper forms, and email chains with a unified digital platform featuring:
- **Centralized Role-Based Access Control (RBAC):** Strict boundaries for `ROLE_STUDENT`, `ROLE_FACULTY`, `ROLE_HOD`, and `ROLE_ADMIN`.
- **Reusable State-Machine Workflow Engine:** Polymorphic approval engine supporting multi-step reviews, comments, and automated notification triggers.
- **Academic Hierarchy Modeling:** Normalized relational modeling of `Department` $\to$ `Program` (UG/PG) $\to$ `Batch` $\to$ `Student`.
- **Deterministic Project Allocation Engine:** Capacity-constrained greedy matching respecting student preferences, supervisor capacities, and merit-based criteria.
- **Append-Only Audit Logging & Analytics:** Complete institutional transparency for accreditation bodies (NAAC/NBA).

---

## 2. Technology Stack

| Layer | Technologies | Rationale |
| :--- | :--- | :--- |
| **Frontend SPA** | React 18, TypeScript, Vite, Tailwind CSS | High performance, zero SSR complexity, rapid client-side routing and instant HMR. |
| **Routing & Forms** | React Router 6, React Hook Form, Zod | Declarative route protection, type-safe schema validation, fast form interactions. |
| **UI Components** | Lucide React, Recharts, Custom Tailwind UI | Clean, modern laboratory-grade dashboard interface with interactive charts. |
| **Backend API** | Node.js, Express, TypeScript | Event-driven, asynchronous I/O, clean layered architecture (Routes $\to$ Controllers $\to$ Services $\to$ Prisma). |
| **Authentication** | JWT (HMAC-SHA256), bcryptjs | Stateless, horizontally scalable tokens; salted and hashed passwords (cost factor 10). |
| **Database & ORM** | PostgreSQL 15, Prisma ORM | ACID-compliant relational integrity, declarative schema modeling, and type-safe query generation. |
| **Testing** | Vitest, Supertest | Rapid backend integration tests validating RBAC, workflows, and allocation algorithms. |
| **Documentation** | OpenAPI 3.0, Swagger UI | Interactive API documentation accessible directly at `/api-docs`. |

---

## 3. System Architecture & Visual Diagrams

### 3.1 High-Level System Architecture

```mermaid
graph TB
    subgraph Client["Frontend Tier (React + Vite - Port 5173)"]
        UI["React 18 SPA (TypeScript + Tailwind CSS)"]
        AuthContext["Auth Context (JWT State & RBAC Helpers)"]
        Router["React Router 6 (Protected Route Guards)"]
        Axios["Axios Interceptor (Bearer JWT Injection)"]
        UI --> AuthContext
        UI --> Router
        UI --> Axios
    end

    subgraph Server["Application Tier (Node.js/Express - Port 5000)"]
        Security["Security Middleware (Helmet, CORS, Rate Limit)"]
        AuthMiddleware["RBAC Middleware (requireAuth, requireRole)"]
        ZodVal["Zod Schema Validation Layer"]
        Controllers["16 Domain Controllers"]
        
        subgraph Services["Core Domain Services"]
            WFService["Workflow Engine (State Machine)"]
            AllocService["Deterministic Allocation Engine"]
            AuditService["Append-Only Audit Logger"]
            NotifService["Notification Event Dispatcher"]
        end
        
        Axios -->|REST / JSON| Security
        Security --> AuthMiddleware
        AuthMiddleware --> ZodVal
        ZodVal --> Controllers
        Controllers --> Services
    end

    subgraph Database["Persistence Tier (PostgreSQL 15 - Port 5432)"]
        PrismaClient["Prisma ORM Client"]
        Postgres[(PostgreSQL Relational DB)]
        Services --> PrismaClient
        Controllers --> PrismaClient
        PrismaClient --> Postgres
    end
```

### 3.2 Database Entity-Relationship (ER) Model

```mermaid
erDiagram
    Department ||--|{ Program : offers
    Department ||--|{ User : employs
    Program ||--|{ Batch : defines
    Program ||--|{ ProjectProposal : targets
    Batch ||--|{ StudentProfile : enrolls
    Batch ||--|{ ProjectProposal : schedules
    
    User ||--o| StudentProfile : "has profile"
    User ||--o| FacultyProfile : "has profile"
    User ||--o{ Request : submits
    User ||--o{ Activity : organizes
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : acts_in
    
    FacultyProfile ||--o{ ProjectProposal : proposes
    StudentProfile ||--o{ ProjectPreference : ranks
    StudentProfile ||--o| ProjectAllocation : assigned
    
    ProjectProposal ||--o{ ProjectPreference : selected_in
    ProjectProposal ||--o{ ProjectAllocation : allocates
    
    Workflow ||--|{ WorkflowStep : configures
    Workflow ||--|{ WorkflowInstance : instantiates
    WorkflowInstance ||--|{ ApprovalTask : assigns
    WorkflowInstance ||--|{ WorkflowHistory : audits
```

### 3.3 Reusable Workflow State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Creator drafts request / activity
    DRAFT --> SUBMITTED : Submits for evaluation
    SUBMITTED --> UNDER_REVIEW : Spawns active ApprovalTask
    
    UNDER_REVIEW --> UNDER_REVIEW : Intermediate step approved (spawns next step)
    UNDER_REVIEW --> APPROVED : Terminal step approved
    UNDER_REVIEW --> REJECTED : Approver rejects with remarks
    
    APPROVED --> COMPLETED : Activity or event executed
    DRAFT --> CANCELLED : Withdrawn by requester
    
    REJECTED --> [*]
    COMPLETED --> [*]
    CANCELLED --> [*]
```

### 3.4 Deterministic Project Allocation Algorithm

```mermaid
flowchart TD
    Start([HOD Triggers Auto-Allocation]) --> FetchData[Fetch Eligible Students, Preferences & Approved Projects]
    FetchData --> SortStudents["Sort Students Deterministically<br/>(1. CGPA Descending, 2. Roll Number Ascending)"]
    SortStudents --> LoopStudents{More Students in Queue?}
    
    LoopStudents -- Yes --> GetNextStudent[Pick Next Student]
    GetNextStudent --> CheckPref{More Preferences<br/>Rank 1 to N?}
    
    CheckPref -- Yes --> EvaluatePref[Evaluate Project Choice]
    EvaluatePref --> CheckCap{Project Seats<br/>Available?}
    
    CheckCap -- Yes --> AssignStudent["Assign Student to Project<br/>(Increment Project Seat Count)"]
    AssignStudent --> LoopStudents
    
    CheckCap -- No --> CheckPref
    CheckPref -- No --> MarkUnallocated["Mark Student Unallocated<br/>(Reason: NO_CAPACITY_AVAILABLE)"]
    MarkUnallocated --> LoopStudents
    
    LoopStudents -- No --> GenerateDraft["Generate Allocation Preview<br/>(Status: DRAFT)"]
    GenerateDraft --> HODReview{HOD Approval?}
    
    HODReview -- Approve --> FinalizeCommit["Commit Allocations<br/>(Status: FINALIZED)"]
    FinalizeCommit --> PublishResults["Unlock Visibility for Students & Supervisors<br/>Dispatch Notifications"]
    PublishResults --> End([Completed])
    
    HODReview -- Modify --> Start
```

---

## 4. Demo Accounts & Credentials

For laboratory demonstrations and viva examinations, the system is seeded with realistic accounts across all four institutional roles. The common password for all seeded accounts is:

$$\mathbf{Demo@123}$$

| Role | Email | Name / Designation | Department / Program | Purpose in Demo |
| :--- | :--- | :--- | :--- | :--- |
| **ROLE_ADMIN** | `admin@department.local` | System Administrator | IT & Operations | User provisioning, Academic structure (UG/PG Batches), System audit log |
| **ROLE_HOD** | `hod@department.local` | Dr. K. Ramanathan | Computer Science & Eng. | Request approvals, Activity budgets, Proposal reviews, Project Allocation execution |
| **ROLE_FACULTY** | `faculty1@department.local` | Prof. Ananya Sharma | Assistant Professor (AI/ML) | Proposes projects, organizes seminars, reviews assigned students |
| **ROLE_FACULTY** | `faculty2@department.local` | Dr. Rajesh Verma | Associate Professor (Cloud/IoT) | Proposes projects, reviews student requests |
| **ROLE_STUDENT** | `student1@department.local` | Rahul Deshmukh | B.Tech CSE (2023-2027) | Submits OD requests, ranks project preferences, views allocation |
| **ROLE_STUDENT** | `student2@department.local` | Priya Nair | B.Tech CSE (2023-2027) | Submits leave requests, ranks project preferences |

> **Viva Demo Tip:** On the Login page (`/login`), click the **"Quick Demo Account Login"** buttons to switch between roles with a single click.

---

## 5. Local Installation & Setup Guide

### Prerequisites
- **Node.js:** v18.x or v20.x or v24.x
- **PostgreSQL:** v14, v15, or v16 running locally on port `5432`
- **Git**

### Step 1: Clone and Install Dependencies
```bash
# Clone the repository
git clone <repo-url>
cd "Department Activity & Workflow Management System"

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables
Verify or edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/dept_management?schema=public"
JWT_SECRET="super-secure-jwt-secret-key-change-in-production-dept-management-2025"
JWT_EXPIRES_IN="24h"
CLIENT_URL="http://localhost:5173"
MAX_FILE_SIZE=5242880
UPLOAD_DIR="./uploads"
```

### Step 3: Database Migration & Seeding
```bash
cd server

# Synchronize database schema
npx prisma db push

# Seed realistic demo data
npm run seed
```

### Step 4: Run the Application
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server running at http://localhost:5000
# Swagger API docs at http://localhost:5000/api-docs
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite client running at http://localhost:5173
```

---

## 6. Docker & Containerized Setup

To launch the full system using Docker and Docker Compose:

```bash
# From project root
docker compose up --build -d
```
Services spun up:
- **`postgres`:** Database running on port `5432`
- **`server`:** Express API running on port `5000`
- **`client`:** Vite frontend served on port `5173`

---

## 7. Automated Testing & Code Quality

The backend includes a comprehensive integration test suite built with **Vitest** and **Supertest** covering authentication, RBAC, workflows, request creation, preference submission, auto-allocation, and analytics.

```bash
# Run backend test suite
cd server
npm test
```

### Test Suite Execution Output:
```
 ✓ src/__tests__/api.test.ts (20 tests)
   ✓ Health & Documentation Endpoints (2 tests)
   ✓ Authentication & RBAC Middleware (4 tests)
   ✓ Department Requests & Approvals (3 tests)
   ✓ Department Activities (2 tests)
   ✓ Project Proposals & Review (2 tests)
   ✓ Project Preference Submission & Validation (2 tests)
   ✓ Project Allocation Engine (2 tests)
   ✓ Notifications & Announcements (2 tests)
   ✓ Reports & Analytics (1 test)

 Test Files  1 passed (1)
      Tests  20 passed (20)
```

To run TypeScript strict-mode compilation check:
```bash
# Backend TypeScript check
cd server && npx tsc --noEmit

# Frontend TypeScript check
cd client && node ./node_modules/typescript/bin/tsc --noEmit
```

---

## 8. Documentation Reference

Detailed documentation is available in the [`docs/`](./docs/) directory:
- [**Viva / Defense Preparation Guide (`docs/viva-notes.md`)**](./docs/viva-notes.md) - Complete Q&A for lab examiners.
- [**System Architecture (`docs/architecture.md`)**](./docs/architecture.md) - Deep dive into layered design and data flow.
- [**Workflow Engine Specification (`docs/workflows.md`)**](./docs/workflows.md) - State machine and transition mechanics.
- [**Database Dictionary & ERD (`docs/database.md`)**](./docs/database.md) - Complete schema entity details.
- [**REST API Reference (`docs/api.md`)**](./docs/api.md) - Endpoint catalog, payloads, and responses.

---

## License
MIT License. Developed for the Department of Computer Science & Engineering.
