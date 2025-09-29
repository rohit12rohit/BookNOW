// server/routes/bookingRoutes.js
// Purpose: Defines API routes related to bookings.

const express = require('express');
const {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    cancelPendingBooking // Correctly import the controller function
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// --- Validation Rules ---
const createBookingValidation = [
    check('showtimeId', 'Showtime ID is required').isMongoId(),
    check('seats', 'Seats must be an array of strings').isArray({ min: 1 }),
    check('seats.*', 'Each seat must be a non-empty string').not().isEmpty().trim().escape()
];

// --- Route Definitions ---

// @route   POST /api/bookings
// @desc    Create a new booking (status becomes 'PaymentPending')
// @access  Private (Authenticated Users)
router.post(
    '/',
    authMiddleware,
    createBookingValidation,
    createBooking
);

// @route   GET /api/bookings/me
// @desc    Get bookings for the logged-in user
// @access  Private
router.get(
    '/me',
    authMiddleware,
    getMyBookings
);

// @route   GET /api/bookings/:id
// @desc    Get a specific booking by ID (checks ownership or admin role in controller)
// @access  Private
router.get(
    '/:id',
    authMiddleware,
    getBookingById
);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a confirmed booking (user self-service)
// @access  Private
router.put(
    '/:id/cancel',
    authMiddleware,
    cancelBooking
);

// @route   PUT /api/bookings/:id/cancel-pending
// @desc    Cancel a pending booking (e.g., user closes payment modal)
// @access  Private
router.put(
    '/:id/cancel-pending',
    authMiddleware,
    cancelPendingBooking // CORRECTED: Use the imported controller function
);


module.exports = router;