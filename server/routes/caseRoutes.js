const express = require('express');
const { check } = require('express-validator');
const {
  createCase,
  getCases,
  getCaseById,
  assignCase,
  updateCaseStatus,
  getCaseAuditLogs,
} = require('../controllers/caseController');
const { uploadDocument, getCaseDocuments } = require('../controllers/documentController');
const { addComment, getCaseComments } = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

// Case CRUD
router.post(
  '/',
  protect,
  authorize('Manager'),
  [
    check('clientName', 'Client name is required').not().isEmpty(),
    check('subjectName', 'Subject name is required').not().isEmpty(),
    check('caseType', 'Case type is required').not().isEmpty(),
    check('dueDate', 'Valid due date is required').isISO8601(),
  ],
  validate,
  createCase
);

router.get('/', protect, getCases);
router.get('/:id', protect, getCaseById);

router.put(
  '/:id/assign',
  protect,
  authorize('Manager'),
  [check('agentId', 'Valid agentId is required').not().isEmpty()],
  validate,
  assignCase
);

router.put(
  '/:id/status',
  protect,
  [
    check('newStatus', 'New status is required')
      .isIn(['New', 'Assigned', 'In Progress', 'Submitted', 'Cleared', 'Discrepant']),
  ],
  validate,
  updateCaseStatus
);

router.get('/:id/audit-logs', protect, getCaseAuditLogs);

// Document attachments
router.post('/:id/documents', protect, upload.single('file'), uploadDocument);
router.get('/:id/documents', protect, getCaseDocuments);

// Comments
router.post(
  '/:id/comments',
  protect,
  [check('text', 'Comment text is required').not().isEmpty()],
  validate,
  addComment
);
router.get('/:id/comments', protect, getCaseComments);

module.exports = router;
