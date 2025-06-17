// server/controllers/promoCodeController.js
// Purpose: Contains logic for user-facing promo code operations (e.g., fetching available, verifying).

const PromoCode = require('../models/PromoCode');
const { validationResult } = require('express-validator');

// @desc    Get all active and valid promo codes (for dropdown/list on frontend)
// @route   GET /api/promocodes/available
// @access  Public
exports.getAvailablePromoCodes = async (req, res) => {
    try {
        // Find all active promo codes and potentially filter out expired ones based on validUntil
        // The isValid() method in the model is useful here.
        const promoCodes = await PromoCode.find({ isActive: true }).sort({ createdAt: -1 });

        // Filter based on model's isValid method
        const availablePromoCodes = promoCodes.filter(code => code.isValid());

        res.status(200).json(
            availablePromoCodes.map(code => ({
                _id: code._id,
                code: code.code,
                description: code.description,
                discountType: code.discountType,
                discountValue: code.discountValue,
                minPurchaseAmount: code.minPurchaseAmount,
                maxDiscountAmount: code.maxDiscountAmount
                // Do not expose internal uses count or sensitive timestamps here
            }))
        );
    } catch (err) {
        console.error('Error fetching available promo codes:', err.message);
        res.status(500).json({ msg: 'Server error fetching promo codes' });
    }
};


// @desc    Verify a promo code for a given amount
// @route   POST /api/promocodes/verify
// @access  Public (client-side validation feedback)
exports.verifyPromoCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { code, amount } = req.body; // 'amount' is the pre-discount total of seats

    try {
        const promoCode = await PromoCode.findOne({ code: code.trim().toUpperCase(), isActive: true });

        if (!promoCode) {
            return res.status(404).json({ msg: 'Promo code not found or inactive.', valid: false });
        }

        // Use the model's isValid method for basic validity checks (dates, max uses)
        if (!promoCode.isValid()) {
            return res.status(400).json({ msg: 'Promo code is expired or maximum uses reached.', valid: false });
        }

        // Calculate the discount for the given amount
        const calculatedDiscount = promoCode.calculateDiscount(amount);

        if (calculatedDiscount === 0 && amount < promoCode.minPurchaseAmount) {
            return res.status(400).json({
                msg: `Minimum purchase amount of Rs. ${promoCode.minPurchaseAmount.toFixed(2)} not met.`,
                valid: false
            });
        }
        
        if (calculatedDiscount === 0 && amount >= promoCode.minPurchaseAmount) {
             return res.status(200).json({ // Valid, but no discount applied (e.g. 0% off)
                msg: 'Promo code is valid, but no discount applied for this amount (e.g. 0% off).',
                valid: true,
                discount: 0
            });
        }

        res.status(200).json({
            msg: 'Promo code verified successfully!',
            valid: true,
            discount: calculatedDiscount,
            promoDetails: {
                code: promoCode.code,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
                maxDiscountAmount: promoCode.maxDiscountAmount,
                description: promoCode.description
            }
        });

    } catch (err) {
        console.error('Error verifying promo code:', err.message);
        res.status(500).json({ msg: 'Server error during promo code verification.', valid: false });
    }
};