const Document = require('../models/Document');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const path = require('path');
const fs = require('fs');

// @desc    Upload document to a case
// @route   POST /api/cases/:id/documents
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    const caseId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Please attach a document or photo to upload' });
    }

    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Role check for Agents
    if (
      req.user.role === 'Agent' &&
      (!existingCase.assignedTo || existingCase.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Forbidden: You can only upload files to your assigned cases' });
    }

    const doc = await Document.create({
      caseId,
      uploadedBy: req.user._id,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    // Create Audit Log
    await AuditLog.create({
      caseId,
      changedBy: req.user._id,
      action: 'DOCUMENT_UPLOADED',
      fromStatus: existingCase.status,
      toStatus: existingCase.status,
      details: `Uploaded document: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`,
    });

    const populatedDoc = await Document.findById(doc._id).populate('uploadedBy', 'name email role');

    res.status(201).json(populatedDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get documents for a case
// @route   GET /api/cases/:id/documents
// @access  Private
const getCaseDocuments = async (req, res) => {
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

    const docs = await Document.find({ caseId })
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDocument,
  getCaseDocuments,
};
