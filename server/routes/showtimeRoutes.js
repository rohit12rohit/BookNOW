// server/routes/showtimeRoutes.js
const express = require('express');
const {
    createShowtime, getShowtimes, getShowtimeById,
    updateShowtime, deleteShowtime, getShowtimeSeatmap
} = require('../controllers/showtimeController');
const authMiddleware = require('../middleware/authMiddleware');
const { isOrganizerOrAdmin } = require('../middleware/roleMiddleware');
const { check, body, validationResult } = require('express-validator');
const mongoose = require('mongoose'); // Needed for ObjectId.isValid

const router = express.Router();

const commonShowtimeValidation = [
    check('venue', 'Venue ID is required').exists({ checkFalsy: true }).isMongoId(),
    check('screenId', 'Screen ID is required').exists({ checkFalsy: true }).isMongoId(),
    check('startTime', 'Start time is required and must be a valid date').exists({ checkFalsy: true }).isISO8601().toDate(),
    check('priceTiers', 'Price tiers are required.').isArray({ min: 1 }).withMessage('At least one price tier must be defined.'),
    check('priceTiers.*.seatType', 'Each price tier must have a seatType.').isString().notEmpty().withMessage('Seat type cannot be empty.'),
    check('priceTiers.*.price', 'Each price tier must have a valid, non-negative price.').isFloat({ min: 0 }), // Changed gt:-0.01 to min:0
    check('isActive').optional().isBoolean().withMessage('isActive must be true or false')
];

const createShowtimeValidation = [
    check('movie') // Check movie/event logic via custom validation
        .custom((value, { req }) => {
            const movie = req.body.movie;
            const event = req.body.event;
            if (movie && event) throw new Error('Showtime cannot link to both a Movie and an Event.');
            if (!movie && !event) throw new Error('Showtime must link to either a Movie or an Event.');
            if (movie && !mongoose.Types.ObjectId.isValid(movie)) throw new Error('Movie ID must be a valid MongoDB ObjectId.');
            if (event && !mongoose.Types.ObjectId.isValid(event)) throw new Error('Event ID must be a valid MongoDB ObjectId.');
            return true;
        }).optional(), // Make base check optional, custom logic handles presence
    ...commonShowtimeValidation
];

const updateShowtimeValidation = [
    // For updates, most fields are optional but if provided, must be valid
    check('movie').optional().isMongoId().withMessage('Movie ID must be a valid MongoID.'),
    check('event').optional().isMongoId().withMessage('Event ID must be a valid MongoID.'),
    check().custom((value, { req }) => { // Ensure not both if one is being updated to exist
        if (req.body.movie && req.body.event) {
            throw new Error('Cannot link showtime to both a Movie and an Event during update.');
        }
        return true;
    }),
    check('venue').optional().isMongoId(),
    check('screenId').optional().isMongoId(),
    check('startTime').optional().isISO8601().toDate(),
    check('priceTiers').optional().isArray().withMessage('Price tiers, if provided, must be an array.'),
    check('priceTiers.*.seatType').optional().if(body('priceTiers').exists()).isString().notEmpty().withMessage('Seat type in price tier cannot be empty.'),
    check('priceTiers.*.price').optional().if(body('priceTiers').exists()).isFloat({ min: 0 }).withMessage('Price in price tier must be non-negative.'),
    check('isActive').optional().isBoolean()
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('[SHOWTIME ROUTE VALIDATION ERRORS]:', JSON.stringify(errors.array(), null, 2));
        return res.status(400).json({ errors: errors.array() });
    }
    console.log('[SHOWTIME ROUTE] Validation passed. Body:', JSON.stringify(req.body, null, 2));
    next();
};

// --- Public Routes ---
router.get('/', getShowtimes);
router.get('/:id', getShowtimeById);
router.get('/:id/seatmap', getShowtimeSeatmap);

// --- Protected Routes ---
router.post('/', authMiddleware, isOrganizerOrAdmin, createShowtimeValidation, handleValidationErrors, createShowtime);
router.put('/:id', authMiddleware, isOrganizerOrAdmin, updateShowtimeValidation, handleValidationErrors, updateShowtime);
router.delete('/:id', authMiddleware, isOrganizerOrAdmin, deleteShowtime);

module.exports = router;