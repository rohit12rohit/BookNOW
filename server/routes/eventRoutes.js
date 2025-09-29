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
    check('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Invalid Image URL'),
    check('tags').optional().isArray(),
    check('status').optional().isIn(['Scheduled', 'Postponed', 'Cancelled', 'Completed'])
];


// --- Public Routes ---

// @route   GET /api/events
// @desc    Get all active/upcoming events (with filters)
// @access  Public
router.get('/', getEvents);

// @route   GET /api/events/:id
// @desc    Get a single event by ID
// @access  Public
router.get('/:id', getEventById);


// --- Protected Routes ---

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Admin or Approved Organizer)
router.post(
    '/',
    authMiddleware,         // 1. Check login
    isOrganizerOrAdmin,     // 2. Check role (Controller checks approval/venue auth)
    eventValidationRules,   // 3. Validate input
    createEvent             // 4. Execute controller
);

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Admin or Owning Organizer - checked in controller)
router.put(
    '/:id',
    authMiddleware,         // 1. Check login
    isOrganizerOrAdmin,     // 2. Basic role check (Controller checks ownership/venue auth)
    eventValidationRules,   // 3. Validate input
    updateEvent             // 4. Execute controller
);

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (Admin or Owning Organizer - checked in controller)
router.delete(
    '/:id',
    authMiddleware,         // 1. Check login
    isOrganizerOrAdmin,     // 2. Basic role check (Controller checks ownership/venue auth)
    deleteEvent             // 3. Execute controller
);


module.exports = router;