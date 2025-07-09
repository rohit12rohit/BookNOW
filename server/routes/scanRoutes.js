// server/routes/scanRoutes.js
// Purpose: Defines API route(s) related to scanning/validation actions.

const express = require('express');
const { validateBookingQR } = require('../controllers/bookingController'); // Get the controller function
const authMiddleware = require('../middleware/authMiddleware'); // Authentication check
const { isOrganizerOrAdmin } = require('../middleware/roleMiddleware'); // Role check (fine-grained check in controller)
const { check } = require('express-validator');
// console.log('[SCAN DEBUG] typeof validateBookingQR:', typeof validateBookingQR);
// console.log('[SCAN DEBUG] typeof authMiddleware:', typeof authMiddleware);
// console.log('[SCAN DEBUG] typeof isOrganizerOrAdmin:', typeof isOrganizerOrAdmin);
const router = express.Router();

// --- Validation Rules ---
const validateScanValidation = [
    check('bookingId', 'Booking ID is required').isMongoId()
];

// --- Route Definition ---

// @route   POST /api/scan/validate
// @desc    Validate booking QR code data (bookingId) and check-in
// @access  Private (Admin or Relevant Organizer - checked in controller)
router.post(
    '/validate',
    authMiddleware,         // 1. Check Login
    isOrganizerOrAdmin,     // 2. Check Role (is Admin or Organizer?)
    validateScanValidation, // 3. Validate input bookingId format
    validateBookingQR       // 4. Execute controller (performs detailed auth & logic)
);


module.exports = router;