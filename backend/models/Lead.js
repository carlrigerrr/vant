const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const LeadSchema = new Schema({
    // Contact Info
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },

    // Service Details
    serviceType: {
        type: String,
        enum: ['regular', 'deep-clean', 'move-out', 'move-in', 'one-time', 'other'],
        default: 'regular'
    },
    frequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly', 'one-time'],
        default: 'weekly'
    },

    // Quote
    quoteAmount: { type: Number, default: 0 },
    quoteSentAt: { type: Date, default: null },

    // Status Pipeline
    status: {
        type: String,
        enum: ['new', 'contacted', 'quoted', 'approved', 'converted', 'lost'],
        default: 'new'
    },

    // Approval Flow
    approvalToken: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    convertedClientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },

    // Notes
    notes: { type: String, default: '' },
    source: { type: String, default: 'manual' }, // 'manual', 'website', 'referral'

}, {
    timestamps: true
});

// Generate unique approval token
LeadSchema.methods.generateApprovalToken = function () {
    this.approvalToken = crypto.randomBytes(32).toString('hex');
    return this.approvalToken;
};

module.exports = mongoose.model('Lead', LeadSchema);
