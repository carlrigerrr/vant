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
    res.status(401).json({ msg: 'Unauthorized' });
};

// Get service history for a client
router.get('/client/:clientId', isAdmin, async (req, res) => {
    try {
        const history = await ServiceHistory.find({ clientId: req.params.clientId })
            .populate('employeeId', 'name')
            .sort({ serviceDate: -1 })
            .limit(20);
        res.json(history);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Add service history entry
router.post('/', isAdmin, async (req, res) => {
    try {
        const { clientId, employeeId, serviceDate, notes } = req.body;

        const entry = new ServiceHistory({
            clientId,
            employeeId,
            serviceDate: new Date(serviceDate),
            notes
        });

        await entry.save();
        res.json({ msg: 'Service history added', entry });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get rotation stats for a client (who has serviced and how many times)
router.get('/rotation/:clientId', isAdmin, async (req, res) => {
    try {
        const stats = await ServiceHistory.aggregate([
            { $match: { clientId: require('mongoose').Types.ObjectId(req.params.clientId) } },
            {
                $group: {
                    _id: '$employeeId',
                    count: { $sum: 1 },
                    lastService: { $max: '$serviceDate' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Populate employee names
        const populatedStats = await User.populate(stats, { path: '_id', select: 'username' });

        res.json(populatedStats.map(s => ({
            employee: { _id: s._id?._id, name: s._id?.username },
            serviceCount: s.count,
            lastService: s.lastService
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Suggest next employee for rotation (least services or longest since last)
router.get('/suggest/:clientId', isAdmin, async (req, res) => {
    try {
        // Get all active employees (use lean() for plain objects)
        const allEmployees = await User.find({ active: { $ne: false } }).select('username').lean();

        // Get service history for this client
        const history = await ServiceHistory.aggregate([
            { $match: { clientId: require('mongoose').Types.ObjectId(req.params.clientId) } },
            {
                $group: {
                    _id: '$employeeId',
                    count: { $sum: 1 },
                    lastService: { $max: '$serviceDate' }
                }
            }
        ]);

        const historyMap = new Map(history.map(h => [h._id.toString(), h]));

        // Score each employee (lower = better candidate)
        const scored = allEmployees.map(emp => {
            const hist = historyMap.get(emp._id.toString());
            if (!hist) {
                // Never serviced this client - top priority
                return { employee: { _id: emp._id, name: emp.username }, score: 0, count: 0, lastService: null };
            }
            // Score based on count and recency
            const daysSince = hist.lastService ?
                Math.floor((Date.now() - hist.lastService) / (1000 * 60 * 60 * 24)) : 999;
            return {
                employee: { _id: emp._id, name: emp.username },
                score: hist.count * 10 - daysSince, // Lower is better
                count: hist.count,
                lastService: hist.lastService
            };
        });

        // Sort by score (ascending)
        scored.sort((a, b) => a.score - b.score);

        res.json(scored.slice(0, 5)); // Return top 5 suggestions
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
