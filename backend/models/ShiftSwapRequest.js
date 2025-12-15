const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShiftSwapRequest = new Schema({
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requesterName: { type: String },

    // Original shift details
    shiftId: { type: String },
    shiftDate: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String },

    // Swap target (if requesting specific person)
    targetEmployeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetEmployeeName: { type: String },

    reason: { type: String },

    // Status: pending, approved, denied, cancelled
    status: { type: String, enum: ['pending', 'approved', 'denied', 'cancelled'], default: 'pending' },

    // Admin response
    adminNote: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
}, {
    timestamps: true
});

module.exports = mongoose.model('ShiftSwapRequest', ShiftSwapRequest);
