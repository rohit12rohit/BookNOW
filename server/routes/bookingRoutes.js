// File: /server/routes/bookingRoutes.js
// Purpose: Defines API routes related to bookings.

const express = require('express');
const {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking // Renamed from cancelMyBooking for clarity
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware'); // ALL booking routes require authentication
const { check } = require('express-validator');

const router = express.Router();

// --- Validation Rules ---
const createBookingValidation = [
    check('showtimeId', 'Showtime ID is required').isMongoId(),
    check('seats', 'Seats must be an array of strings').isArray({ min: 1 }),
    check('seats.*', 'Each seat must be a non-empty string').not().isEmpty().trim().escape() // Basic validation/sanitization
];

// --- Route Definitions ---

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (Authenticated Users)
router.post(
    '/',
    authMiddleware,             // 1. Check Login
    createBookingValidation,    // 2. Validate Input
    createBooking               // 3. Execute Controller
);

// @route   GET /api/bookings/me
// @desc    Get bookings for the logged-in user
// @access  Private
router.get(
    '/me',
    authMiddleware,             // 1. Check Login
    getMyBookings               // 2. Execute Controller
);

// @route   GET /api/bookings/:id
// @desc    Get a specific booking by ID (checks ownership in controller)
// @access  Private
router.get(
    '/:id',
    authMiddleware,             // 1. Check Login
    getBookingById              // 2. Execute Controller
);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a specific booking (checks ownership in controller)
// @access  Private
router.put(
    '/:id/cancel',
    authMiddleware,             // 1. Check Login
    cancelBooking               // 2. Execute Controller
);


module.exports = router;