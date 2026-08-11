const Comment = require('../models/Comment');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');

// @desc    Add comment/note to case
// @route   POST /api/cases/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const caseId = req.params.id;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (
      req.user.role === 'Agent' &&
      (!existingCase.assignedTo || existingCase.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Forbidden: You can only comment on assigned cases' });
    }

    const comment = await Comment.create({
      caseId,
      author: req.user._id,
      text,
    });

    // Create Audit Log
    await AuditLog.create({
      caseId,
      changedBy: req.user._id,
      action: 'COMMENT_ADDED',
      fromStatus: existingCase.status,
      toStatus: existingCase.status,
      details: `Added note: "${text.length > 50 ? text.substring(0, 47) + '...' : text}"`,
    });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name email role');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a case
// @route   GET /api/cases/:id/comments
// @access  Private
const getCaseComments = async (req, res) => {
  try {
    const caseId = req.params.id;

    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (
      req.user.role === 'Agent' &&
      (!existingCase.assignedTo || existingCase.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comments = await Comment.find({ caseId })
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addComment,
  getCaseComments,
};
