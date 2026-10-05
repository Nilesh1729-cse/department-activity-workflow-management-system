import {
  PrismaClient,
  Role,
  ProgramLevel,
  WorkflowStatus,
  WorkflowEntityType,
  TaskStatus,
  ActivityType,
  RequestType,
  ProjectDifficulty,
  ProjectStatus,
  AllocationStatus,
  NotificationType,
  AnnouncementAudience,
  AnnouncementPriority,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.projectAllocation.deleteMany();
  await prisma.projectPreference.deleteMany();
  await prisma.project.deleteMany();
  await prisma.request.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.approvalTask.deleteMany();
  await prisma.workflowHistory.deleteMany();
  await prisma.workflowInstance.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 1. Department
  const cseDept = await prisma.department.create({
    data: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science and Engineering - Excellence in Computing, Systems & Research',
    },
  });

  // 2. Programs
  const btechProg = await prisma.program.create({
    data: {
      departmentId: cseDept.id,
      name: 'B.Tech Computer Science & Engineering',
      code: 'BT-CSE',
      level: ProgramLevel.UG,
      durationYears: 4,
    },
  });

  const mtechProg = await prisma.program.create({
    data: {
      departmentId: cseDept.id,
      name: 'M.Tech Computer Science & Engineering',
      code: 'MT-CSE',
      level: ProgramLevel.PG,
      durationYears: 2,
    },
  });

  // 3. Batches
  const batch2023 = await prisma.batch.create({
    data: {
      programId: btechProg.id,
      name: '2023-2027',
      startYear: 2023,
      endYear: 2027,
      isActive: true,
    },
  });

  const batch2024 = await prisma.batch.create({
    data: {
      programId: btechProg.id,
      name: '2024-2028',
      startYear: 2024,
      endYear: 2028,
      isActive: true,
    },
  });

  const batchMTech2025 = await prisma.batch.create({
    data: {
      programId: mtechProg.id,
      name: '2025-2027',
      startYear: 2025,
      endYear: 2027,
      isActive: true,
    },
  });

  console.log('✅ Created Department, Programs, and Batches.');

  // 4. Workflows & Steps
  const studentReqWf = await prisma.workflow.create({
    data: {
      code: 'STUDENT_REQUEST',
      name: 'Student Departmental Request Workflow',
      description: 'Review and approval pipeline for student departmental leaves, permissions, and resource requisitions',
      initialStatus: WorkflowStatus.DRAFT,
      steps: {
        create: [
          { stepOrder: 1, name: 'Submit Request', fromStatus: WorkflowStatus.DRAFT, toStatus: WorkflowStatus.SUBMITTED, requiredRole: Role.ROLE_STUDENT },
          { stepOrder: 2, name: 'HOD Under Review', fromStatus: WorkflowStatus.SUBMITTED, toStatus: WorkflowStatus.UNDER_REVIEW, requiredRole: Role.ROLE_HOD },
          { stepOrder: 3, name: 'HOD Approval', fromStatus: WorkflowStatus.UNDER_REVIEW, toStatus: WorkflowStatus.APPROVED, requiredRole: Role.ROLE_HOD },
          { stepOrder: 4, name: 'HOD Rejection', fromStatus: WorkflowStatus.UNDER_REVIEW, toStatus: WorkflowStatus.REJECTED, requiredRole: Role.ROLE_HOD },
          { stepOrder: 5, name: 'Fulfill Request', fromStatus: WorkflowStatus.APPROVED, toStatus: WorkflowStatus.COMPLETED, requiredRole: Role.ROLE_HOD },
        ],
      },
    },
  });

  const facultyActWf = await prisma.workflow.create({
    data: {
      code: 'FACULTY_ACTIVITY',
      name: 'Faculty Departmental Activity Workflow',
      description: 'Formal proposal and sanctioning workflow for seminars, workshops, symposiums, and guest lectures',
      initialStatus: WorkflowStatus.DRAFT,
      steps: {
        create: [
          { stepOrder: 1, name: 'Submit Activity Proposal', fromStatus: WorkflowStatus.DRAFT, toStatus: WorkflowStatus.SUBMITTED, requiredRole: Role.ROLE_FACULTY },
          { stepOrder: 2, name: 'HOD Review', fromStatus: WorkflowStatus.SUBMITTED, toStatus: WorkflowStatus.UNDER_REVIEW, requiredRole: Role.ROLE_HOD },
          { stepOrder: 3, name: 'HOD Approval', fromStatus: WorkflowStatus.UNDER_REVIEW, toStatus: WorkflowStatus.APPROVED, requiredRole: Role.ROLE_HOD },
          { stepOrder: 4, name: 'HOD Rejection', fromStatus: WorkflowStatus.UNDER_REVIEW, toStatus: WorkflowStatus.REJECTED, requiredRole: Role.ROLE_HOD },
          { stepOrder: 5, name: 'Complete Activity', fromStatus: WorkflowStatus.APPROVED, toStatus: WorkflowStatus.COMPLETED, requiredRole: Role.ROLE_HOD },
        ],
      },
    },
  });

  const projectPropWf = await prisma.workflow.create({
    data: {
      code: 'PROJECT_PROPOSAL',
      name: 'Faculty Project Proposal Approval Workflow',
      description: 'Verification of academic capstone/research project proposals before publication to student allocation pool',
      initialStatus: WorkflowStatus.DRAFT,
      steps: {
        create: [
          { stepOrder: 1, name: 'Submit Proposal', fromStatus: WorkflowStatus.DRAFT, toStatus: WorkflowStatus.SUBMITTED, requiredRole: Role.ROLE_FACULTY },
          { stepOrder: 2, name: 'HOD Approval', fromStatus: WorkflowStatus.SUBMITTED, toStatus: WorkflowStatus.APPROVED, requiredRole: Role.ROLE_HOD },
          { stepOrder: 3, name: 'HOD Rejection', fromStatus: WorkflowStatus.SUBMITTED, toStatus: WorkflowStatus.REJECTED, requiredRole: Role.ROLE_HOD },
        ],
      },
    },
  });

  console.log('✅ Created Workflows and Steps.');

  // 5. Users & Profiles
  // Standard demo password hash: Demo@123
  const demoPasswordHash = await bcrypt.hash('Demo@123', 10);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@department.local',
      passwordHash: demoPasswordHash,
      name: 'Dr. Vikram Seth',
      phone: '+91 98765 43210',
      role: Role.ROLE_ADMIN,
    },
  });

  // HOD
  const hodUser = await prisma.user.create({
    data: {
      email: 'hod@department.local',
      passwordHash: demoPasswordHash,
      name: 'Dr. K. Ramanathan',
      phone: '+91 98765 43211',
      role: Role.ROLE_HOD,
      facultyProfile: {
        create: {
          employeeId: 'EMP-CSE-001',
          departmentId: cseDept.id,
          designation: 'Professor & Head of Department',
          specialization: 'Distributed Systems & Cloud Computing',
          cabinNumber: 'A-201, Academic Block',
        },
      },
    },
    include: { facultyProfile: true },
  });

  // Faculty 1
  const faculty1User = await prisma.user.create({
    data: {
      email: 'faculty1@department.local',
      passwordHash: demoPasswordHash,
      name: 'Prof. Anita Sharma',
      phone: '+91 98765 43212',
      role: Role.ROLE_FACULTY,
      facultyProfile: {
        create: {
          employeeId: 'EMP-CSE-002',
          departmentId: cseDept.id,
          designation: 'Associate Professor',
          specialization: 'Artificial Intelligence, NLP & Computer Vision',
          cabinNumber: 'B-104, IT Wing',
        },
      },
    },
    include: { facultyProfile: true },
  });

  // Faculty 2
  const faculty2User = await prisma.user.create({
    data: {
      email: 'faculty2@department.local',
      passwordHash: demoPasswordHash,
      name: 'Dr. Rajesh Verma',
      phone: '+91 98765 43213',
      role: Role.ROLE_FACULTY,
      facultyProfile: {
        create: {
          employeeId: 'EMP-CSE-003',
          departmentId: cseDept.id,
          designation: 'Assistant Professor (Senior Grade)',
          specialization: 'Cybersecurity, Cryptography & Network Protocols',
          cabinNumber: 'B-108, IT Wing',
        },
      },
    },
    include: { facultyProfile: true },
  });

  // Student 1 (Rahul Verma)
  const student1User = await prisma.user.create({
    data: {
      email: 'student1@department.local',
      passwordHash: demoPasswordHash,
      name: 'Rahul Verma',
      phone: '+91 98765 43214',
      role: Role.ROLE_STUDENT,
      studentProfile: {
        create: {
          rollNumber: '23CS001',
          programId: btechProg.id,
          batchId: batch2023.id,
          currentSemester: 6,
          cgpa: 8.92,
        },
      },
    },
    include: { studentProfile: true },
  });

  // Student 2 (Priya Patel)
  const student2User = await prisma.user.create({
    data: {
      email: 'student2@department.local',
      passwordHash: demoPasswordHash,
      name: 'Priya Patel',
      phone: '+91 98765 43215',
      role: Role.ROLE_STUDENT,
      studentProfile: {
        create: {
          rollNumber: '23CS002',
          programId: btechProg.id,
          batchId: batch2023.id,
          currentSemester: 6,
          cgpa: 9.15,
        },
      },
    },
    include: { studentProfile: true },
  });

  console.log('✅ Created 6 Demo Users & Profiles (Admin, HOD, 2 Faculty, 2 Students).');

  // 6. Projects
  // Project 1 (Faculty 1 - Approved)
  const project1 = await prisma.project.create({
    data: {
      facultyId: faculty1User.id,
      departmentId: cseDept.id,
      programId: btechProg.id,
      batchId: batch2023.id,
      title: 'Autonomous Drone Navigation via Deep Reinforcement Learning',
      projectCode: 'PRJ-CSE-2026-001',
      description: 'Developing continuous-space navigation and obstacle avoidance models for micro-UAVs in GPS-denied indoor environments using actor-critic reinforcement learning.',
      domain: 'Artificial Intelligence & Robotics',
      technologies: 'Python, PyTorch, ROS 2, Gazebo, OpenCV',
      difficulty: ProjectDifficulty.ADVANCED,
      maxStudents: 2,
      allocatedCount: 0,
      status: ProjectStatus.APPROVED,
    },
  });

  // Project 2 (Faculty 2 - Approved)
  const project2 = await prisma.project.create({
    data: {
      facultyId: faculty2User.id,
      departmentId: cseDept.id,
      programId: btechProg.id,
      batchId: batch2023.id,
      title: 'Blockchain-Based Academic Credential Verification System',
      projectCode: 'PRJ-CSE-2026-002',
      description: 'A tamper-proof decentralized identity and diploma verification platform built on Ethereum smart contracts and IPFS for zero-trust accreditation.',
      domain: 'Blockchain & Cryptography',
      technologies: 'Solidity, Ethereum, IPFS, React, Node.js, Web3.js',
      difficulty: ProjectDifficulty.MEDIUM,
      maxStudents: 2,
      allocatedCount: 1, // Student 2 allocated
      status: ProjectStatus.APPROVED,
    },
  });

  // Project 3 (Faculty 1 - Approved)
  const project3 = await prisma.project.create({
    data: {
      facultyId: faculty1User.id,
      departmentId: cseDept.id,
      programId: btechProg.id,
      batchId: batch2023.id,
      title: 'Privacy-Preserving Federated Learning for Multi-Hospital Clinical Diagnostics',
      projectCode: 'PRJ-CSE-2026-003',
      description: 'Collaborative medical imaging classification across distributed nodes without exchanging raw patient health records, adhering to differential privacy boundaries.',
      domain: 'Healthcare AI & Federated Systems',
      technologies: 'PyTorch, Flower Framework, Differential Privacy, Docker',
      difficulty: ProjectDifficulty.ADVANCED,
      maxStudents: 2,
      allocatedCount: 0,
      status: ProjectStatus.APPROVED,
    },
  });

  // Project 4 (Faculty 2 - Approved)
  const project4 = await prisma.project.create({
    data: {
      facultyId: faculty2User.id,
      departmentId: cseDept.id,
      programId: btechProg.id,
      batchId: batch2023.id,
      title: 'Zero-Trust Microservice Architecture with eBPF Kernel Observability',
      projectCode: 'PRJ-CSE-2026-004',
      description: 'High-throughput kernel-level packet inspection, security policy enforcement, and distributed telemetry collection for Kubernetes cloud-native workloads.',
      domain: 'Cloud Systems & Operating Systems',
      technologies: 'Go, eBPF, Cilium, Kubernetes, Prometheus, Grafana',
      difficulty: ProjectDifficulty.ADVANCED,
      maxStudents: 2,
      allocatedCount: 0,
      status: ProjectStatus.APPROVED,
    },
  });

  // Project 5 (Faculty 1 - Pending Proposal for Demo 4 & 5)
  const wfInstProject5 = await prisma.workflowInstance.create({
    data: {
      workflowId: projectPropWf.id,
      entityType: WorkflowEntityType.PROJECT,
      entityId: 'temp',
      currentStatus: WorkflowStatus.SUBMITTED,
      createdById: faculty1User.id,
    },
  });

  const project5 = await prisma.project.create({
    data: {
      facultyId: faculty1User.id,
      departmentId: cseDept.id,
      programId: btechProg.id,
      batchId: batch2023.id,
      title: 'Edge-AI Smart Campus Energy Management System',
      projectCode: 'PRJ-CSE-2026-005',
      description: 'Ultra-low-power microcontrollers equipped with quantization-aware neural models for proactive HVAC and lighting optimization across college laboratory complexes.',
      domain: 'IoT & Embedded Machine Learning',
      technologies: 'TensorFlow Lite for Microcontrollers, ESP32, MQTT, InfluxDB',
      difficulty: ProjectDifficulty.MEDIUM,
      maxStudents: 2,
      allocatedCount: 0,
      status: ProjectStatus.PENDING_APPROVAL,
      workflowInstanceId: wfInstProject5.id,
    },
  });

  await prisma.workflowInstance.update({
    where: { id: wfInstProject5.id },
    data: { entityId: project5.id },
  });

  await prisma.approvalTask.create({
    data: {
      workflowInstanceId: wfInstProject5.id,
      assignedRole: Role.ROLE_HOD,
      status: TaskStatus.PENDING,
    },
  });

  await prisma.workflowHistory.create({
    data: {
      workflowInstanceId: wfInstProject5.id,
      actorId: faculty1User.id,
      actorRole: Role.ROLE_FACULTY,
      action: 'SUBMIT_PROPOSAL',
      previousStatus: WorkflowStatus.DRAFT,
      newStatus: WorkflowStatus.SUBMITTED,
      comments: 'Project proposal submitted for HOD review & approval into the 2026 Capstone Pool.',
    },
  });

  console.log('✅ Created 5 Projects (4 Approved, 1 Pending HOD review).');

  // 7. Student Requests & Approval Workflow
  // Request 1: Student 1 (Rahul Verma) - SUBMITTED (Ready for HOD Demo 2!)
  const wfInstReq1 = await prisma.workflowInstance.create({
    data: {
      workflowId: studentReqWf.id,
      entityType: WorkflowEntityType.REQUEST,
      entityId: 'temp',
      currentStatus: WorkflowStatus.SUBMITTED,
      createdById: student1User.id,
    },
  });

  const request1 = await prisma.request.create({
    data: {
      studentId: student1User.id,
      requestType: RequestType.SEMINAR_PERMISSION,
      title: 'Permission to attend National AI Research Summit 2026 at IIT Bombay',
      description: 'Requesting on-duty (OD) leave for 3 days (October 12-14) to present a research paper entitled "Federated Privacy in Medical Diagnostics". Transportation and accommodation supported by conference scholarship.',
      status: WorkflowStatus.SUBMITTED,
      currentApprover: Role.ROLE_HOD,
      workflowInstanceId: wfInstReq1.id,
    },
  });

  await prisma.workflowInstance.update({
    where: { id: wfInstReq1.id },
    data: { entityId: request1.id },
  });

  await prisma.approvalTask.create({
    data: {
      workflowInstanceId: wfInstReq1.id,
      assignedRole: Role.ROLE_HOD,
      status: TaskStatus.PENDING,
    },
  });

  await prisma.workflowHistory.create({
    data: {
      workflowInstanceId: wfInstReq1.id,
      actorId: student1User.id,
      actorRole: Role.ROLE_STUDENT,
      action: 'SUBMIT_REQUEST',
      previousStatus: WorkflowStatus.DRAFT,
      newStatus: WorkflowStatus.SUBMITTED,
      comments: 'Request submitted with accepted conference invitation paper.',
    },
  });

  // Request 2: Student 2 (Priya Patel) - APPROVED (Completed History)
  const wfInstReq2 = await prisma.workflowInstance.create({
    data: {
      workflowId: studentReqWf.id,
      entityType: WorkflowEntityType.REQUEST,
      entityId: 'temp',
      currentStatus: WorkflowStatus.APPROVED,
      createdById: student2User.id,
    },
  });

  const request2 = await prisma.request.create({
    data: {
      studentId: student2User.id,
      requestType: RequestType.RESOURCE_REQUEST,
      title: 'High-Performance GPU Server Access for Thesis Simulation',
      description: 'Requesting cluster computing compute credentials for 40 hours of LLM fine-tuning on the departmental NVIDIA A100 server.',
      status: WorkflowStatus.APPROVED,
      currentApprover: Role.ROLE_HOD,
      workflowInstanceId: wfInstReq2.id,
    },
  });

  await prisma.workflowInstance.update({
    where: { id: wfInstReq2.id },
    data: { entityId: request2.id },
  });

  await prisma.workflowHistory.createMany({
    data: [
      {
        workflowInstanceId: wfInstReq2.id,
        actorId: student2User.id,
        actorRole: Role.ROLE_STUDENT,
        action: 'SUBMIT_REQUEST',
        previousStatus: WorkflowStatus.DRAFT,
        newStatus: WorkflowStatus.SUBMITTED,
        comments: 'Requisition submitted along with project mentor endorsement.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        workflowInstanceId: wfInstReq2.id,
        actorId: hodUser.id,
        actorRole: Role.ROLE_HOD,
        action: 'APPROVE_REQUEST',
        previousStatus: WorkflowStatus.SUBMITTED,
        newStatus: WorkflowStatus.APPROVED,
        comments: 'Sanctioned. Lab admin instructed to generate GPU credentials for 40 compute hours.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Created Student Requests with Workflows, Tasks, and Timelines.');

  // 8. Department Activities
  // Activity 1: Approved Workshop
  const wfInstAct1 = await prisma.workflowInstance.create({
    data: {
      workflowId: facultyActWf.id,
      entityType: WorkflowEntityType.ACTIVITY,
      entityId: 'temp',
      currentStatus: WorkflowStatus.APPROVED,
      createdById: faculty1User.id,
    },
  });

  const activity1 = await prisma.activity.create({
    data: {
      departmentId: cseDept.id,
      facultyId: faculty1User.id,
      title: 'Hands-on Workshop on Generative AI and Large Language Models',
      activityType: ActivityType.WORKSHOP,
      description: 'Comprehensive 2-day hands-on workshop for 3rd and 4th year CSE students covering Transformers, Fine-Tuning with LoRA, and Vector Databases (Pinecone/Milvus).',
      proposedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      venue: 'CSE High Performance Computing Lab (Room 302)',
      expectedParticipants: 120,
      budget: 25000.0,
      organizer: 'AI Research Group & ACM Student Chapter',
      status: WorkflowStatus.APPROVED,
      workflowInstanceId: wfInstAct1.id,
    },
  });

  await prisma.workflowInstance.update({
    where: { id: wfInstAct1.id },
    data: { entityId: activity1.id },
  });

  // Activity 2: Submitted Guest Lecture
  const wfInstAct2 = await prisma.workflowInstance.create({
    data: {
      workflowId: facultyActWf.id,
      entityType: WorkflowEntityType.ACTIVITY,
      entityId: 'temp',
      currentStatus: WorkflowStatus.SUBMITTED,
      createdById: faculty2User.id,
    },
  });

  const activity2 = await prisma.activity.create({
    data: {
      departmentId: cseDept.id,
      facultyId: faculty2User.id,
      title: 'Distinguished Lecture: Modern Zero-Day Vulnerability Research and Exploit Mitigation',
      activityType: ActivityType.GUEST_LECTURE,
      description: 'Industry guest lecture by Chief Security Architect at Cloudflare on kernel exploit defense and memory safety transitions in infrastructure.',
      proposedDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      venue: 'Main Auditorium B',
      expectedParticipants: 250,
      budget: 15000.0,
      organizer: 'Cybersecurity Club & Dr. Rajesh Verma',
      status: WorkflowStatus.SUBMITTED,
      workflowInstanceId: wfInstAct2.id,
    },
  });

  await prisma.workflowInstance.update({
    where: { id: wfInstAct2.id },
    data: { entityId: activity2.id },
  });

  await prisma.approvalTask.create({
    data: {
      workflowInstanceId: wfInstAct2.id,
      assignedRole: Role.ROLE_HOD,
      status: TaskStatus.PENDING,
    },
  });

  console.log('✅ Created Department Activities.');

  // 9. Project Preferences & Allocation
  // Seed preferences for Student 1 (Rahul Verma)
  if (student1User.studentProfile) {
    await prisma.projectPreference.createMany({
      data: [
        {
          studentProfileId: student1User.studentProfile.id,
          projectId: project1.id,
          rank: 1,
        },
        {
          studentProfileId: student1User.studentProfile.id,
          projectId: project2.id,
          rank: 2,
        },
        {
          studentProfileId: student1User.studentProfile.id,
          projectId: project3.id,
          rank: 3,
        },
      ],
    });
  }

  // Pre-allocate Student 2 (Priya Patel) to Project 2 (FINALIZED)
  if (student2User.studentProfile) {
    await prisma.projectPreference.createMany({
      data: [
        {
          studentProfileId: student2User.studentProfile.id,
          projectId: project2.id,
          rank: 1,
        },
        {
          studentProfileId: student2User.studentProfile.id,
          projectId: project4.id,
          rank: 2,
        },
      ],
    });

    await prisma.projectAllocation.create({
      data: {
        projectId: project2.id,
        studentProfileId: student2User.studentProfile.id,
        status: AllocationStatus.FINALIZED,
        allocatedById: hodUser.id,
        allocationReason: 'Assigned 1st Preference based on Academic Merit (CGPA: 9.15)',
      },
    });
  }

  console.log('✅ Created Project Preferences and Demo Allocation.');

  // 10. Announcements
  await prisma.announcement.createMany({
    data: [
      {
        authorId: hodUser.id,
        title: 'Capstone Project Allocation Cycle 2026 Initiated',
        content: 'All 6th semester B.Tech CSE students must review the approved project pool and submit their 3 ranked preferences prior to Friday, 5:00 PM. Allocation will be computed deterministically based on capacity and preferences.',
        audience: AnnouncementAudience.STUDENTS,
        priority: AnnouncementPriority.HIGH,
        publishDate: new Date(),
      },
      {
        authorId: hodUser.id,
        title: 'Faculty Academic Research & Activity Grant Applications Open',
        content: 'Faculty colleagues are requested to submit workshop and seminar requisitions via the portal by end of week for budget allocations.',
        audience: AnnouncementAudience.FACULTY,
        priority: AnnouncementPriority.NORMAL,
        publishDate: new Date(),
      },
      {
        authorId: adminUser.id,
        title: 'Annual Department Tech Symposium & Hackathon "HackCSE 2026"',
        content: 'Registration opens next Monday for the 48-hour national collegiate hackathon. Themes include Web3, AI, and Cloud Infrastructure.',
        audience: AnnouncementAudience.ALL,
        priority: AnnouncementPriority.URGENT,
        publishDate: new Date(),
      },
    ],
  });

  // 11. Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientId: hodUser.id,
        title: 'New Student Approval Request Pending',
        message: 'Rahul Verma has submitted a request for Seminar Permission (AI Summit).',
        type: NotificationType.ACTION_REQUIRED,
        link: '/approvals',
      },
      {
        recipientId: hodUser.id,
        title: 'New Project Proposal Pending Approval',
        message: 'Prof. Anita Sharma submitted project proposal "Edge-AI Smart Campus Energy Management".',
        type: NotificationType.ACTION_REQUIRED,
        link: '/approvals',
      },
      {
        recipientId: faculty1User.id,
        title: 'Activity Sanctioned by HOD',
        message: 'Your activity proposal "Hands-on Workshop on Generative AI" was approved.',
        type: NotificationType.SUCCESS,
        link: '/activities',
      },
      {
        recipientId: student2User.id,
        title: 'Project Capstone Allocation Confirmed',
        message: 'You have been successfully allocated to Project PRJ-CSE-2026-002: Blockchain-Based Academic Credential Verification System.',
        type: NotificationType.SUCCESS,
        link: '/projects/my-allocation',
      },
    ],
  });

  // 12. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        actorRole: Role.ROLE_ADMIN,
        action: 'SYSTEM_BOOTSTRAP',
        entityType: 'SYSTEM',
        entityId: 'GLOBAL',
        newValue: JSON.stringify({ status: 'Department Management System initialized with CSE schema.' }),
      },
      {
        actorId: hodUser.id,
        actorRole: Role.ROLE_HOD,
        action: 'APPROVE_ACTIVITY',
        entityType: 'ACTIVITY',
        entityId: activity1.id,
        newValue: JSON.stringify({ title: activity1.title, budget: activity1.budget }),
      },
      {
        actorId: hodUser.id,
        actorRole: Role.ROLE_HOD,
        action: 'ALLOCATE_PROJECT',
        entityType: 'PROJECT_ALLOCATION',
        entityId: project2.id,
        newValue: JSON.stringify({ student: '23CS002', project: project2.projectCode }),
      },
    ],
  });

  console.log('✅ Created Announcements, Notifications, and Audit Logs.');
  console.log('🚀 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
