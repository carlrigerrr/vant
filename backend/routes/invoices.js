const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Settings = require('../models/Settings');
const { sendEmail } = require('../services/emailService');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure invoices directory exists
const invoicesDir = path.join(__dirname, '../uploads/invoices');
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}

// Middleware to check admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// GET all invoices (admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET single invoice (admin only)
router.get('/:id', isAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('clientId');
        if (!invoice) {
            return res.status(404).json({ msg: 'Invoice not found' });
        }
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// CREATE invoice (admin only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const { clientId, items, notes, dueDate } = req.body;

        // Get client info
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        // Calculate amounts
        const subtotal = items.reduce((sum, item) => sum + (item.amount || item.quantity * item.unitPrice), 0);
        const taxRate = settings.payment?.taxRate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        // Generate invoice number
        const invoiceNumber = await Invoice.generateInvoiceNumber(settings.payment?.invoicePrefix || 'INV');

        // Calculate due date
        const invoiceDueDate = dueDate
            ? new Date(dueDate)
            : new Date(Date.now() + (settings.payment?.paymentTermsDays || 14) * 24 * 60 * 60 * 1000);

        const invoice = new Invoice({
            invoiceNumber,
            clientId: client._id,
            clientName: client.name,
            clientEmail: client.email,
            clientAddress: client.address || '',
            items: items.map(item => ({
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice,
                amount: item.amount || item.quantity * item.unitPrice
            })),
            subtotal,
            taxRate,
            taxAmount,
            total,
            currency: settings.payment?.currency || 'USD',
            dueDate: invoiceDueDate,
            notes
        });

        // Generate payment token
        invoice.generatePaymentToken();
        await invoice.save();

        res.json(invoice);
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    }
});

// UPDATE invoice (admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!invoice) {
            return res.status(404).json({ msg: 'Invoice not found' });
        }
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE invoice (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (invoice?.pdfPath && fs.existsSync(invoice.pdfPath)) {
            fs.unlinkSync(invoice.pdfPath);
        }
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Invoice deleted' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// GENERATE PDF for invoice (admin only)
router.post('/:id/generate-pdf', isAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ msg: 'Invoice not found' });
        }

        const settings = await Settings.getSettings();
        const pdfPath = path.join(invoicesDir, `${invoice.invoiceNumber}.pdf`);

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24).fillColor('#059669').text(settings.companyName || 'Your Company', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#666').text(settings.payment?.companyAddress || '', { align: 'center' });
        doc.text(settings.payment?.companyPhone || '', { align: 'center' });
        doc.moveDown(1);

        // Invoice title
        doc.fontSize(20).fillColor('#333').text('INVOICE', { align: 'right' });
        doc.fontSize(12).fillColor('#666').text(`#${invoice.invoiceNumber}`, { align: 'right' });
        doc.moveDown(1);

        // Invoice details
        const startY = doc.y;
        doc.fontSize(10).fillColor('#333');
        doc.text('Bill To:', 50, startY);
        doc.font('Helvetica-Bold').text(invoice.clientName, 50, doc.y);
        doc.font('Helvetica').text(invoice.clientEmail);
        doc.text(invoice.clientAddress || '');

        doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 350, startY);
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, doc.y);
        doc.text(`Status: ${invoice.status.toUpperCase()}`, 350, doc.y);
        doc.moveDown(2);

        // Items table header
        const tableTop = doc.y + 20;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.rect(50, tableTop, 500, 20).fill('#f3f4f6');
        doc.fillColor('#333');
        doc.text('Description', 55, tableTop + 5, { width: 250 });
        doc.text('Qty', 310, tableTop + 5, { width: 50 });
        doc.text('Price', 370, tableTop + 5, { width: 80 });
        doc.text('Amount', 460, tableTop + 5, { width: 80 });

        // Items
        let yPos = tableTop + 25;
        doc.font('Helvetica').fontSize(10);
        invoice.items.forEach(item => {
            doc.fillColor('#333');
            doc.text(item.description, 55, yPos, { width: 250 });
            doc.text(String(item.quantity), 310, yPos, { width: 50 });
            doc.text(`$${item.unitPrice.toFixed(2)}`, 370, yPos, { width: 80 });
            doc.text(`$${item.amount.toFixed(2)}`, 460, yPos, { width: 80 });
            yPos += 20;
        });

        // Totals
        yPos += 20;
        doc.font('Helvetica');
        doc.text('Subtotal:', 370, yPos);
        doc.text(`$${invoice.subtotal.toFixed(2)}`, 460, yPos);

        if (invoice.taxRate > 0) {
            yPos += 15;
            doc.text(`Tax (${invoice.taxRate}%):`, 370, yPos);
            doc.text(`$${invoice.taxAmount.toFixed(2)}`, 460, yPos);
        }

        yPos += 20;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Total:', 370, yPos);
        doc.fillColor('#059669').text(`$${invoice.total.toFixed(2)}`, 460, yPos);

        // Notes
        if (invoice.notes) {
            doc.moveDown(3);
            doc.font('Helvetica').fontSize(10).fillColor('#666');
            doc.text('Notes:', 50);
            doc.text(invoice.notes, 50);
        }

        // Footer
        doc.fontSize(10).fillColor('#666');
        doc.text('Thank you for your business!', 50, 700, { align: 'center' });

        doc.end();

        stream.on('finish', async () => {
            invoice.pdfPath = pdfPath;
            await invoice.save();
            res.json({ msg: 'PDF generated', pdfPath });
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ msg: 'Failed to generate PDF: ' + error.message });
    }
});

