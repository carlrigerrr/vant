const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Settings = require('../models/Settings');
const { sendEmail } = require('../services/emailService');

// Middleware to check admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// GET all leads (admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET single lead (admin only)
router.get('/:id', isAdmin, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ msg: 'Lead not found' });
        }
        res.json(lead);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// CREATE lead (admin only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const lead = new Lead(req.body);
        await lead.save();
        res.json(lead);
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// UPDATE lead (admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!lead) {
            return res.status(404).json({ msg: 'Lead not found' });
        }
        res.json(lead);
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE lead (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Lead deleted' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// SEND QUOTE to lead (admin only)
router.post('/:id/send-quote', isAdmin, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ msg: 'Lead not found' });
        }

        const settings = await Settings.getSettings();

        // Generate approval token
        const token = lead.generateApprovalToken();
        await lead.save();

        // Build approval URL (use your actual domain in production)
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const approvalUrl = `${baseUrl}/api/leads/approve/${token}`;

        // Service type display names
        const serviceTypeNames = {
            'regular': 'Regular Cleaning',
            'deep-clean': 'Deep Cleaning',
            'move-out': 'Move-Out Cleaning',
            'move-in': 'Move-In Cleaning',
            'one-time': 'One-Time Cleaning',
            'other': 'Custom Service'
        };

        // Build email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Your Cleaning Quote</h2>
                
                <p>Hi ${lead.name},</p>
                
                <p>Thank you for your interest in our cleaning services! Here's your personalized quote:</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceTypeNames[lead.serviceType] || lead.serviceType}</p>
                    <p style="margin: 5px 0;"><strong>Frequency:</strong> ${lead.frequency}</p>
                    <p style="margin: 5px 0; font-size: 24px; color: #059669;"><strong>Price: $${lead.quoteAmount}/visit</strong></p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${approvalUrl}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; display: inline-block;">
                        ✓ Approve This Quote
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">Simply click the button above to confirm your booking. We'll get in touch to schedule your first cleaning!</p>
                
                <p>Questions? Just reply to this email.</p>
                
                <p>Best regards,<br>${settings.companyName || 'Your Cleaning Company'}</p>
            </div>
        `;

        await sendEmail({
            to: lead.email,
            subject: `Your Cleaning Quote from ${settings.companyName || 'Our Company'}`,
            html: emailHtml,
            text: `Hi ${lead.name}, your quote for ${lead.serviceType} cleaning is $${lead.quoteAmount}. Approve here: ${approvalUrl}`
        });

        // Update lead status
        lead.status = 'quoted';
        lead.quoteSentAt = new Date();
        await lead.save();

        res.json({ msg: 'Quote sent successfully', lead });

    } catch (error) {
        console.error('Error sending quote:', error);
        res.status(500).json({ msg: 'Failed to send quote: ' + error.message });
    }
});

// PUBLIC: Approve quote (no auth required - accessed via email link)
router.get('/approve/:token', async (req, res) => {
    try {
        const lead = await Lead.findOne({ approvalToken: req.params.token });

        if (!lead) {
            return res.send(`
                <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1 style="color: #dc2626;">Invalid or Expired Link</h1>
                    <p>This approval link is no longer valid.</p>
                </body>
                </html>
            `);
        }

        if (lead.status === 'approved' || lead.status === 'converted') {
            return res.send(`
                <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1 style="color: #059669;">Already Approved! ✓</h1>
                    <p>This quote has already been approved. We'll be in touch soon!</p>
                </body>
                </html>
            `);
        }

        // Update lead status
        lead.status = 'approved';
        lead.approvedAt = new Date();
        await lead.save();

        // Generate password: use phone if available, otherwise 6-digit code
        const generatedPassword = lead.phone
            ? lead.phone.replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000).toString()
            : Math.floor(100000 + Math.random() * 900000).toString();

        // Auto-convert to client with portal credentials
        const newClient = new Client({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            address: lead.address,
            frequency: lead.frequency,
            priority: 'new',
            serviceNotes: `Converted from lead. Service: ${lead.serviceType}, Quote: $${lead.quoteAmount}`
        });

        // Set password for client portal
        newClient.setPassword(generatedPassword);
        await newClient.save();

        // Link client to lead
        lead.status = 'converted';
        lead.convertedClientId = newClient._id;
        await lead.save();

        // Get settings for emails
        const settings = await Settings.getSettings();
        const smtpUser = settings.smtp?.user || process.env.SMTP_USER;
        const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
        const portalUrl = `${baseUrl}/client/login`;

        // Send welcome email with portal credentials
        try {
            await sendEmail({
                to: lead.email,
                subject: `Welcome to ${settings.companyName || 'Our Cleaning Service'}! 🎉`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #059669;">Welcome, ${lead.name}! 🎉</h2>
                        
                        <p>Thank you for choosing ${settings.companyName || 'us'}! Your quote has been approved and your account is ready.</p>
                        
                        <div style="background: #f0fdf4; border: 2px solid #059669; padding: 20px; border-radius: 12px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #059669;">Your Client Portal Login</h3>
                            <p style="margin: 5px 0;"><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${lead.email}</p>
                            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 16px;">${generatedPassword}</code></p>
                        </div>
                        
                        <p>In your client portal you can:</p>
                        <ul>
                            <li>View your upcoming cleaning schedule</li>
                            <li>Update your property access information</li>
                            <li>Request schedule changes</li>
                            <li>Leave feedback for your cleaners</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${portalUrl}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; display: inline-block;">
                                Login to Your Portal
                            </a>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px;">For security, we recommend changing your password after your first login.</p>
                        
                        <p>We'll be in touch shortly to schedule your first cleaning!</p>
                        
                        <p>Best regards,<br>${settings.companyName || 'Your Cleaning Team'}</p>
                    </div>
                `,
                text: `Welcome ${lead.name}! Your client portal is ready. Login at ${portalUrl} with email: ${lead.email} and password: ${generatedPassword}`
            });
            console.log(`[LeadApproval] Welcome email sent to ${lead.email}`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        // Notify admin via email
        if (smtpUser) {
            try {
                await sendEmail({
                    to: smtpUser,
                    subject: `🎉 New Client Won: ${lead.name}!`,
                    html: `
                        <h2>New Client Approved!</h2>
                        <p><strong>${lead.name}</strong> has approved their quote and is now a client.</p>
                        <p>Service: ${lead.serviceType}<br>
                        Frequency: ${lead.frequency}<br>
                        Quote: $${lead.quoteAmount}</p>
                        <p>Portal credentials have been sent to the client.</p>
                    `,
                    text: `New client: ${lead.name} approved their quote for ${lead.serviceType} at $${lead.quoteAmount}`
                });
            } catch (emailError) {
                console.error('Failed to notify admin:', emailError);
            }
        }

        // Show success page with portal info
        res.send(`
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #f0fdf4;">
                <div style="background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h1 style="color: #059669; font-size: 48px; margin: 0;">✓</h1>
                    <h2 style="color: #059669;">Welcome Aboard!</h2>
                    <p style="font-size: 18px; color: #374151;">Thank you, ${lead.name}!</p>
                    <p style="color: #6b7280;">Check your email for your client portal login details.</p>
                    <div style="margin-top: 20px;">
                        <a href="${portalUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            Go to Client Portal
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error approving quote:', error);
        res.status(500).send('An error occurred');
    }
});

// GET lead stats (admin only)
router.get('/stats/summary', isAdmin, async (req, res) => {
    try {
        const stats = await Lead.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const total = await Lead.countDocuments();
        res.json({
            total,
            byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
        });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
