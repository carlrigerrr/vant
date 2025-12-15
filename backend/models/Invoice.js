const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const InvoiceItemSchema = new Schema({
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true }
}, { _id: false });

const InvoiceSchema = new Schema({
    // Invoice identification
    invoiceNumber: { type: String, required: true, unique: true },

    // Client reference
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientAddress: { type: String, default: '' },

    // Line items
    items: [InvoiceItemSchema],

    // Amounts
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' },

    // Dates
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date, default: null },

    // Status
    status: {
        type: String,
        enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },

    // Payment
    paymentToken: { type: String, default: null },
    paymentMethod: { type: String, default: null }, // 'stripe', 'cash', 'check', 'test'
    stripePaymentIntentId: { type: String, default: null },

    // PDF
    pdfPath: { type: String, default: null },

    // Reminders
    remindersSent: { type: Number, default: 0 },
    lastReminderAt: { type: Date, default: null },

    // Notes
    notes: { type: String, default: '' },
    internalNotes: { type: String, default: '' },

    // Reference to job/attendance (optional)
    attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', default: null }

}, {
    timestamps: true
});

// Generate unique payment token
InvoiceSchema.methods.generatePaymentToken = function () {
    this.paymentToken = crypto.randomBytes(32).toString('hex');
    return this.paymentToken;
};

// Generate invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function (prefix = 'INV') {
    const year = new Date().getFullYear();
    const count = await this.countDocuments({
        invoiceNumber: new RegExp(`^${prefix}-${year}-`)
    });
    const number = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}-${number}`;
};

// Check if overdue
InvoiceSchema.methods.isOverdue = function () {
    return this.status !== 'paid' && this.status !== 'cancelled' && new Date() > this.dueDate;
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
