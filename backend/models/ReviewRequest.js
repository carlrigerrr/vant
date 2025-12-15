const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewRequestSchema = new Schema({
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
    scheduledFor: { type: Date, required: true },
    sentAt: { type: Date, default: null },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'skipped'],
        default: 'pending'
    },
    errorMessage: { type: String, default: null },
    // Prevent duplicate requests for same client on same day
    clientEmail: { type: String },
}, {
    timestamps: true
});

// Index for efficient querying of pending requests
reviewRequestSchema.index({ status: 1, scheduledFor: 1 });

// Prevent sending to same client more than once per day
reviewRequestSchema.index({ clientId: 1, createdAt: 1 });

module.exports = mongoose.model('ReviewRequest', reviewRequestSchema);
