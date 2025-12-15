/**
 * Job Completion Email Template
 * Sends before/after photos to client and/or admin when job is marked complete
 */

const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const fs = require('fs');
const path = require('path');

/**
 * Convert image file path to base64 data URI
 */
const imageToBase64 = (photoPath) => {
    try {
        // photoPath is like "/uploads/filename.jpg"
        const absolutePath = path.join(__dirname, '..', photoPath);
        if (fs.existsSync(absolutePath)) {
            const imageBuffer = fs.readFileSync(absolutePath);
            const base64 = imageBuffer.toString('base64');
            // Detect image type from extension
            const ext = path.extname(photoPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' :
                ext === '.gif' ? 'image/gif' :
                    ext === '.webp' ? 'image/webp' : 'image/jpeg';
            return `data:${mimeType};base64,${base64}`;
        }
        console.log(`[JobEmail] Image not found: ${absolutePath}`);
        return null;
    } catch (err) {
        console.log(`[JobEmail] Error reading image: ${err.message}`);
        return null;
    }
};

/**
 * Generate HTML email with before/after photos
 */
const generateJobCompletionEmail = ({
    employeeName,
    clientName,
    clientAddress,
    checkInTime,
    checkOutTime,
    duration,
    beforePhotos = [],
    afterPhotos = [],
    companyName,
    baseUrl
}) => {
    const formatTime = (date) => {
        return new Date(date).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderPhotoGrid = (photos, label) => {
        if (!photos || photos.length === 0) return '';

        const photoItems = photos.map(photo => {
            // Try base64 first (for embedded images), fallback to URL
            const base64Src = imageToBase64(photo);
            const imgSrc = base64Src || `${baseUrl}${photo}`;
            return `
            <td style="padding: 5px;">
                <img src="${imgSrc}" alt="${label}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />
            </td>
        `;
        }).join('');

        return `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px; color: #374151; font-size: 16px;">${label} (${photos.length})</h3>
                <table cellpadding="0" cellspacing="0" style="border-spacing: 5px;">
                    <tr>${photoItems}</tr>
                </table>
            </div>
        `;
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Job Completed!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            
            <!-- Job Details -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 8px 0;">
                            <span style="color: #6b7280; font-size: 14px;">📍 Location</span><br/>
                            <strong style="color: #111827; font-size: 16px;">${clientAddress || clientName}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">
                            <span style="color: #6b7280; font-size: 14px;">👤 Employee</span><br/>
                            <strong style="color: #111827; font-size: 16px;">${employeeName}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">
                            <span style="color: #6b7280; font-size: 14px;">🕐 Time</span><br/>
                            <strong style="color: #111827; font-size: 16px;">${formatTime(checkInTime)} - ${formatTime(checkOutTime)}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">
                            <span style="color: #6b7280; font-size: 14px;">⏱️ Duration</span><br/>
                            <strong style="color: #111827; font-size: 16px;">${duration}</strong>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Before Photos -->
            ${renderPhotoGrid(beforePhotos, '📷 Before Photos')}
            
            <!-- After Photos -->
            ${renderPhotoGrid(afterPhotos, '📷 After Photos')}
            
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Thank you for choosing <strong style="color: #111827;">${companyName}</strong>!
            </p>
        </div>

    </div>
</body>
</html>
    `;
};

/**
 * Send job completion email to client and/or admin
 */
const sendJobCompletionEmail = async ({
    attendance,
    client,
    employee,
    baseUrl
}) => {
    try {
        const settings = await Settings.getSettings();
        const emailSettings = settings.jobCompletionEmails || {};

        // Check if emails are enabled
        if (!emailSettings.sendToClient && !emailSettings.sendToAdmin) {
            console.log('[JobEmail] No recipients enabled, skipping');
            return { sent: false, reason: 'No recipients enabled' };
        }

        // Check if we have photos
        const beforePhotos = attendance.checkIn?.photos ||
            (attendance.checkIn?.beforePhoto ? [attendance.checkIn.beforePhoto] : []);
        const afterPhotos = attendance.checkOut?.photos ||
            (attendance.checkOut?.completionPhoto ? [attendance.checkOut.completionPhoto] : []);

        if (beforePhotos.length === 0 && afterPhotos.length === 0 && emailSettings.includePhotos !== false) {
            console.log('[JobEmail] No photos to send, skipping');
            return { sent: false, reason: 'No photos available' };
        }

        // Calculate duration
        const checkInTime = new Date(attendance.checkIn.time);
        const checkOutTime = new Date(attendance.checkOut.time);
        const diffMs = checkOutTime - checkInTime;
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.round((diffMs % 3600000) / 60000);
        const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;

        // Generate email HTML
        const htmlContent = generateJobCompletionEmail({
            employeeName: employee.username || 'Team Member',
            clientName: client?.name || 'Client',
            clientAddress: client?.address || '',
            checkInTime,
            checkOutTime,
            duration,
            beforePhotos,
            afterPhotos,
            companyName: settings.companyName || 'Your Cleaning Company',
            baseUrl
        });

        // Prepare subject
        let subject = emailSettings.emailSubject || '✅ Job Completed at {{clientAddress}}';
        subject = subject.replace('{{clientAddress}}', client?.address || client?.name || 'your location');

        // Setup transporter
        const smtpSettings = settings.smtp || {};
        if (!smtpSettings.user || !smtpSettings.pass) {
            console.log('[JobEmail] SMTP not configured');
            return { sent: false, reason: 'SMTP not configured' };
        }

        const transporter = nodemailer.createTransport({
            host: smtpSettings.host || 'smtp.gmail.com',
            port: smtpSettings.port || 465,
            secure: smtpSettings.secure !== false,
            auth: {
                user: smtpSettings.user,
                pass: smtpSettings.pass
            }
        });

        const fromAddress = smtpSettings.senderName
            ? `"${smtpSettings.senderName}" <${smtpSettings.user}>`
            : smtpSettings.user;

        const recipients = [];

        // Add client email
        if (emailSettings.sendToClient && client?.email) {
            recipients.push({ email: client.email, type: 'client' });
        }

        // Add admin email
        if (emailSettings.sendToAdmin) {
            const adminEmail = emailSettings.adminEmail || smtpSettings.user;
            if (adminEmail) {
                recipients.push({ email: adminEmail, type: 'admin' });
            }
        }

        // Send to each recipient
        const results = [];
        for (const recipient of recipients) {
            try {
                await transporter.sendMail({
                    from: fromAddress,
                    to: recipient.email,
                    subject,
                    html: htmlContent
                });
                console.log(`[JobEmail] Sent to ${recipient.type}: ${recipient.email}`);
                results.push({ email: recipient.email, success: true });
            } catch (err) {
                console.error(`[JobEmail] Failed to send to ${recipient.email}:`, err.message);
                results.push({ email: recipient.email, success: false, error: err.message });
            }
        }

        return { sent: true, recipients: results };

    } catch (error) {
        console.error('[JobEmail] Error:', error);
        return { sent: false, error: error.message };
    }
};

module.exports = { sendJobCompletionEmail, generateJobCompletionEmail };
