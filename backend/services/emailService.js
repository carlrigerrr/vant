const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const ReviewRequest = require('../models/ReviewRequest');
const Client = require('../models/Client');

/**
 * Create transporter using settings from DB (with .env fallback)
 */
const getTransporter = async () => {
    const settings = await Settings.getSettings();
    const smtp = settings.smtp || {};

    // Use DB settings if available, otherwise fall back to .env
    const host = smtp.host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = smtp.port || parseInt(process.env.SMTP_PORT) || 465;
    const secure = smtp.secure !== undefined ? smtp.secure : (process.env.SMTP_SECURE === 'true' || port === 465);
    const user = smtp.user || process.env.SMTP_USER;
    const pass = smtp.pass || process.env.SMTP_PASS;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });
};

/**
 * Get the "From" email address with sender name
 */
const getFromAddress = async () => {
    const settings = await Settings.getSettings();
    const smtp = settings.smtp || {};
    const user = smtp.user || process.env.SMTP_USER;
    const senderName = smtp.senderName || settings.companyName || 'Shift Scheduler';
    return `${senderName} <${user}>`;
};

/**
 * Send a single email (with optional attachments)
 */
const sendEmail = async ({ to, subject, html, text, attachments }) => {
    const transport = await getTransporter();
    const from = await getFromAddress();

    const mailOptions = {
        from,
        to,
        subject,
        html,
        text
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
    }

    return transport.sendMail(mailOptions);
};

/**
 * Replace template variables with actual values
 */
const processTemplate = (template, variables) => {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value || '');
    }
    return result;
};

/**
 * Process all pending review requests that are due
 */
const processReviewRequests = async () => {
    try {
        const settings = await Settings.getSettings();

        // Check if feature is enabled
        if (!settings.reviewRequests?.enabled) {
            console.log('[ReviewRequests] Feature disabled, skipping...');
            return { processed: 0, message: 'Feature disabled' };
        }

        // Check if SMTP is configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('[ReviewRequests] SMTP not configured, skipping...');
            return { processed: 0, message: 'SMTP not configured' };
        }

        const now = new Date();

        // Find pending requests that are due
        const pendingRequests = await ReviewRequest.find({
            status: 'pending',
            scheduledFor: { $lte: now }
        }).limit(50); // Process max 50 at a time

        console.log(`[ReviewRequests] Found ${pendingRequests.length} pending requests`);

        let successCount = 0;
        let failCount = 0;

        for (const request of pendingRequests) {
            try {
                const client = await Client.findById(request.clientId);

                if (!client || !client.email) {
                    request.status = 'skipped';
                    request.errorMessage = 'Client or email not found';
                    await request.save();
                    continue;
                }

                // Check if we already sent to this client today
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const existingSent = await ReviewRequest.findOne({
                    clientId: request.clientId,
                    status: 'sent',
                    sentAt: { $gte: today }
                });

                if (existingSent) {
                    request.status = 'skipped';
                    request.errorMessage = 'Already sent today';
                    await request.save();
                    continue;
                }

                // Prepare email content
                const variables = {
                    clientName: client.name,
                    reviewLink: settings.reviewRequests.googleReviewUrl || '#',
                    companyName: settings.companyName || 'Your Cleaning Company'
                };

                const emailBody = processTemplate(
                    settings.reviewRequests.emailTemplate,
                    variables
                );

                const emailSubject = processTemplate(
                    settings.reviewRequests.emailSubject,
                    variables
                );

                // Send email
                await sendEmail({
                    to: client.email,
                    subject: emailSubject,
                    text: emailBody,
                    html: emailBody.replace(/\n/g, '<br>')
                });

                // Mark as sent
                request.status = 'sent';
                request.sentAt = new Date();
                request.clientEmail = client.email;
                await request.save();
                successCount++;

                console.log(`[ReviewRequests] Sent to ${client.email}`);

            } catch (emailError) {
                console.error(`[ReviewRequests] Failed to send:`, emailError.message);
                request.status = 'failed';
                request.errorMessage = emailError.message;
                await request.save();
                failCount++;
            }
        }

        console.log(`[ReviewRequests] Processed: ${successCount} sent, ${failCount} failed`);
        return { processed: successCount, failed: failCount };

    } catch (error) {
        console.error('[ReviewRequests] Error processing:', error);
        return { processed: 0, error: error.message };
    }
};

/**
 * Test SMTP connection
 */
const testSmtpConnection = async () => {
    try {
        const transport = await getTransporter();
        await transport.verify();
        return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

module.exports = {
    sendEmail,
    processReviewRequests,
    testSmtpConnection,
    processTemplate
};
