const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const User = require('../models/User');

// Middleware to check if client is authenticated
const isClient = (req, res, next) => {
    if (req.session && req.session.clientId) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized - Client access required' });
};

// Middleware to check if admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized - Admin access required' });
};

// Middleware to check if authenticated user
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// POST /api/ratings - Client creates a rating
router.post('/', isClient, async (req, res) => {
    try {
        const { employeeId, rating, comment, serviceDate } = req.body;
        const clientId = req.session.clientId;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }

        if (!employeeId) {
            return res.status(400).json({ msg: 'Employee ID is required' });
        }

        // Check if employee exists
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        // Create new rating
        const newRating = new Rating({
            clientId,
            employeeId,
            rating: parseInt(rating),
            comment: comment || '',
            serviceDate: serviceDate ? new Date(serviceDate) : new Date()
        });

        await newRating.save();
        res.json({ msg: 'Rating submitted successfully', rating: newRating });
    } catch (error) {
        console.error('Error creating rating:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/ratings/employee/:employeeId - Get all ratings for an employee
router.get('/employee/:employeeId', isAuthenticated, async (req, res) => {
    try {
        const { employeeId } = req.params;

        const ratings = await Rating.find({ employeeId })
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const avgRating = ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
            : 0;

        res.json({
            ratings,
            averageRating: parseFloat(avgRating),
            totalRatings: ratings.length
        });
    } catch (error) {
        console.error('Error fetching employee ratings:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/ratings/my-ratings - Client gets their submitted ratings
router.get('/my-ratings', isClient, async (req, res) => {
    try {
        const clientId = req.session.clientId;

        const ratings = await Rating.find({ clientId })
            .populate('employeeId', 'username')
            .sort({ createdAt: -1 });

        res.json(ratings);
    } catch (error) {
        console.error('Error fetching client ratings:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/ratings/all - Admin gets all ratings
router.get('/all', isAdmin, async (req, res) => {
    try {
        const ratings = await Rating.find({})
            .populate('clientId', 'name email')
            .populate('employeeId', 'username')
            .sort({ createdAt: -1 });

        res.json(ratings);
    } catch (error) {
        console.error('Error fetching all ratings:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/ratings/stats - Get rating statistics for all employees
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const stats = await Rating.aggregate([
            {
                $group: {
                    _id: '$employeeId',
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 },
                    fiveStarCount: {
                        $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
                    },
                    fourStarCount: {
                        $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
                    },
                    threeStarCount: {
                        $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
                    },
                    twoStarCount: {
                        $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
                    },
                    oneStarCount: {
                        $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
                    }
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
                    username: '$employee.username',
                    averageRating: { $round: ['$averageRating', 1] },
                    totalRatings: 1,
                    fiveStarCount: 1,
                    fourStarCount: 1,
                    threeStarCount: 1,
                    twoStarCount: 1,
                    oneStarCount: 1
                }
            },
            {
                $sort: { averageRating: -1 }
            }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('Error fetching rating stats:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/ratings/:id - Admin deletes a rating
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const rating = await Rating.findByIdAndDelete(id);
        if (!rating) {
            return res.status(404).json({ msg: 'Rating not found' });
        }

        res.json({ msg: 'Rating deleted successfully' });
    } catch (error) {
        console.error('Error deleting rating:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
