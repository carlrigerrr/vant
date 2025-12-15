const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShiftAssignmentSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
  employeeName: String,
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
  clientName: String,
  shiftType: {
    type: String,
    enum: ['morning', 'mid', 'evening', 'custom'],
    default: 'morning'
  },
  startTime: { type: String, default: '08:00' },
  endTime: { type: String, default: '12:00' },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Job Checklist for quality control
  checklist: [{
    label: { type: String, required: true },
    completed: { type: Boolean, default: false },
    required: { type: Boolean, default: true },
    completedAt: { type: Date, default: null }
  }],
  id: String // For drag-drop functionality
}, { _id: false });

const Shift = new Schema({
  name: String,
  date: Date,
  startDate: { type: Date, default: Date.now }, // Actual first day of the schedule
  data: Object, // Legacy support - keeping old structure
  shifts: [ShiftAssignmentSchema], // New structure
  savedBy: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shift', Shift);
