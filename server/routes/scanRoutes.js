// File: /server/routes/scanRoutes.js
// Purpose: Defines API route(s) related to scanning/validation actions.

const express = require('express');
const { validateBookingQR } = require('../controllers/bookingController'); // Get the controller function
const authMiddleware = require('../middleware/authMiddleware'); // Authentication check
const { isOrganizerOrAdmin } = require('../middleware/roleMiddleware'); // Role check (fine-grained check in controller)
const { check } = require('express-validator');

const router = express.Router();

// --- Validation Rules ---
const validateScanValidation = [
    // Corrected to check for 'qrCodeData' and ensure it's a non-empty string
    check('qrCodeData', 'QR Code Data is required').not().isEmpty().trim()
];

// --- Route Definition ---

// @route   POST /api/scan/validate
// @desc    Validate booking QR code data and check-in
// @access  Private (Admin or Relevant Organizer - checked in controller)
router.post(
    '/validate',
    authMiddleware,         // 1. Check Login
    isOrganizerOrAdmin,     // 2. Check Role (is Admin or Organizer?)
    validateScanValidation, // 3. Validate input
    validateBookingQR       // 4. Execute controller (performs detailed auth & logic)
);


module.exports = router;