const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Singleton pattern - only one settings document
    _id: { type: String, default: 'app_settings' },

    // Company/Branding info
    companyName: { type: String, default: 'Your Cleaning Company' },

    // SMTP Email Configuration (for SaaS - admin configurable)
    smtp: {
        host: { type: String, default: 'smtp.gmail.com' },
        port: { type: Number, default: 465 },
        secure: { type: Boolean, default: true },
        user: { type: String, default: '' },
        pass: { type: String, default: '' },
        senderName: { type: String, default: 'Shift Scheduler' } // Name shown in email "From" field
    },

    // Review Request Settings
    reviewRequests: {
        enabled: { type: Boolean, default: false },
        delayHours: { type: Number, default: 2, min: 0, max: 168 }, // 0-7 days
        googleReviewUrl: { type: String, default: '' },
        emailSubject: { type: String, default: 'How was your cleaning today?' },
        emailTemplate: {
            type: String,
            default: `Hi {{clientName}},

Thank you for choosing us for your cleaning today!

We'd love to hear how it went. If you have a moment, please leave us a quick review:

{{reviewLink}}

Your feedback helps us serve you better!

Best regards,
{{companyName}}`
        }
    },

    // Schedule Notification Settings
    scheduleNotifications: {
        enabled: { type: Boolean, default: true },
        dailyBriefingTime: { type: String, default: '06:00' }, // 24h format
        notifyOnChanges: { type: Boolean, default: true }
    },

    // Payment & Invoice Settings
    payment: {
        enabled: { type: Boolean, default: true },
        testMode: { type: Boolean, default: true }, // When true, payments are simulated
        currency: { type: String, default: 'USD' },
        taxRate: { type: Number, default: 0 }, // Percentage, e.g., 8.5 for 8.5%
        // Stripe settings (optional - for when going live)
        stripePublicKey: { type: String, default: '' },
        stripeSecretKey: { type: String, default: '' },
        // Invoice settings
        invoicePrefix: { type: String, default: 'INV' },
        paymentTermsDays: { type: Number, default: 14 }, // Due in X days
        reminderDays: { type: Number, default: 7 }, // Send reminder after X days overdue
        // Company details for invoice
        companyAddress: { type: String, default: '' },
        companyPhone: { type: String, default: '' }
    },

    // Job Completion Email Settings
    jobCompletionEmails: {
        sendToClient: { type: Boolean, default: true },
        sendToAdmin: { type: Boolean, default: false },
        adminEmail: { type: String, default: '' }, // Override admin email (optional)
        includePhotos: { type: Boolean, default: true },
        emailSubject: { type: String, default: '✅ Job Completed at {{clientAddress}}' }
    },

    // Default Checklist Templates
    defaultChecklist: [{
        label: { type: String },
        required: { type: Boolean, default: true }
    }],

    // Mileage Reimbursement Settings
    mileageReimbursement: {
        enabled: { type: Boolean, default: true },
        ratePerMile: { type: Number, default: 0.65 }, // IRS standard rate
        trackAutomatically: { type: Boolean, default: true } // Auto-calculate on check-out
    },

    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findById('app_settings');
    if (!settings) {
        settings = await this.create({ _id: 'app_settings' });
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

