const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const isAdmin = require('./middleware/isAdmin');

// GET Payroll Report
// Query params: startDate, endDate
router.get('/report', isAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            // Include the entire end date
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }

        // Match query for completed shifts
        const matchQuery = {
            status: 'checked-out',
            'checkIn.time': { $exists: true },
            'checkOut.time': { $exists: true }
        };

        if (Object.keys(dateFilter).length > 0) {
            matchQuery['checkIn.time'] = dateFilter;
        }

        // Aggregate attendance by employee
        const report = await Attendance.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$userId',
                    totalShifts: { $sum: 1 },
                    totalMinutes: {
                        $sum: {
                            $divide: [
                                { $subtract: ['$checkOut.time', '$checkIn.time'] },
                                60000 // Convert ms to minutes
                            ]
                        }
                    },
                    firstShift: { $min: '$checkIn.time' },
                    lastShift: { $max: '$checkOut.time' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: '$employee' },
            {
                $project: {
                    _id: 1,
                    employeeName: '$employee.username',
                    employeeEmail: '$employee.email',
                    totalShifts: 1,
                    totalMinutes: 1,
                    totalHours: { $divide: ['$totalMinutes', 60] },
                    avgMinutesPerShift: { $divide: ['$totalMinutes', '$totalShifts'] },
                    firstShift: 1,
                    lastShift: 1
                }
            },
            { $sort: { employeeName: 1 } }
        ]);

        // Calculate totals
        const totals = report.reduce((acc, emp) => {
            acc.totalShifts += emp.totalShifts;
            acc.totalMinutes += emp.totalMinutes;
            return acc;
        }, { totalShifts: 0, totalMinutes: 0 });

        totals.totalHours = totals.totalMinutes / 60;

        res.json({
            employees: report.map(emp => ({
                ...emp,
                totalHours: Math.round(emp.totalHours * 100) / 100,
                avgHoursPerShift: Math.round((emp.avgMinutesPerShift / 60) * 100) / 100
            })),
            totals: {
                employees: report.length,
                totalShifts: totals.totalShifts,
                totalHours: Math.round(totals.totalHours * 100) / 100
            },
            dateRange: {
                start: startDate || null,
                end: endDate || null
            }
        });

    } catch (error) {
        console.error('Error generating payroll report:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    }
});

// GET Individual Employee Hours (for detailed breakdown)
router.get('/employee/:employeeId', isAdmin, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }

        const query = {
            userId: employeeId,
            status: 'checked-out',
            'checkIn.time': { $exists: true },
            'checkOut.time': { $exists: true }
        };

        if (Object.keys(dateFilter).length > 0) {
            query['checkIn.time'] = dateFilter;
        }

        const shifts = await Attendance.find(query)
            .populate('clientId', 'name')
            .sort({ 'checkIn.time': -1 });

        const details = shifts.map(s => ({
            date: s.checkIn.time,
            checkIn: s.checkIn.time,
            checkOut: s.checkOut.time,
            client: s.clientId?.name || 'Unknown',
            minutes: Math.round((new Date(s.checkOut.time) - new Date(s.checkIn.time)) / 60000),
            hours: Math.round(((new Date(s.checkOut.time) - new Date(s.checkIn.time)) / 3600000) * 100) / 100
        }));

        res.json(details);

    } catch (error) {
        console.error('Error fetching employee hours:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
