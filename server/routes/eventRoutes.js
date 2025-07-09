// server/routes/eventRoutes.js
// Purpose: Defines API routes related to events.

const express = require('express');
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin, isOrganizer, isOrganizerOrAdmin } = require('../middleware/roleMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// --- Validation Rules ---
const eventValidationRules = [
    check('title', 'Event title is required').not().isEmpty().trim(),
    check('description', 'Description is required').not().isEmpty().trim(),
    check('category', 'Category is required').not().isEmpty().trim(),
    check('startDate', 'Start date is required').isISO8601().toDate(),
    check('endDate').optional().isISO8601().toDate(),
    check('venue').optional().isMongoId().withMessage('Invalid Venue ID format'),
    check('location', 'Event location is required').not().isEmpty().trim(), // Added location validation
    check('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Invalid Image URL'),
    check('trailerUrl', 'Invalid Trailer URL').optional({ checkFalsy: true }).isURL().withMessage('Please enter a valid YouTube URL for the trailer.'),
    check('tags').optional().isArray(),
    check('status').optional().isIn(['Scheduled', 'Postponed', 'Cancelled', 'Completed'])
];


// --- Public Routes ---
router.get('/', getEvents);
router.get('/:id', getEventById);


// --- Protected Routes ---
router.post(
    '/',
    authMiddleware,
    isOrganizerOrAdmin,
    eventValidationRules,
    createEvent
);

router.put(
    '/:id',
    authMiddleware,
    isOrganizerOrAdmin,
    eventValidationRules,
    updateEvent
);

router.delete(
    '/:id',
    authMiddleware,
    isOrganizerOrAdmin,
    deleteEvent
);


module.exports = router;