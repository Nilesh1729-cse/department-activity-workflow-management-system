import { z } from 'zod';
import {
  Role,
  ProgramLevel,
  ActivityType,
  RequestType,
  ProjectDifficulty,
  AnnouncementAudience,
  AnnouncementPriority,
} from '@prisma/client';

// Auth
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Users
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
  // Optional profile fields based on role
  rollNumber: z.string().optional(),
  programId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  currentSemester: z.number().int().min(1).max(12).optional(),
  cgpa: z.number().min(0).max(10).optional(),
  employeeId: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  designation: z.string().optional(),
  specialization: z.string().optional(),
  cabinNumber: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

// Department, Program, Batch
export const createDepartmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
});

export const createProgramSchema = z.object({
  departmentId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(2).max(10).toUpperCase(),
  level: z.nativeEnum(ProgramLevel),
  durationYears: z.number().int().min(1).max(6).default(4),
});

export const createBatchSchema = z.object({
  programId: z.string().uuid(),
  name: z.string().min(4), // e.g. "2023-2027"
  startYear: z.number().int().min(2000).max(2100),
  endYear: z.number().int().min(2000).max(2100),
  isActive: z.boolean().default(true),
});

// Requests
export const createRequestSchema = z.object({
  requestType: z.nativeEnum(RequestType),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export const updateRequestSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(10).optional(),
});

// Activities
export const createActivitySchema = z.object({
  departmentId: z.string().uuid().optional(),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  activityType: z.nativeEnum(ActivityType),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  proposedDate: z.string().or(z.date()),
  venue: z.string().min(2, 'Venue is required'),
  expectedParticipants: z.number().int().min(1),
  budget: z.number().min(0).default(0),
  organizer: z.string().min(2, 'Organizer name or club is required'),
  remarks: z.string().optional(),
});

// Workflow Task Action (Approve / Reject)
export const approvalActionSchema = z.object({
  comments: z.string().optional(),
});

export const rejectionActionSchema = z.object({
  comments: z.string().min(3, 'A reason/comment is required when rejecting'),
});

// Projects
export const createProjectSchema = z.object({
  programId: z.string().uuid(),
  batchId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  title: z.string().min(5, 'Project title must be at least 5 characters'),
  projectCode: z.string().min(3, 'Project code is required').toUpperCase(),
  description: z.string().min(15, 'Project description must be detailed'),
  domain: z.string().min(2, 'Domain is required (e.g. AI, Cloud, Cybersecurity)'),
  technologies: z.string().min(2, 'Technologies must be specified'),
  difficulty: z.nativeEnum(ProjectDifficulty).default(ProjectDifficulty.MEDIUM),
  maxStudents: z.number().int().min(1).max(5).default(2),
});

export const updateProjectSchema = createProjectSchema.partial();

// Project Preferences (Ranked choices)
export const submitPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        projectId: z.string().uuid(),
        rank: z.number().int().min(1).max(10),
      })
    )
    .min(1, 'Please select at least 1 project preference')
    .max(5, 'You may select up to 5 preferences')
    .refine(
      (items) => {
        const projectIds = items.map((i) => i.projectId);
        return new Set(projectIds).size === projectIds.length;
      },
      { message: 'Duplicate projects selected in preferences' }
    )
    .refine(
      (items) => {
        const ranks = items.map((i) => i.rank);
        return new Set(ranks).size === ranks.length;
      },
      { message: 'Preference ranks must be unique' }
    ),
});

// Allocation
export const generateAllocationSchema = z.object({
  programId: z.string().uuid(),
  batchId: z.string().uuid(),
});

// Announcements
export const createAnnouncementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  audience: z.nativeEnum(AnnouncementAudience).default(AnnouncementAudience.ALL),
  priority: z.nativeEnum(AnnouncementPriority).default(AnnouncementPriority.NORMAL),
  publishDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional(),
});
