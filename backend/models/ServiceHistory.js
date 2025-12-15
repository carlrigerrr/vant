const mongoose = require('mongoose');

const serviceHistorySchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceDate: { type: Date, required: true },
    notes: { type: String },
    amount: { type: Number, default: 0 },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'cancelled'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
serviceHistorySchema.index({ clientId: 1, serviceDate: -1 });
serviceHistorySchema.index({ employeeId: 1, serviceDate: -1 });

module.exports = mongoose.model('ServiceHistory', serviceHistorySchema);