// DOWNLOAD PDF (admin only)
router.get('/:id/pdf', isAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice || !invoice.pdfPath) {
            return res.status(404).json({ msg: 'PDF not found' });
        }
        res.download(invoice.pdfPath, `${invoice.invoiceNumber}.pdf`);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// SEND invoice via email (admin only)
router.post('/:id/send', isAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ msg: 'Invoice not found' });
        }

        const settings = await Settings.getSettings();
        const pdfPath = path.join(invoicesDir, `${invoice.invoiceNumber}.pdf`);

        // Always generate a fresh PDF and wait for it to complete
        await new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(pdfPath);

            stream.on('finish', resolve);
            stream.on('error', reject);

            doc.pipe(stream);

            // Header
            doc.fontSize(24).fillColor('#059669').text(settings.companyName || 'Your Company', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#666').text(settings.payment?.companyAddress || '', { align: 'center' });
            doc.text(settings.payment?.companyPhone || '', { align: 'center' });
            doc.moveDown(1);

            // Invoice title
            doc.fontSize(20).fillColor('#333').text('INVOICE', { align: 'right' });
            doc.fontSize(12).fillColor('#666').text(`#${invoice.invoiceNumber}`, { align: 'right' });
            doc.moveDown(1);

            // Invoice details
            const startY = doc.y;
            doc.fontSize(10).fillColor('#333');
            doc.text('Bill To:', 50, startY);
            doc.font('Helvetica-Bold').text(invoice.clientName, 50, doc.y);
            doc.font('Helvetica').text(invoice.clientEmail);
            doc.text(invoice.clientAddress || '');

            doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 350, startY);
            doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, doc.y);
            doc.moveDown(2);

            // Items table header
            const tableTop = doc.y + 20;
            doc.font('Helvetica-Bold').fontSize(10);
            doc.rect(50, tableTop, 500, 20).fill('#f3f4f6');
            doc.fillColor('#333');
            doc.text('Description', 55, tableTop + 5, { width: 250 });
            doc.text('Qty', 310, tableTop + 5, { width: 50 });
            doc.text('Price', 370, tableTop + 5, { width: 80 });
            doc.text('Amount', 460, tableTop + 5, { width: 80 });

            // Items
            let yPos = tableTop + 25;
            doc.font('Helvetica').fontSize(10);
            invoice.items.forEach(item => {
                doc.fillColor('#333');
                doc.text(item.description, 55, yPos, { width: 250 });
                doc.text(String(item.quantity), 310, yPos, { width: 50 });
                doc.text(`$${item.unitPrice.toFixed(2)}`, 370, yPos, { width: 80 });
                doc.text(`$${item.amount.toFixed(2)}`, 460, yPos, { width: 80 });
                yPos += 20;
            });

            // Totals
            yPos += 20;
            doc.font('Helvetica');
            doc.text('Subtotal:', 370, yPos);
            doc.text(`$${invoice.subtotal.toFixed(2)}`, 460, yPos);

            if (invoice.taxRate > 0) {
                yPos += 15;
                doc.text(`Tax (${invoice.taxRate}%):`, 370, yPos);
                doc.text(`$${invoice.taxAmount.toFixed(2)}`, 460, yPos);
            }

            yPos += 20;
            doc.font('Helvetica-Bold').fontSize(12);
            doc.text('Total:', 370, yPos);
            doc.fillColor('#059669').text(`$${invoice.total.toFixed(2)}`, 460, yPos);

            // Notes
            if (invoice.notes) {
                doc.moveDown(3);
                doc.font('Helvetica').fontSize(10).fillColor('#666');
                doc.text('Notes:', 50);
                doc.text(invoice.notes, 50);
            }

            // Footer
            doc.fontSize(10).fillColor('#666');
            doc.text('Thank you for your business!', 50, 700, { align: 'center' });

            doc.end();
        });

        // Update pdfPath in invoice
        invoice.pdfPath = pdfPath;
        await invoice.save();

        console.log(`[Invoice] PDF generated: ${pdfPath}`);

        // Build payment URL
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const paymentUrl = `${baseUrl}/api/invoices/pay/${invoice.paymentToken}`;

        // Send email with attachment
        await sendEmail({
            to: invoice.clientEmail,
            subject: `Invoice ${invoice.invoiceNumber} from ${settings.companyName || 'Our Company'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Invoice ${invoice.invoiceNumber}</h2>
                    
                    <p>Hi ${invoice.clientName},</p>
                    
                    <p>Please find your invoice attached. Here are the details:</p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                        <p style="margin: 5px 0;"><strong>Amount Due:</strong> <span style="color: #059669; font-size: 20px;">$${invoice.total.toFixed(2)}</span></p>
                        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${paymentUrl}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; display: inline-block;">
                            Pay Now - $${invoice.total.toFixed(2)}
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">Questions about this invoice? Just reply to this email.</p>
                    
                    <p>Thank you for your business!</p>
                    
                    <p>Best regards,<br>${settings.companyName || 'Your Company'}</p>
                </div>
            `,
            text: `Invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)}. Due: ${new Date(invoice.dueDate).toLocaleDateString()}. Pay at: ${paymentUrl}`,
            attachments: [{
                filename: `${invoice.invoiceNumber}.pdf`,
                path: pdfPath
            }]
        });

        console.log(`[Invoice] Email sent to ${invoice.clientEmail} with PDF attached`);

        invoice.status = 'sent';
        await invoice.save();

        res.json({ msg: 'Invoice sent successfully', invoice });
    } catch (error) {
        console.error('Error sending invoice:', error);
        res.status(500).json({ msg: 'Failed to send invoice: ' + error.message });
    }
});

