export type Role = 'ROLE_STUDENT' | 'ROLE_FACULTY' | 'ROLE_HOD' | 'ROLE_ADMIN';

export type ProgramLevel = 'UG' | 'PG';

export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type TaskStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ActivityType =
  | 'SEMINAR'
  | 'WORKSHOP'
  | 'GUEST_LECTURE'
  | 'TECHNICAL_EVENT'
  | 'INDUSTRIAL_VISIT'
  | 'CONFERENCE'
  | 'DEPARTMENT_MEETING'
  | 'OTHER';

export type RequestType =
  | 'LEAVE_OD'
  | 'SEMINAR_PERMISSION'
  | 'EVENT_PERMISSION'
  | 'PROJECT_RELATED'
  | 'RESOURCE_REQUEST'
  | 'OTHER';

export type ProjectDifficulty = 'BEGINNER' | 'MEDIUM' | 'ADVANCED';

export type ProjectStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'FULL'
  | 'CLOSED'
  | 'REJECTED';

export type AllocationStatus = 'DRAFT' | 'GENERATED' | 'HOD_REVIEW' | 'FINALIZED';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';

export type AnnouncementAudience = 'ALL' | 'STUDENTS' | 'FACULTY' | 'UG' | 'PG';

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  studentProfile?: StudentProfile | null;
  facultyProfile?: FacultyProfile | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  programs?: Program[];
  _count?: {
    faculty?: number;
    activities?: number;
    projects?: number;
  };
}

export interface Program {
  id: string;
  departmentId: string;
  department?: Department;
  name: string;
  code: string;
  level: ProgramLevel;
  durationYears: number;
  batches?: Batch[];
  _count?: {
    studentProfiles?: number;
    projects?: number;
  };
}

export interface Batch {
  id: string;
  programId: string;
  program?: Program;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  _count?: {
    studentProfiles?: number;
    projects?: number;
  };
}

export interface StudentProfile {
  id: string;
  userId: string;
  user?: User;
  rollNumber: string;
  programId: string;
  program: Program;
  batchId: string;
  batch: Batch;
  currentSemester: number;
  cgpa?: number | null;
  allocation?: ProjectAllocation | null;
  preferences?: ProjectPreference[];
}

export interface FacultyProfile {
  id: string;
  userId: string;
  user?: User;
  employeeId: string;
  departmentId: string;
  department: Department;
  designation: string;
  specialization?: string | null;
  cabinNumber?: string | null;
}

export interface WorkflowHistoryItem {
  id: string;
  workflowInstanceId: string;
  actorId: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  actorRole: Role;
  action: string;
  previousStatus: WorkflowStatus;
  newStatus: WorkflowStatus;
  comments?: string | null;
  timestamp: string;
}

export interface ApprovalTask {
  id: string;
  workflowInstanceId: string;
  workflowInstance: {
    id: string;
    entityType: 'ACTIVITY' | 'REQUEST' | 'PROJECT';
    entityId: string;
    currentStatus: WorkflowStatus;
    workflow: { name: string; code: string };
  };
  assignedRole: Role;
  status: TaskStatus;
  actionTaken?: string | null;
  comments?: string | null;
  actedAt?: string | null;
  createdAt: string;
  entityDetails?: any;
}

export interface RequestItem {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    email: string;
    studentProfile?: StudentProfile;
  };
  requestType: RequestType;
  title: string;
  description: string;
  status: WorkflowStatus;
  currentApprover: Role;
  workflowInstanceId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  departmentId: string;
  department?: Department;
  facultyId: string;
  faculty?: {
    id: string;
    name: string;
    email: string;
    facultyProfile?: FacultyProfile;
  };
  title: string;
  activityType: ActivityType;
  description: string;
  proposedDate: string;
  venue: string;
  expectedParticipants: number;
  budget: number;
  organizer: string;
  status: WorkflowStatus;
  remarks?: string | null;
  workflowInstanceId?: string | null;
  createdAt: string;
}

export interface ProjectItem {
  id: string;
  facultyId: string;
  faculty?: {
    id: string;
    name: string;
    email: string;
    facultyProfile?: { designation: string; specialization?: string | null };
  };
  departmentId: string;
  department?: Department;
  programId: string;
  program?: Program;
  batchId: string;
  batch?: Batch;
  title: string;
  projectCode: string;
  description: string;
  domain: string;
  technologies: string;
  difficulty: ProjectDifficulty;
  maxStudents: number;
  allocatedCount: number;
  status: ProjectStatus;
  workflowInstanceId?: string | null;
  createdAt: string;
  allocations?: ProjectAllocation[];
  _count?: {
    allocations?: number;
    preferences?: number;
  };
}

export interface ProjectPreference {
  id: string;
  studentProfileId: string;
  projectId: string;
  project: ProjectItem;
  rank: number;
  createdAt: string;
}

export interface ProjectAllocation {
  id: string;
  projectId: string;
  project: ProjectItem;
  studentProfileId: string;
  studentProfile: StudentProfile;
  status: AllocationStatus;
  allocatedById?: string | null;
  allocationReason?: string | null;
  allocatedAt: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  authorId: string;
  author: { id: string; name: string; role: Role };
  title: string;
  content: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  publishDate: string;
  expiryDate?: string | null;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  uploadedBy: { id: string; name: string; role: Role };
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId?: string | null;
  actor?: { id: string; name: string; email: string; role: Role } | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
}
