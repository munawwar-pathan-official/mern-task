const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// Valid state machine map
const VALID_TRANSITIONS = {
  New: ['Assigned'],
  Assigned: ['In Progress', 'Assigned'], // 'Assigned' allows re-assignment
  'In Progress': ['Submitted'],
  Submitted: ['Cleared', 'Discrepant'],
  Cleared: [],
  Discrepant: [],
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private (Manager only)
const createCase = async (req, res) => {
  try {
    const { clientName, subjectName, caseType, dueDate, assignedTo } = req.body;

    let initialStatus = 'New';
    let assignedAgentId = null;

    if (assignedTo) {
      const agent = await User.findById(assignedTo);
      if (!agent || agent.role !== 'Agent') {
        return res.status(400).json({ message: 'Invalid agent selected for assignment' });
      }
      assignedAgentId = assignedTo;
      initialStatus = 'Assigned';
    }

    const newCase = await Case.create({
      clientName,
      subjectName,
      caseType,
      dueDate,
      status: initialStatus,
      assignedTo: assignedAgentId,
      createdBy: req.user._id,
    });

    // Create Audit Log
    await AuditLog.create({
      caseId: newCase._id,
      changedBy: req.user._id,
      action: 'CASE_CREATED',
      fromStatus: null,
      toStatus: initialStatus,
      details: assignedAgentId
        ? `Case created and directly assigned to Agent`
        : `Case created with status 'New'`,
    });

    const populatedCase = await Case.findById(newCase._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    res.status(201).json(populatedCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cases with search, filter, pagination
// @route   GET /api/cases
// @access  Private (Manager sees all; Agent sees assigned cases)
const getCases = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, status, agent } = req.query;

    let query = {};

    // Agent can ONLY see cases assigned to them
    if (req.user.role === 'Agent') {
      query.assignedTo = req.user._id;
    } else if (agent) {
      // Manager filtering by specific agent
      query.assignedTo = agent;
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Search filter across clientName, subjectName, caseType
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { subjectName: { $regex: search, $options: 'i' } },
        { caseType: { $regex: search, $options: 'i' } },
      ];
    }

    const totalCases = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      cases,
      page,
      pages: Math.ceil(totalCases / limit) || 1,
      totalCases,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single case details
// @route   GET /api/cases/:id
// @access  Private
const getCaseById = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    if (!singleCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Enforce Agent access restriction
    if (
      req.user.role === 'Agent' &&
      (!singleCase.assignedTo || singleCase.assignedTo._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied: You can only view cases assigned to you' });
    }

    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign Case to Agent (Manager Only)
// @route   PUT /api/cases/:id/assign
// @access  Private (Manager only)
const assignCase = async (req, res) => {
  try {
    const { agentId } = req.body;

    const existingCase = await Case.findById(req.params.id);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'Agent') {
      return res.status(400).json({ message: 'Target user is not a valid Agent' });
    }

    const fromStatus = existingCase.status;
    let toStatus = fromStatus === 'New' ? 'Assigned' : fromStatus;

    existingCase.assignedTo = agentId;
    existingCase.status = toStatus;
    await existingCase.save();

    // Create Audit Log
    await AuditLog.create({
      caseId: existingCase._id,
      changedBy: req.user._id,
      action: 'CASE_ASSIGNED',
      fromStatus,
      toStatus,
      details: `Assigned case to agent ${agent.name} (${agent.email})`,
    });

    const updatedCase = await Case.findById(existingCase._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Case Status (Server-side state machine transition check)
// @route   PUT /api/cases/:id/status
// @access  Private
const updateCaseStatus = async (req, res) => {
  try {
    const { newStatus, note } = req.body;

    const existingCase = await Case.findById(req.params.id);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Role check: Agent can only touch cases assigned to them
    if (req.user.role === 'Agent') {
      if (
        !existingCase.assignedTo ||
        existingCase.assignedTo.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: 'Forbidden: You can only update cases assigned to you' });
      }

      // Agents are only allowed to move to 'In Progress' or 'Submitted'
      if (!['In Progress', 'Submitted'].includes(newStatus)) {
        return res.status(403).json({
          message: `Agents cannot transition case status to '${newStatus}'.`,
        });
      }
    }

    // Managers are the only ones allowed to clear or mark discrepant
    if (['Cleared', 'Discrepant'].includes(newStatus) && req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Only Managers can mark a case as Cleared or Discrepant' });
    }

    const currentStatus = existingCase.status;

    // Validate Transition State Machine
    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      return res.status(400).json({
        message: `Invalid status transition: Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed next states: [${allowedNext.join(
          ', '
        )}]`,
      });
    }

    existingCase.status = newStatus;
    await existingCase.save();

    // Create Audit Log
    await AuditLog.create({
      caseId: existingCase._id,
      changedBy: req.user._id,
      action: 'STATUS_CHANGE',
      fromStatus: currentStatus,
      toStatus: newStatus,
      details: note || `Status updated from ${currentStatus} to ${newStatus}`,
    });

    const updatedCase = await Case.findById(existingCase._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Audit Logs for a Case
// @route   GET /api/cases/:id/audit-logs
// @access  Private
const getCaseAuditLogs = async (req, res) => {
  try {
    const existingCase = await Case.findById(req.params.id);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (
      req.user.role === 'Agent' &&
      (!existingCase.assignedTo || existingCase.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await AuditLog.find({ caseId: req.params.id })
      .populate('changedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  assignCase,
  updateCaseStatus,
  getCaseAuditLogs,
};
