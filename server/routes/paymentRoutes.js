// File: /server/routes/paymentRoutes.js
// Purpose: Defines API routes for handling payment processing with Razorpay.

const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// All payment routes should require a user to be logged in
router.use(authMiddleware);

// Validation for creating an order
const orderValidation = [
    check('bookingId', 'Booking ID is required').isMongoId(),
];

// Validation for verifying a payment
const verificationValidation = [
    check('razorpay_order_id', 'Razorpay Order ID is required').not().isEmpty(),
    check('razorpay_payment_id', 'Razorpay Payment ID is required').not().isEmpty(),
    check('razorpay_signature', 'Razorpay Signature is required').not().isEmpty(),
    check('bookingId', 'Original Booking ID is required').isMongoId(),
];

// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order for a pending booking
// @access  Private
router.post('/create-order', orderValidation, createOrder);

// @route   POST /api/payments/verify
// @desc    Verify the payment signature from Razorpay and confirm the booking
// @access  Private
router.post('/verify', verificationValidation, verifyPayment);

module.exports = router;