const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { genPassword, validPassword } = require('../passport/passwordFunctions');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ msg: 'Not authenticated' });
};

// GET /api/profile - Get current user's profile
router.get('/api/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-hash -salt');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({
            id: user._id,
            username: user.username,
            email: user.email || '',
            phone: user.phone || '',
            memberSince: user.memberSince,
            admin: user.admin,
            jobsCompleted: user.jobsCompleted || 0,
            notificationPreferences: user.notificationPreferences || {
                dailyBriefing: true,
                scheduleChanges: true
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/profile - Update user profile (email, phone, notifications)
router.put('/api/profile', isAuthenticated, async (req, res) => {
    try {
        const { email, phone, notificationPreferences } = req.body;

        const updateData = {};
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (notificationPreferences !== undefined) {
            updateData.notificationPreferences = notificationPreferences;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select('-hash -salt');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({
            msg: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email || '',
                phone: user.phone || '',
                notificationPreferences: user.notificationPreferences
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/profile/password - Change password
router.put('/api/profile/password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters' });
        }

        // Get user with hash and salt
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Verify current password
        const isValid = validPassword(currentPassword, user.hash, user.salt);
        if (!isValid) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        // Generate new password hash
        const { salt, hash } = genPassword(newPassword);

        // Update password
        await User.findByIdAndUpdate(req.user.id, {
            $set: { salt, hash }
        });

        res.json({ msg: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
