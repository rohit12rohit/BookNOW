// server/routes/organizerRoutes.js
// Purpose: Defines API routes specifically for logged-in and approved Organizers.

const express = require('express');
const {
    getOrganizerDashboardStats,
    getMyVenues,
    getMyShowtimes,
    getMyVenueBookings,
    updateMyProfile,
    getMyEvents 
} = require('../controllers/organizerController');
const authMiddleware = require('../middleware/authMiddleware'); // Authentication check
const { isOrganizer } = require('../middleware/roleMiddleware'); // Role AND Approval check
const { check } = require('express-validator');

const router = express.Router();

// --- Apply organizer authorization to all routes in this file ---
router.use(authMiddleware); // 1. Check login
router.use(isOrganizer);    // 2. Check role is 'organizer' AND isApproved


// --- Route Definitions ---

// @route   GET /api/organizer/dashboard
// @desc    Get dashboard stats for the organizer
// @access  Private (Approved Organizer Only)
router.get('/dashboard', getOrganizerDashboardStats);

// @route   GET /api/organizer/venues
// @desc    Get venues managed by the organizer
// @access  Private (Approved Organizer Only)
router.get('/venues', getMyVenues);

// @route   GET /api/organizer/showtimes
// @desc    Get showtimes for the organizer's venues (allows filtering)
// @access  Private (Approved Organizer Only)
router.get('/showtimes', getMyShowtimes);

// @route   GET /api/organizer/bookings
// @desc    Get bookings for the organizer's venues/showtimes (allows filtering)
// @access  Private (Approved Organizer Only)
router.get('/bookings', getMyVenueBookings);

// @route   GET /api/organizer/events
// @desc    Get events managed by the organizer
// @access  Private (Approved Organizer Only)
router.get('/events', getMyEvents);

// @route   PUT /api/organizer/profile
// @desc    Update organizer's own profile details
// @access  Private (Approved Organizer Only)
const profileUpdateValidation = [
    check('name').optional().notEmpty().trim().escape().withMessage('Name cannot be empty'),
    check('organizationName').optional().notEmpty().trim().escape().withMessage('Organization name cannot be empty')
];
router.put('/profile', profileUpdateValidation, updateMyProfile);


// Note: Routes for creating/updating/deleting venues and showtimes are already defined
// in venueRoutes.js and showtimeRoutes.js, using isOrganizerOrAdmin middleware
// and controller logic that checks ownership or admin status. These dedicated GET routes
// are primarily for fetching data scoped to the logged-in organizer.

module.exports = router;