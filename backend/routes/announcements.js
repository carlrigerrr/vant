const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Middleware to check authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
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

// Get all announcements (for employees)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const now = new Date();
        const announcements = await Announcement.find({
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: now } }
            ]
        })
            .populate('authorId', 'username')
            .sort({ pinned: -1, createdAt: -1 })
            .limit(20);
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get all announcements including expired (admin only)
router.get('/all', isAdmin, async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('authorId', 'username')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Create announcement (admin only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { title, content, priority, pinned, expiresAt } = req.body;

        if (!title || !content) {
            return res.status(400).json({ msg: 'Title and content are required' });
        }

        const announcement = new Announcement({
            title,
            content,
            authorId: req.user._id,
            priority: priority || 'normal',
            pinned: pinned || false,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        });

        await announcement.save();
        res.json({ msg: 'Announcement created', announcement });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update announcement (admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { title, content, priority, pinned, expiresAt } = req.body;

        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            {
                title,
                content,
                priority,
                pinned,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            },
            { new: true }
        );

        if (!announcement) {
            return res.status(404).json({ msg: 'Announcement not found' });
        }

        res.json({ msg: 'Announcement updated', announcement });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete announcement (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);

        if (!announcement) {
            return res.status(404).json({ msg: 'Announcement not found' });
        }

        res.json({ msg: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
