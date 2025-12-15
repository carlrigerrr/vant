const express = require('express');
const router = express.Router();
const ServiceHistory = require('../models/ServiceHistory');
const Client = require('../models/Client');
const User = require('../models/User');

// Middleware to check admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized - Admin access required' });
};

// GET /api/revenue/stats - Get overall revenue statistics
router.get('/stats', isAdmin, async (req, res) => {
    try {
        // Total revenue (all time)
        const totalRevenueResult = await ServiceHistory.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // Revenue this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyRevenueResult = await ServiceHistory.aggregate([
            { $match: { serviceDate: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

        // Revenue this week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const weeklyRevenueResult = await ServiceHistory.aggregate([
            { $match: { serviceDate: { $gte: startOfWeek } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const weeklyRevenue = weeklyRevenueResult[0]?.total || 0;

        // Revenue by payment status
        const paymentStatusStats = await ServiceHistory.aggregate([
            {
                $group: {
                    _id: '$paymentStatus',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusBreakdown = {
            paid: 0,
            pending: 0,
            cancelled: 0
        };

        paymentStatusStats.forEach(stat => {
            if (stat._id) {
                statusBreakdown[stat._id] = stat.total;
            }
        });

        // Average service price
        const avgPriceResult = await ServiceHistory.aggregate([
            { $match: { amount: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: '$amount' } } }
        ]);
        const avgServicePrice = avgPriceResult[0]?.avg || 0;

        res.json({
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
            weeklyRevenue: Math.round(weeklyRevenue * 100) / 100,
            paidRevenue: Math.round(statusBreakdown.paid * 100) / 100,
            pendingRevenue: Math.round(statusBreakdown.pending * 100) / 100,
            cancelledRevenue: Math.round(statusBreakdown.cancelled * 100) / 100,
            avgServicePrice: Math.round(avgServicePrice * 100) / 100
        });
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/revenue/by-client - Get revenue breakdown by client
router.get('/by-client', isAdmin, async (req, res) => {
    try {
        const revenueByClient = await ServiceHistory.aggregate([
            {
                $group: {
                    _id: '$clientId',
                    totalRevenue: { $sum: '$amount' },
                    serviceCount: { $sum: 1 },
                    paidAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0]
                        }
                    },
                    pendingAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'clients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            {
                $unwind: '$client'
            },
            {
                $project: {
                    clientId: '$_id',
                    clientName: '$client.name',
                    clientEmail: '$client.email',
                    totalRevenue: { $round: ['$totalRevenue', 2] },
                    serviceCount: 1,
                    paidAmount: { $round: ['$paidAmount', 2] },
                    pendingAmount: { $round: ['$pendingAmount', 2] }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        res.json(revenueByClient);
    } catch (error) {
        console.error('Error fetching revenue by client:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/revenue/by-employee - Get revenue breakdown by employee
router.get('/by-employee', isAdmin, async (req, res) => {
    try {
        const revenueByEmployee = await ServiceHistory.aggregate([
            {
                $group: {
                    _id: '$employeeId',
                    totalRevenue: { $sum: '$amount' },
                    serviceCount: { $sum: 1 }
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
            {
                $unwind: '$employee'
            },
            {
                $project: {
                    employeeId: '$_id',
                    employeeName: '$employee.username',
                    totalRevenue: { $round: ['$totalRevenue', 2] },
                    serviceCount: 1,
                    avgPerService: {
                        $round: [{ $divide: ['$totalRevenue', '$serviceCount'] }, 2]
                    }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        res.json(revenueByEmployee);
    } catch (error) {
        console.error('Error fetching revenue by employee:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/revenue/monthly-trend - Get monthly revenue trend (last 6 months)
router.get('/monthly-trend', isAdmin, async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await ServiceHistory.aggregate([
            { $match: { serviceDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$serviceDate' },
                        month: { $month: '$serviceDate' }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    revenue: { $round: ['$revenue', 2] },
                    count: 1
                }
            }
        ]);

        res.json(monthlyTrend);
    } catch (error) {
        console.error('Error fetching monthly trend:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/revenue/recent-transactions - Get recent revenue transactions
router.get('/recent-transactions', isAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const transactions = await ServiceHistory.find({ amount: { $gt: 0 } })
            .populate('clientId', 'name email')
            .populate('employeeId', 'username')
            .sort({ serviceDate: -1 })
            .limit(limit);

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
