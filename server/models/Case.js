const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    caseType: {
      type: String,
      required: [true, 'Case type is required'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['New', 'Assigned', 'In Progress', 'Submitted', 'Cleared', 'Discrepant'],
      default: 'New',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual for id formatting
caseSchema.set('toJSON', { virtuals: true });
caseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Case', caseSchema);
