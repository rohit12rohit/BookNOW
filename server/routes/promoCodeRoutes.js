// server/routes/promoCodeRoutes.js
// Purpose: Defines API routes for user-facing promo code functionality.

const express = require('express');
const { getAvailablePromoCodes, verifyPromoCode } = require('../controllers/promoCodeController');
const { check } = require('express-validator');

const router = express.Router();

// @route   GET /api/promocodes/available
// @desc    Get a list of active and valid promo codes for users
// @access  Public
router.get('/available', getAvailablePromoCodes);

// @route   POST /api/promocodes/verify
// @desc    Verify a promo code against a given amount
// @access  Public
router.post(
    '/verify',
    [
        check('code', 'Promo code is required').not().isEmpty().trim().escape(),
        check('amount', 'Amount is required and must be a non-negative number').isFloat({ min: 0 })
    ],
    verifyPromoCode
);

module.exports = router;