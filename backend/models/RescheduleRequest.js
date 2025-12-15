const mongoose = require('mongoose');

const rescheduleRequestSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    originalDate: { type: Date, required: true },
    requestedDate: { type: Date, required: true },
    reason: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending'
    },
    adminNote: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RescheduleRequest', rescheduleRequestSchema);
