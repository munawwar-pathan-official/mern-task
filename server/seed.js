const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Case = require('./models/Case');
const Document = require('./models/Document');
const Comment = require('./models/Comment');
const AuditLog = require('./models/AuditLog');

dotenv.config();

const seedDatabase = async (force = false) => {
  try {
    const userCount = await User.countDocuments({});
    if (userCount > 0 && !force) {
      console.log(`Database already has ${userCount} users. Skipping automatic seed.`);
      return;
    }

    console.log('Seeding initial database collections...');
    if (force) {
      await User.deleteMany({});
      await Case.deleteMany({});
      await Document.deleteMany({});
      await Comment.deleteMany({});
      await AuditLog.deleteMany({});
    }

    console.log('Creating seed users...');
    const manager = await User.create({
      name: 'Sarah Jenkins (Manager)',
      email: 'manager@example.com',
      password: 'password123',
      role: 'Manager',
    });

    const agent1 = await User.create({
      name: 'Alex Vance (Senior Agent)',
      email: 'agent1@example.com',
      password: 'password123',
      role: 'Agent',
    });

    const agent2 = await User.create({
      name: 'Maria Miller (Field Agent)',
      email: 'agent2@example.com',
      password: 'password123',
      role: 'Agent',
    });

    console.log('Creating sample cases with status timeline and audit trails...');

    // Case 1: New
    const case1 = await Case.create({
      clientName: 'Apex Financial Holdings',
      subjectName: 'Robert Sterling',
      caseType: 'Background Verification',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      status: 'New',
      assignedTo: null,
      createdBy: manager._id,
    });
    await AuditLog.create({
      caseId: case1._id,
      changedBy: manager._id,
      action: 'CASE_CREATED',
      fromStatus: null,
      toStatus: 'New',
      details: 'Case initiated by Manager',
    });

    // Case 2: Assigned
    const case2 = await Case.create({
      clientName: 'Vanguard Global Corp',
      subjectName: 'Elena Rostova',
      caseType: 'Corporate Fraud Audit',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'Assigned',
      assignedTo: agent1._id,
      createdBy: manager._id,
    });
    await AuditLog.create({
      caseId: case2._id,
      changedBy: manager._id,
      action: 'CASE_CREATED',
      fromStatus: null,
      toStatus: 'New',
      details: 'Case created by Manager',
    });
    await AuditLog.create({
      caseId: case2._id,
      changedBy: manager._id,
      action: 'CASE_ASSIGNED',
      fromStatus: 'New',
      toStatus: 'Assigned',
      details: `Assigned case to ${agent1.name}`,
    });

    // Case 3: In Progress
    const case3 = await Case.create({
      clientName: 'Horizon Real Estate Ltd',
      subjectName: 'David K. Miller',
      caseType: 'Site Verification',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'In Progress',
      assignedTo: agent1._id,
      createdBy: manager._id,
    });
    await AuditLog.create({
      caseId: case3._id,
      changedBy: manager._id,
      action: 'CASE_CREATED',
      fromStatus: null,
      toStatus: 'New',
      details: 'Case created by Manager',
    });
    await AuditLog.create({
      caseId: case3._id,
      changedBy: manager._id,
      action: 'CASE_ASSIGNED',
      fromStatus: 'New',
      toStatus: 'Assigned',
      details: `Assigned case to ${agent1.name}`,
    });
    await AuditLog.create({
      caseId: case3._id,
      changedBy: agent1._id,
      action: 'STATUS_CHANGE',
      fromStatus: 'Assigned',
      toStatus: 'In Progress',
      details: 'Agent commenced field investigation and document retrieval.',
    });
    await Comment.create({
      caseId: case3._id,
      author: agent1._id,
      text: 'Visited the site location on 5th Ave. Preliminary land registry matches subject details.',
    });

    // Case 4: Submitted (Pending Manager Review)
    const case4 = await Case.create({
      clientName: 'BioHealth Tech Inc',
      subjectName: 'Dr. Arthur Pendelton',
      caseType: 'Credential & Medical Audit',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'Submitted',
      assignedTo: agent2._id,
      createdBy: manager._id,
    });
    await AuditLog.create({
      caseId: case4._id,
      changedBy: manager._id,
      action: 'CASE_CREATED',
      fromStatus: null,
      toStatus: 'New',
      details: 'Case created by Manager',
    });
    await AuditLog.create({
      caseId: case4._id,
      changedBy: manager._id,
      action: 'CASE_ASSIGNED',
      fromStatus: 'New',
      toStatus: 'Assigned',
      details: `Assigned case to ${agent2.name}`,
    });
    await AuditLog.create({
      caseId: case4._id,
      changedBy: agent2._id,
      action: 'STATUS_CHANGE',
      fromStatus: 'Assigned',
      toStatus: 'In Progress',
      details: 'Work started by agent.',
    });
    await AuditLog.create({
      caseId: case4._id,
      changedBy: agent2._id,
      action: 'STATUS_CHANGE',
      fromStatus: 'In Progress',
      toStatus: 'Submitted',
      details: 'All medical license verifications attached and ready for review.',
    });
    await Comment.create({
      caseId: case4._id,
      author: agent2._id,
      text: 'University verification seal attached. Board certification active.',
    });

    // Case 5: Cleared
    const case5 = await Case.create({
      clientName: 'Starlight Capital Partner',
      subjectName: 'Chloe Bennett',
      caseType: 'Financial Integrity Check',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'Cleared',
      assignedTo: agent2._id,
      createdBy: manager._id,
    });
    await AuditLog.create({
      caseId: case5._id,
      changedBy: manager._id,
      action: 'STATUS_CHANGE',
      fromStatus: 'Submitted',
      toStatus: 'Cleared',
      details: 'Reviewed and verified clean background report by Manager.',
    });

    // Case 6: Discrepant
    const case6 = await Case.create({
      clientName: 'Global Logistics Alliance',
      subjectName: 'Marcus Thorne',
      caseType: 'Employment Verification',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'Discrepant',
      assignedTo: agent1._id,
      createdBy: manager._id,
    });
    await AuditLog.create({
      caseId: case6._id,
      changedBy: manager._id,
      action: 'STATUS_CHANGE',
      fromStatus: 'Submitted',
      toStatus: 'Discrepant',
      details: 'Discrepancy found: Discrepant employment dates reported by past employer.',
    });
    await Comment.create({
      caseId: case6._id,
      author: manager._id,
      text: 'Previous employer HR confirmed subject departed in 2022, not 2024 as claimed on resume.',
    });

    console.log('Seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Manager Login : manager@example.com / password123');
    console.log('Agent 1 Login : agent1@example.com  / password123');
    console.log('Agent 2 Login : agent2@example.com  / password123');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

if (require.main === module) {
  connectDB().then(() => seedDatabase(true).then(() => process.exit(0)));
}

module.exports = seedDatabase;
