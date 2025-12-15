const express = require('express');
const router = express.Router();
const ServiceHistory = require('../models/ServiceHistory');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Rating = require('../models/Rating');

// Middleware to check admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// Get overall performance stats
router.get('/summary', isAdmin, async (req, res) => {
    try {
        // 1. Total Services Count
        const totalServices = await ServiceHistory.countDocuments();

        // 2. Services this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const servicesThisMonth = await ServiceHistory.countDocuments({
            serviceDate: { $gte: startOfMonth }
        });

        // 3. Top Performer (most services this month)
        const topPerformer = await ServiceHistory.aggregate([
            { $match: { serviceDate: { $gte: startOfMonth } } },
            { $group: { _id: '$employeeId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        let topEmployeeName = 'N/A';
        if (topPerformer.length > 0) {
            const emp = await User.findById(topPerformer[0]._id).select('username');
            if (emp) topEmployeeName = emp.username;
        }

        // 4. Attendance Stats (Checked-out vs total)
        const attendanceStats = await Attendance.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    checkedOut: { $sum: { $cond: [{ $eq: ['$status', 'checked-out'] }, 1, 0] } }
                }
            }
        ]);

        const att = attendanceStats[0] || { total: 0, checkedOut: 0 };
        const onTimeRate = att.total > 0 ? Math.round((att.checkedOut / att.total) * 100) : 100;

        res.json({
            totalServices,
            servicesThisMonth,
            topPerformer: topEmployeeName,
            onTimeRate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get detailed employee performance list
router.get('/employees', isAdmin, async (req, res) => {
    try {
        const users = await User.find({ active: { $ne: false } }).select('username jobsCompleted');

        const performanceData = await Promise.all(users.map(async (user) => {
            // Service counts
            const totalServices = await ServiceHistory.countDocuments({ employeeId: user._id });

            // Unique clients
            const uniqueClients = await ServiceHistory.distinct('clientId', { employeeId: user._id });

            // Attendance
            const attendance = await Attendance.countDocuments({ userId: user._id });
            const checkedOut = await Attendance.countDocuments({ userId: user._id, status: 'checked-out' });
            const onTimeRate = attendance > 0 ? Math.round((checkedOut / attendance) * 100) : 100;

            // Ratings
            const ratings = await Rating.find({ employeeId: user._id });
            const averageRating = ratings.length > 0
                ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                : 0;

            return {
                _id: user._id,
                username: user.username,
                totalServices,
                uniqueClients: uniqueClients.length,
                onTimeRate,
                attendanceCount: attendance,
                jobsCompleted: user.jobsCompleted || 0,
                averageRating: parseFloat(averageRating),
                totalRatings: ratings.length
            };
        }));

        // Sort by total services desc
        performanceData.sort((a, b) => b.totalServices - a.totalServices);

        res.json(performanceData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
