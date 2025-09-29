// server/routes/venueRoutes.js
// Purpose: Defines API routes related to venues.

const express = require('express');
const {
    getVenues,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue
} = require('../controllers/venueController');
const authMiddleware = require('../middleware/authMiddleware');
const { isOrganizerOrAdmin, isAdmin } = require('../middleware/roleMiddleware'); // Use existing role middleware
const { check, body } = require('express-validator'); // Import check/body for validation

const router = express.Router();

// --- Validation Rules ---
const venueValidationRules = [
    check('name', 'Venue name is required').not().isEmpty().trim(),
    check('address.street', 'Street address is required').not().isEmpty().trim(),
    check('address.city', 'City is required').not().isEmpty().trim(),
    check('address.state', 'State is required').not().isEmpty().trim(),
    check('address.zipCode', 'Zip code is required').not().isEmpty().isPostalCode('IN'), // Example: Validate for India postal codes
    check('screens', 'At least one screen is required').isArray({ min: 1 }),
    check('screens.*.name', 'Each screen must have a name').not().isEmpty().trim(),
    check('screens.*.capacity', 'Each screen must have a numeric capacity > 0').isInt({ gt: 0 }),
    // Optional validation for facilities, isActive etc.
    check('facilities').optional().isArray(),
    check('facilities.*').optional().isString().trim(),
    check('isActive').optional().isBoolean()
];

// --- Public Routes ---

// @route   GET /api/venues
// @desc    Get all active venues (optionally filter by city)
// @access  Public
router.get('/', getVenues);

// @route   GET /api/venues/:id
// @desc    Get a single venue by ID
// @access  Public
router.get('/:id', authMiddleware, getVenueById);


// --- Protected Routes ---

// @route   POST /api/venues
// @desc    Create a new venue
// @access  Private (Admin or Approved Organizer)
router.post(
    '/',
    authMiddleware,         // 1. Check login
    isOrganizerOrAdmin,     // 2. Check role (Controller does further approval check)
    venueValidationRules,   // 3. Validate input
    createVenue             // 4. Execute controller
);

// @route   PUT /api/venues/:id
// @desc    Update a venue
// @access  Private (Admin or Owning Organizer)
router.put(
    '/:id',
    authMiddleware,         // 1. Check login (Controller handles ownership/admin check)
    // Apply validation rules selectively if needed, or use the full set
    [ check('name', 'Venue name is required').optional().not().isEmpty().trim(), /* add other optional checks */],
    updateVenue             // 2. Execute controller (includes authorization)
);

// @route   DELETE /api/venues/:id
// @desc    Delete (or deactivate) a venue
// @access  Private (Admin or Owning Organizer)
router.delete(
    '/:id',
    authMiddleware,         // 1. Check login (Controller handles ownership/admin check)
    isOrganizerOrAdmin,
    deleteVenue             // 2. Execute controller (includes authorization)
);


module.exports = router;