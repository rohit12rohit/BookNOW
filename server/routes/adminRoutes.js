// File: /server/routes/adminRoutes.js
// Purpose: Defines API routes specifically for Admin actions.

const express = require('express');
const {
    getAllUsers,
    getUserById,
    approveOrganizer,
    updateUser,
    deleteUser,
    getAllPromoCodes,
    getPromoCodeById, 
    createPromoCode, 
    updatePromoCode, 
    deletePromoCode,  
    getAllBookings, 
    getBookingByIdAdmin,
    getPlatformStats,
    getAllReviewsAdmin,
    getAllCitiesAdmin, 
    createCity, 
    updateCity, 
    deleteCity,
    cancelAnyBookingAdmin,
    getReportedReviewsAdmin,
    resolveReportedReviewAdmin
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware'); // Authentication check
const { isAdmin } = require('../middleware/roleMiddleware'); // Authorization check for Admin role
const { check } = require('express-validator'); // For input validation

const router = express.Router();

// --- Apply admin authorization to all routes in this file ---
// This middleware runs before any specific route handler in this router
router.use(authMiddleware); // First, ensure user is logged in
router.use(isAdmin); // Then, ensure user has 'admin' role


// --- Route Definitions ---

// @route   GET /api/admin/users
// @desc    Get all users (can filter by role query param)
// @access  Private (Admin Only - enforced by router.use)
router.get('/users', getAllUsers);

// @route   GET /api/admin/users/:id
// @desc    Get a specific user by ID
// @access  Private (Admin Only)
router.get('/users/:id', getUserById);

// @route   PUT /api/admin/organizers/:id/approve
// @desc    Approve a pending organizer
// @access  Private (Admin Only)
router.put('/organizers/:id/approve', approveOrganizer);


// @route   PUT /api/admin/users/:id
// @desc    Update user details (name, role, isApproved for organizers)
// @access  Private (Admin Only)
const updateUserValidation = [
    check('name').optional().notEmpty().trim().escape().withMessage('Name cannot be empty if provided'),
    check('role').optional().isIn(['user', 'organizer', 'admin']).withMessage('Invalid role'),
    check('isApproved').optional().isBoolean().withMessage('isApproved must be true or false'),
    check('organizationName').optional().trim().escape() // Added validation
];
router.put('/users/:id', updateUserValidation, updateUser);


// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (use with caution)
// @access  Private (Admin Only)
router.delete('/users/:id', deleteUser);

// --- NEW: Promo Code Management Routes ---

const createPromoCodeValidation = [
    check('code', 'Code is required').not().isEmpty().trim(),
    check('discountType', 'Discount type must be "percentage" or "fixed"').isIn(['percentage', 'fixed']),
    check('discountValue', 'Discount value must be a non-negative number').isFloat({ gt: -0.01 }),
    check('description').optional().isString().trim().escape(),
    check('minPurchaseAmount').optional().isFloat({ gt: -0.01 }).withMessage('Min purchase must be non-negative'),
    check('maxDiscountAmount').optional({nullable: true}).isFloat({ gt: -0.01 }).withMessage('Max discount must be non-negative'),
    check('validFrom').optional({nullable: true}).isISO8601().toDate().withMessage('Invalid Valid From date'),
    check('validUntil').optional({nullable: true}).isISO8601().toDate().withMessage('Invalid Valid Until date'),
    check('maxUses').optional({nullable: true}).isInt({ gt: 0 }).withMessage('Max uses must be a positive integer'),
    check('isActive').optional().isBoolean()
];

// Validation rules for UPDATING a promo code (fields are optional)
const updatePromoCodeValidation = [
    // NOTE: We generally don't allow updating 'code'. The controller prevents it.
    // So no validation needed here for 'code'.
    check('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Discount type must be "percentage" or "fixed"'),
    check('discountValue').optional().isFloat({ gt: -0.01 }).withMessage('Discount value must be non-negative'),
    check('description').optional().isString().trim().escape(),
    check('minPurchaseAmount').optional().isFloat({ gt: -0.01 }).withMessage('Min purchase must be non-negative'),
    check('maxDiscountAmount').optional({nullable: true}).isFloat({ gt: -0.01 }).withMessage('Max discount must be non-negative'), // Allow null to clear limit
    check('validFrom').optional({nullable: true}).isISO8601().toDate().withMessage('Invalid Valid From date'), // Allow null to clear date
    check('validUntil').optional({nullable: true}).isISO8601().toDate().withMessage('Invalid Valid Until date'), // Allow null to clear date
    check('maxUses').optional({nullable: true}).isInt({ gt: 0 }).withMessage('Max uses must be a positive integer'), // Allow null to clear limit
    check('isActive').optional().isBoolean()
];

// --- NEW: City Management Routes (Admin) ---
const cityValidation = [
    check('name', 'City name is required').not().isEmpty().trim(),
    check('state', 'State is required').not().isEmpty().trim(),
    check('isActive').optional().isBoolean()
];
const cityUpdateValidation = [ // Optional fields for update
    check('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
    check('state').optional().notEmpty().trim().withMessage('State cannot be empty'),
    check('isActive').optional().isBoolean()
];

// @route   GET /api/admin/promocodes
router.get('/promocodes', getAllPromoCodes);

// @route   GET /api/admin/promocodes/:id
router.get('/promocodes/:id', getPromoCodeById);

// @route   POST /api/admin/promocodes (Uses CREATE validation)
router.post('/promocodes', createPromoCodeValidation, createPromoCode);

// @route   PUT /api/admin/promocodes/:id (Uses UPDATE validation)
router.put('/promocodes/:id', updatePromoCodeValidation, updatePromoCode); // << Use specific update validation

// @route   DELETE /api/admin/promocodes/:id
router.delete('/promocodes/:id', deletePromoCode);

// --- NEW: Booking Management Routes ---

// @route   GET /api/admin/bookings
// @desc    Get all bookings with filtering & pagination
// @access  Private (Admin Only)
router.get('/bookings', getAllBookings);

// @route   GET /api/admin/bookings/:id
// @desc    Get a single booking by ID
// @access  Private (Admin Only)
router.get('/bookings/:id', getBookingByIdAdmin);

// TODO: Add routes later for admin updating/cancelling bookings if needed
// router.put('/bookings/:id/status', updateBookingStatusAdmin);
// router.delete('/bookings/:id', cancelAnyBookingAdmin);

// --- NEW: Platform Statistics Route ---

// @route   GET /api/admin/stats
// @desc    Get platform-wide statistics
// @access  Private (Admin Only)
router.get('/stats', getPlatformStats);

// --- NEW: Review Management Routes ---

// @route   GET /api/admin/reviews
// @desc    Get all reviews with filtering & pagination
// @access  Private (Admin Only)
router.get('/reviews', getAllReviewsAdmin);


// / --- Booking Management Routes ---
router.get('/bookings', getAllBookings);
router.get('/bookings/:id', getBookingByIdAdmin);
router.put('/bookings/:id/cancel', cancelAnyBookingAdmin);

// --- Platform Statistics Route ---
router.get('/stats', getPlatformStats);

// --- Review Management Routes (Admin) ---
router.get('/reviews', getAllReviewsAdmin); // Get all reviews
// NEW: Route to get only reported reviews
router.get('/reviews/reported', getReportedReviewsAdmin);
// NEW: Route to resolve a report on a review
router.put('/reviews/:reviewId/resolve', resolveReportedReviewAdmin);

// @route   GET /api/admin/cities
// @desc    Get all cities (admin view)
// @access  Private (Admin Only)
router.get('/cities', getAllCitiesAdmin);

// @route   POST /api/admin/cities
// @desc    Create a new city
// @access  Private (Admin Only)
router.post('/cities', cityValidation, createCity);

// @route   PUT /api/admin/cities/:id
// @desc    Update a city
// @access  Private (Admin Only)
router.put('/cities/:id', cityUpdateValidation, updateCity);

// @route   DELETE /api/admin/cities/:id
// @desc    Delete a city
// @access  Private (Admin Only)
router.delete('/cities/:id', deleteCity);

// --- NEW: Admin Booking Modification Routes ---

// @route   PUT /api/admin/bookings/:id/cancel
// @desc    Cancel any booking by ID
// @access  Private (Admin Only)
router.put('/bookings/:id/cancel', cancelAnyBookingAdmin);

// TODO: Add route later for admin updating booking status maybe?
// router.put('/bookings/:id/status', updateBookingStatusAdmin);
module.exports = router;