const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const ReviewRequest = require('../models/ReviewRequest');
const { testSmtpConnection, processReviewRequests } = require('../services/emailService');

// Middleware to check admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// Get all settings (admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update settings (admin only)
router.put('/', isAdmin, async (req, res) => {
    try {
        console.log('[Settings PUT] Received body keys:', Object.keys(req.body));
        console.log('[Settings PUT] defaultChecklist:', req.body.defaultChecklist);

        const { companyName, reviewRequests, smtp } = req.body;

        const updateData = { updatedAt: new Date() };

        if (companyName !== undefined) {
            updateData.companyName = companyName;
        }

        // SMTP Settings
        if (smtp !== undefined) {
            if (smtp.host !== undefined) updateData['smtp.host'] = smtp.host;
            if (smtp.port !== undefined) updateData['smtp.port'] = smtp.port;
            if (smtp.secure !== undefined) updateData['smtp.secure'] = smtp.secure;
            if (smtp.user !== undefined) updateData['smtp.user'] = smtp.user;
            if (smtp.pass !== undefined) updateData['smtp.pass'] = smtp.pass;
            if (smtp.senderName !== undefined) updateData['smtp.senderName'] = smtp.senderName;
        }

        // Review Request Settings
        if (reviewRequests !== undefined) {
            if (reviewRequests.enabled !== undefined) {
                updateData['reviewRequests.enabled'] = reviewRequests.enabled;
            }
            if (reviewRequests.delayHours !== undefined) {
                updateData['reviewRequests.delayHours'] = Math.max(0, Math.min(168, reviewRequests.delayHours));
            }
            if (reviewRequests.googleReviewUrl !== undefined) {
                updateData['reviewRequests.googleReviewUrl'] = reviewRequests.googleReviewUrl;
            }
            if (reviewRequests.emailSubject !== undefined) {
                updateData['reviewRequests.emailSubject'] = reviewRequests.emailSubject;
            }
            if (reviewRequests.emailTemplate !== undefined) {
                updateData['reviewRequests.emailTemplate'] = reviewRequests.emailTemplate;
            }
        }

        // Schedule Notification Settings
        const { scheduleNotifications } = req.body;
        if (scheduleNotifications !== undefined) {
            if (scheduleNotifications.enabled !== undefined) {
                updateData['scheduleNotifications.enabled'] = scheduleNotifications.enabled;
            }
            if (scheduleNotifications.dailyBriefingTime !== undefined) {
                updateData['scheduleNotifications.dailyBriefingTime'] = scheduleNotifications.dailyBriefingTime;
            }
            if (scheduleNotifications.notifyOnChanges !== undefined) {
                updateData['scheduleNotifications.notifyOnChanges'] = scheduleNotifications.notifyOnChanges;
            }
        }

        // Payment Settings
        const { payment } = req.body;
        if (payment !== undefined) {
            if (payment.enabled !== undefined) updateData['payment.enabled'] = payment.enabled;
            if (payment.testMode !== undefined) updateData['payment.testMode'] = payment.testMode;
            if (payment.currency !== undefined) updateData['payment.currency'] = payment.currency;
            if (payment.taxRate !== undefined) updateData['payment.taxRate'] = payment.taxRate;
            if (payment.stripePublicKey !== undefined) updateData['payment.stripePublicKey'] = payment.stripePublicKey;
            if (payment.stripeSecretKey !== undefined) updateData['payment.stripeSecretKey'] = payment.stripeSecretKey;
            if (payment.invoicePrefix !== undefined) updateData['payment.invoicePrefix'] = payment.invoicePrefix;
            if (payment.paymentTermsDays !== undefined) updateData['payment.paymentTermsDays'] = payment.paymentTermsDays;
            if (payment.reminderDays !== undefined) updateData['payment.reminderDays'] = payment.reminderDays;
            if (payment.companyAddress !== undefined) updateData['payment.companyAddress'] = payment.companyAddress;
            if (payment.companyPhone !== undefined) updateData['payment.companyPhone'] = payment.companyPhone;
        }

        // Default Checklist
        const { defaultChecklist } = req.body;
        if (defaultChecklist !== undefined) {
            updateData.defaultChecklist = defaultChecklist;
        }

        // Job Completion Email Settings
        const { jobCompletionEmails } = req.body;
        if (jobCompletionEmails !== undefined) {
            if (jobCompletionEmails.sendToClient !== undefined) updateData['jobCompletionEmails.sendToClient'] = jobCompletionEmails.sendToClient;
            if (jobCompletionEmails.sendToAdmin !== undefined) updateData['jobCompletionEmails.sendToAdmin'] = jobCompletionEmails.sendToAdmin;
            if (jobCompletionEmails.adminEmail !== undefined) updateData['jobCompletionEmails.adminEmail'] = jobCompletionEmails.adminEmail;
            if (jobCompletionEmails.includePhotos !== undefined) updateData['jobCompletionEmails.includePhotos'] = jobCompletionEmails.includePhotos;
            if (jobCompletionEmails.emailSubject !== undefined) updateData['jobCompletionEmails.emailSubject'] = jobCompletionEmails.emailSubject;
        }

        // Mileage Reimbursement Settings
        const { mileageReimbursement } = req.body;
        if (mileageReimbursement !== undefined) {
            if (mileageReimbursement.enabled !== undefined) updateData['mileageReimbursement.enabled'] = mileageReimbursement.enabled;
            if (mileageReimbursement.ratePerMile !== undefined) updateData['mileageReimbursement.ratePerMile'] = mileageReimbursement.ratePerMile;
            if (mileageReimbursement.trackAutomatically !== undefined) updateData['mileageReimbursement.trackAutomatically'] = mileageReimbursement.trackAutomatically;
        }

        const settings = await Settings.findByIdAndUpdate(
            'app_settings',
            { $set: updateData },
            { new: true, upsert: true }
        );

        res.json({ msg: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Test SMTP connection (admin only)
router.post('/test-smtp', isAdmin, async (req, res) => {
    try {
        const result = await testSmtpConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Manually trigger review request processing (admin only, for testing)
router.post('/process-reviews', isAdmin, async (req, res) => {
    try {
        const result = await processReviewRequests();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get review request statistics (admin only)
router.get('/review-stats', isAdmin, async (req, res) => {
    try {
        const stats = await ReviewRequest.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const recentSent = await ReviewRequest.find({ status: 'sent' })
            .sort({ sentAt: -1 })
            .limit(10)
            .populate('clientId', 'name email');

        res.json({
            stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
            recentSent
        });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Manually trigger daily schedule briefing (admin only, for testing)
router.post('/send-daily-briefings', isAdmin, async (req, res) => {
    try {
        const { sendDailyBriefings } = require('../services/scheduleNotificationService');
        const result = await sendDailyBriefings();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

