const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const User = require('../models/User');

// GET WORKLOAD STATS
router.get('/workload', async (req, res) => {
    if (req.isAuthenticated() && req.user.admin) {
        try {
            // Get all non-admin users
            const users = await User.find({ admin: false });

            // Get the latest shift (current schedule)
            const latestShift = await Shift.findOne().sort({ _id: -1 });

            if (!latestShift || !latestShift.data) {
                // No schedule exists, return users with 0 shifts
                const workload = users.map(user => ({
                    userId: user._id,
                    username: user.username,
                    shiftCount: 0,
                }));
                return res.json(workload);
            }

            // latestShift.data is an array of days, each day is an array of users
            const scheduleData = latestShift.data;

            const workload = users.map(user => {
                let shiftCount = 0;

                // Iterate through each day in the schedule
                if (Array.isArray(scheduleData)) {
                    scheduleData.forEach(daySchedule => {
                        if (Array.isArray(daySchedule)) {
                            // Check if user is in this day's schedule
                            daySchedule.forEach(assignedUser => {
                                if (assignedUser && assignedUser._id &&
                                    assignedUser._id.toString() === user._id.toString()) {
                                    shiftCount++;
                                }
                            });
                        }
                    });
                }

                return {
                    userId: user._id,
                    username: user.username,
                    shiftCount,
                };
            });

            // Sort by shift count descending
            workload.sort((a, b) => b.shiftCount - a.shiftCount);

            res.json(workload);
        } catch (error) {
            console.error('Error fetching workload stats:', error);
            res.status(500).json({ msg: 'Server error' });
        }
    } else {
        res.status(401).json({ msg: 'Unauthorized' });
    }
});

// GET DASHBOARD STATS - Comprehensive metrics for admin dashboard
router.get('/dashboard', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.admin) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        const Attendance = require('../models/Attendance');
        const Message = require('../models/Message');
        const RescheduleRequest = require('../models/RescheduleRequest');
        const Client = require('../models/Client');

        // Today's date range
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // This week's date range
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Parallel queries for efficiency
        const [
            totalEmployees,
            totalClients,
            todayAttendance,
            activeNow,
            jobsCompletedToday,
            pendingEmployeeRequests,
            pendingClientRequests,
            unreadMessages,
            weekAttendance
        ] = await Promise.all([
            // Total employees
            User.countDocuments({ admin: false }),
            // Total clients
            Client.countDocuments({}),
            // Today's attendance records
            Attendance.find({
                'checkIn.time': { $gte: startOfDay, $lte: endOfDay }
            }).populate('userId', 'username').populate('clientId', 'name'),
            // Currently active (checked in, not checked out)
            Attendance.find({
                status: 'checked-in'
            }).populate('userId', 'username').populate('clientId', 'name'),
            // Jobs completed today (with jobCompleted.confirmed = true)
            Attendance.countDocuments({
                'checkIn.time': { $gte: startOfDay, $lte: endOfDay },
                'jobCompleted.confirmed': true
            }),
            // Pending employee requests (from User Requests - like shift swaps, time off)
            // Note: This assumes you have a generic Request model, adjust if different
            0, // Placeholder - update when Request model is available
            // Pending client reschedule requests
            RescheduleRequest.countDocuments({ status: 'pending' }),
            // Unread messages for admin
            Message.countDocuments({
                recipientId: req.user.id,
                read: false
            }),
            // This week's attendance for stats
            Attendance.countDocuments({
                'checkIn.time': { $gte: startOfWeek, $lte: endOfDay }
            })
        ]);

        // Calculate derived metrics
        const checkedInToday = todayAttendance.length;
        const checkedOutToday = todayAttendance.filter(a => a.status === 'checked-out').length;
        const activeEmployees = activeNow.map(a => ({
            employeeId: a.userId?._id,
            employeeName: a.userId?.username,
            clientName: a.clientId?.name,
            checkInTime: a.checkIn?.time,
            safetyConfirmed: a.safetyConfirmed?.confirmed
        }));

        // GPS warnings today
        const gpsWarningsToday = todayAttendance.filter(a => a.gpsWarning).length;

        // Safety confirmations pending
        const pendingSafetyConfirm = activeNow.filter(a => !a.safetyConfirmed?.confirmed).length;

        res.json({
            // Summary cards
            summary: {
                totalEmployees,
                totalClients,
                checkedInToday,
                checkedOutToday,
                activeNow: activeNow.length,
                jobsCompletedToday,
                weeklyCheckIns: weekAttendance
            },
            // Pending items requiring attention
            pending: {
                employeeRequests: pendingEmployeeRequests,
                clientRequests: pendingClientRequests,
                unreadMessages,
                gpsWarnings: gpsWarningsToday,
                safetyConfirmations: pendingSafetyConfirm
            },
            // Real-time active employees
            activeEmployees,
            // Timestamp for freshness
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
