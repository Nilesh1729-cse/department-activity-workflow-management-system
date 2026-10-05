import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';

const app = createApp();

describe('Department Activity & Workflow Management System API Tests', () => {
  let studentToken = '';
  let hodToken = '';
  let facultyToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // Ensure DB connection is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Authentication & JWT', () => {
    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student1@department.local', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should login student1 and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student1@department.local', password: 'Demo@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('ROLE_STUDENT');
      studentToken = res.body.data.token;
    });

    it('should login HOD and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'hod@department.local', password: 'Demo@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ROLE_HOD');
      hodToken = res.body.data.token;
    });

    it('should login faculty1 and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'faculty1@department.local', password: 'Demo@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ROLE_FACULTY');
      facultyToken = res.body.data.token;
    });

    it('should login admin and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@department.local', password: 'Demo@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ROLE_ADMIN');
      adminToken = res.body.data.token;
    });

    it('should return current user profile on /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('student1@department.local');
      expect(res.body.data.studentProfile).toBeDefined();
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('should block student from accessing administrative user management', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow HOD and Admin to access user management', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should block student from calling approval actions', async () => {
      const res = await request(app)
        .post('/api/approvals/non-existent-id/approve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ comments: 'I approve my own request' });

      expect(res.status).toBe(403);
    });
  });

  describe('3. Request & Generic Approval Workflow', () => {
    let createdRequestId = '';
    let pendingTaskId = '';

    it('should allow student to create a new departmental request in DRAFT', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          requestType: 'LEAVE_OD',
          title: 'Automated Test: Permission for Hackathon Presentation',
          description: 'Requesting on-duty leave for state hackathon competition finals.',
          submitImmediately: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
      createdRequestId = res.body.data.id;
    });

    it('should allow student to submit their request to HOD', async () => {
      const res = await request(app)
        .post(`/api/requests/${createdRequestId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ comments: 'Submitting OD request for HOD review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.instance.currentStatus).toBe('SUBMITTED');
      pendingTaskId = res.body.data.task.id;
    });

    it('should display the pending request in HOD approval queue', async () => {
      const res = await request(app)
        .get('/api/approvals/pending')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const foundTask = res.body.data.find((t: any) => t.id === pendingTaskId);
      expect(foundTask).toBeDefined();
    });

    it('should allow HOD to approve the request and update history', async () => {
      const res = await request(app)
        .post(`/api/approvals/${pendingTaskId}/approve`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({ comments: 'Approved with full OD allowance' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.status).toBe('APPROVED');
      expect(res.body.data.instance.currentStatus).toBe('APPROVED');

      // Verify request status in DB
      const updatedReq = await prisma.request.findUnique({ where: { id: createdRequestId } });
      expect(updatedReq?.status).toBe('APPROVED');
    });
  });

  describe('4. Project Preferences & Allocation', () => {
    it('should allow student to query available approved projects', async () => {
      const res = await request(app)
        .get('/api/projects/preferences/available')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.projects)).toBe(true);
      expect(res.body.data.projects.length).toBeGreaterThan(0);
    });

    it('should validate and save student project preferences', async () => {
      const availableRes = await request(app)
        .get('/api/projects/preferences/available')
        .set('Authorization', `Bearer ${studentToken}`);

      const projects = availableRes.body.data.projects;
      expect(projects.length).toBeGreaterThanOrEqual(2);

      const prefs = [
        { projectId: projects[0].id, rank: 1 },
        { projectId: projects[1].id, rank: 2 },
      ];

      const res = await request(app)
        .post('/api/projects/preferences')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ preferences: prefs });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should reject duplicate preferences', async () => {
      const availableRes = await request(app)
        .get('/api/projects/preferences/available')
        .set('Authorization', `Bearer ${studentToken}`);

      const projects = availableRes.body.data.projects;

      const duplicatePrefs = [
        { projectId: projects[0].id, rank: 1 },
        { projectId: projects[0].id, rank: 2 }, // Duplicate project
      ];

      const res = await request(app)
        .post('/api/projects/preferences')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ preferences: duplicatePrefs });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Notifications & Announcements', () => {
    it('should fetch user notifications and unread counter', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(typeof res.body.data.unreadCount).toBe('number');
    });

    it('should fetch announcements filtered by role', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('6. Reports & Dashboard Analytics', () => {
    it('should fetch role-aware dashboard stats for student', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard-stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('STUDENT');
      expect(res.body.data.metrics.totalRequests).toBeGreaterThanOrEqual(1);
    });

    it('should fetch HOD department KPIs and analytics datasets', async () => {
      const statsRes = await request(app)
        .get('/api/reports/dashboard-stats')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.metrics.totalStudents).toBeGreaterThan(0);
      expect(statsRes.body.data.metrics.totalFaculty).toBeGreaterThan(0);

      const analyticsRes = await request(app)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.data.studentsByProgram).toBeDefined();
      expect(analyticsRes.body.data.requestStatusData).toBeDefined();
    });
  });
});
