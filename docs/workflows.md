# Reusable Workflow Engine Specification

## Department Activity & Workflow Management System

This document specifies the design, lifecycle states, transitions, and extensibility of the generic Workflow Engine implemented in `server/src/services/workflowService.ts`.

---

## 1. Motivation & Objectives

In institutional management systems, approval workflows change frequently:
- New types of requests are introduced (e.g., Internship NOC, Equipment Booking).
- Approval chains evolve (e.g., adding a Faculty Advisor review prior to HOD sanction).
- Different entities require approvals (Student Requests, Faculty Activities, Project Proposals).

Rather than embedding bespoke approval columns in every entity table, we engineered a **polymorphic, step-driven workflow state machine**.

---

## 2. Core Entities & Data Model

```mermaid
classDiagram
    class Workflow {
        +String id
        +String code
        +String name
        +String description
        +Boolean isActive
    }

    class WorkflowStep {
        +String id
        +String workflowId
        +Int stepOrder
        +String stepName
        +Role requiredRole
    }

    class WorkflowInstance {
        +String id
        +String workflowId
        +String entityType
        +String entityId
        +WorkflowStatus status
        +Int currentStepOrder
        +DateTime createdAt
        +DateTime updatedAt
    }

    class ApprovalTask {
        +String id
        +String instanceId
        +Int stepOrder
        +Role assignedRole
        +String assignedToUserId
        +TaskStatus status
        +DateTime decidedAt
        +String comments
    }

    class WorkflowHistory {
        +String id
        +String instanceId
        +WorkflowStatus previousStatus
        +WorkflowStatus newStatus
        +String action
        +String actorId
        +String comments
        +DateTime createdAt
    }

    Workflow "1" --> "*" WorkflowStep : defines
    Workflow "1" --> "*" WorkflowInstance : instantiates
    WorkflowInstance "1" --> "*" ApprovalTask : generates
    WorkflowInstance "1" --> "*" WorkflowHistory : logs
```

---

## 3. Workflow State Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Creator initializes entity
    DRAFT --> SUBMITTED : Creator submits for review
    SUBMITTED --> UNDER_REVIEW : Step 1 ApprovalTask spawned
    
    UNDER_REVIEW --> UNDER_REVIEW : Intermediate step approved (spawns next task)
    UNDER_REVIEW --> APPROVED : Terminal step approved
    UNDER_REVIEW --> REJECTED : Any approver rejects with remarks
    
    APPROVED --> COMPLETED : Event or activity executed
    DRAFT --> CANCELLED : Requester withdraws request
    
    REJECTED --> [*]
    COMPLETED --> [*]
    CANCELLED --> [*]
```

### Supported Statuses:
- **`DRAFT`**: Entity created, editable by requester, not visible in approver queues.
- **`SUBMITTED`**: Initial submission, triggering workflow instance creation.
- **`UNDER_REVIEW`**: Currently pending decision on an active `ApprovalTask`.
- **`APPROVED`**: All defined workflow steps approved.
- **`REJECTED`**: Rejected by an approver with required comments.
- **`CANCELLED`**: Cancelled by requester prior to final decision.
- **`COMPLETED`**: Terminal status for activities once executed.

---

## 4. Execution Sequence: Student Request Approval

```mermaid
sequenceDiagram
    autonumber
    actor Student
    actor HOD
    participant API as Express API
    participant WF as WorkflowService
    participant DB as Prisma (PostgreSQL)
    participant Notif as NotificationService

    Student->>API: POST /api/requests (submit=true)
    API->>DB: Create Request record
    API->>WF: createInstance("STUDENT_REQUEST", "REQUEST", requestId)
    WF->>DB: Insert WorkflowInstance (status: UNDER_REVIEW)
    WF->>DB: Insert ApprovalTask (assignedRole: ROLE_HOD, status: PENDING)
    WF->>DB: Insert WorkflowHistory (action: "SUBMITTED")
    WF->>Notif: notifyRole(ROLE_HOD, "New Student Request Submitted")
    API-->>Student: 201 Created (status: UNDER_REVIEW)

    Note over HOD,API: HOD logs into Dashboard & visits /approvals

    HOD->>API: GET /api/approvals/pending
    API->>DB: Find ApprovalTasks where assignedRole = ROLE_HOD & status = PENDING
    API-->>HOD: Return pending tasks with entity details

    HOD->>API: POST /api/approvals/:taskId/action { action: "APPROVE", comments: "Sanctioned" }
    API->>WF: takeAction(taskId, hodUserId, "APPROVE", "Sanctioned")
    WF->>DB: Update ApprovalTask (status: APPROVED, decidedAt: now())
    WF->>DB: Check if next step exists (No, Step 1 is terminal)
    WF->>DB: Update WorkflowInstance (status: APPROVED)
    WF->>DB: Update Request (status: APPROVED)
    WF->>DB: Insert WorkflowHistory (action: "APPROVED", actor: HOD)
    WF->>Notif: notifyUser(studentId, "Your Request has been Approved")
    API-->>HOD: 200 OK (Task resolved)
```

---

## 5. How to Add a New Workflow in 3 Steps

1. **Register the Workflow:**
   ```typescript
   await prisma.workflow.create({
     data: {
       code: 'INTERNSHIP_NOC',
       name: 'Internship NOC Clearance',
       description: 'Two-stage clearance for external student internships',
       steps: {
         create: [
           { stepOrder: 1, stepName: 'Faculty Mentor Endorsement', requiredRole: 'ROLE_FACULTY' },
           { stepOrder: 2, stepName: 'HOD Clearance & Seal', requiredRole: 'ROLE_HOD' },
         ],
       },
     },
   });
   ```
2. **Bind Entity in Controller:**
   Call `workflowService.createInstance('INTERNSHIP_NOC', 'NOC_REQUEST', nocRecord.id)` upon submission.
3. **No Frontend Alteration Required:**
   The `WorkflowTimeline` component dynamically renders each step and history entry without bespoke component code.
