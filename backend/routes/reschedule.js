const express = require('express');
const router = express.Router();
const RescheduleRequest = require('../models/RescheduleRequest');
const Client = require('../models/Client');

// Middleware to check client auth
const isClient = (req, res, next) => {
    if (req.session.clientId) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// Middleware to check admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// CLIENT ROUTES

// Create reschedule request (client)
router.post('/', isClient, async (req, res) => {
    try {
        const { originalDate, requestedDate, reason } = req.body;

        if (!originalDate || !requestedDate) {
            return res.status(400).json({ msg: 'Original and requested dates are required' });
        }

        const request = new RescheduleRequest({
            clientId: req.session.clientId,
            originalDate: new Date(originalDate),
            requestedDate: new Date(requestedDate),
            reason: reason || ''
        });

        await request.save();
        res.json({ msg: 'Reschedule request submitted successfully', request });
    } catch (error) {
        console.error('Error creating reschedule request:', error);
        res.status(500).json({ msg: error.message || 'Server error' });
    }
});

// Get client's reschedule requests
router.get('/my-requests', isClient, async (req, res) => {
    try {
        const requests = await RescheduleRequest.find({ clientId: req.session.clientId })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ADMIN ROUTES

// Get all reschedule requests (admin)
router.get('/all', isAdmin, async (req, res) => {
    try {
        const requests = await RescheduleRequest.find()
            .populate('clientId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update reschedule request status (admin)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { status, adminNote } = req.body;

        const request = await RescheduleRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        if (status) request.status = status;
        if (adminNote !== undefined) request.adminNote = adminNote;
        request.updatedAt = new Date();

        await request.save();
        res.json({ msg: 'Request updated successfully', request });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete reschedule request (admin)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        await RescheduleRequest.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