// PUBLIC: Payment page (no auth)
router.get('/pay/:token', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ paymentToken: req.params.token });

        if (!invoice) {
            return res.send(`
                <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1 style="color: #dc2626;">Invalid Payment Link</h1>
                    <p>This payment link is no longer valid.</p>
                </body></html>
            `);
        }

        if (invoice.status === 'paid') {
            return res.send(`
                <html><body style="font-family: Arial; text-align: center; padding: 50px; background: #f0fdf4;">
                    <div style="background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto;">
                        <h1 style="color: #059669;">✓ Already Paid</h1>
                        <p>Invoice ${invoice.invoiceNumber} has been paid. Thank you!</p>
                    </div>
                </body></html>
            `);
        }

        // Mark as viewed
        if (invoice.status === 'sent') {
            invoice.status = 'viewed';
            await invoice.save();
        }

        const settings = await Settings.getSettings();
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

        res.send(`
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Pay Invoice ${invoice.invoiceNumber}</title>
            </head>
            <body style="font-family: Arial; padding: 20px; background: #f3f4f6; margin: 0;">
                <div style="background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 40px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin: 0;">Invoice ${invoice.invoiceNumber}</h2>
                    <p style="color: #666;">From: ${settings.companyName || 'Your Company'}</p>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        ${invoice.items.map(item => `
                            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                                <span>${item.description}</span>
                                <span>$${item.amount.toFixed(2)}</span>
                            </div>
                        `).join('')}
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 20px; color: #059669;">
                            <span>Total</span>
                            <span>$${invoice.total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                    
                    <form action="${baseUrl}/api/invoices/pay/${invoice.paymentToken}" method="POST" style="margin-top: 20px;">
                        <button type="submit" style="width: 100%; background: #059669; color: white; padding: 15px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer;">
                            Pay $${invoice.total.toFixed(2)} Now
                        </button>
                    </form>
                    
                    ${settings.payment?.testMode ? '<p style="color: #f59e0b; font-size: 12px; text-align: center; margin-top: 10px;">⚠️ Test Mode - Payment will be simulated</p>' : ''}
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error loading payment page:', error);
        res.status(500).send('An error occurred');
    }
});

// PUBLIC: Process payment (no auth)
router.post('/pay/:token', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ paymentToken: req.params.token });

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        if (invoice.status === 'paid') {
            return res.redirect(`/api/invoices/pay/${req.params.token}`);
        }

        const settings = await Settings.getSettings();

        // In test mode, just mark as paid
        if (settings.payment?.testMode) {
            invoice.status = 'paid';
            invoice.paidAt = new Date();
            invoice.paymentMethod = 'test';
            await invoice.save();

            // Notify admin
            const smtpUser = settings.smtp?.user || process.env.SMTP_USER;
            if (smtpUser) {
                try {
                    await sendEmail({
                        to: smtpUser,
                        subject: `💰 Payment Received: Invoice ${invoice.invoiceNumber}`,
                        html: `<h2>Payment Received!</h2><p>${invoice.clientName} paid $${invoice.total.toFixed(2)} for invoice ${invoice.invoiceNumber}.</p><p><em>Note: This was a test mode payment.</em></p>`,
                        text: `Payment received: ${invoice.clientName} paid $${invoice.total} for invoice ${invoice.invoiceNumber}`
                    });
                } catch (e) { console.error('Failed to notify admin:', e); }
            }

            return res.send(`
                <html><body style="font-family: Arial; text-align: center; padding: 50px; background: #f0fdf4;">
                    <div style="background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto;">
                        <h1 style="color: #059669; font-size: 48px; margin: 0;">✓</h1>
                        <h2 style="color: #059669;">Payment Successful!</h2>
                        <p>Thank you for your payment of $${invoice.total.toFixed(2)}</p>
                        <p style="color: #666;">Invoice ${invoice.invoiceNumber}</p>
                    </div>
                </body></html>
            `);
        }

        // TODO: Real Stripe integration here
        res.status(501).send('Real payment processing not yet implemented. Enable test mode in settings.');

    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).send('Payment processing failed');
    }
});

// MARK as paid manually (admin only)
router.post('/:id/mark-paid', isAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ msg: 'Invoice not found' });
        }
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.paymentMethod = req.body.method || 'manual';
        await invoice.save();
        res.json({ msg: 'Invoice marked as paid', invoice });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET invoice stats (admin only)
router.get('/stats/summary', isAdmin, async (req, res) => {
    try {
        const stats = await Invoice.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }
        ]);
        const allInvoices = await Invoice.find();
        const totalRevenue = allInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
        const outstanding = allInvoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);

        res.json({
            byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: { count: s.count, total: s.total } }), {}),
            totalRevenue,
            outstanding
        });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
