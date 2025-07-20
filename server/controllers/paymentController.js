// File: /server/controllers/paymentController.js
// Purpose: Contains logic for Razorpay payment integration.

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.body;
    const userId = req.user.id;

    try {
        const booking = await Booking.findById(bookingId);

        // Security and validation checks
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found.' });
        }
        if (booking.user.toString() !== userId) {
            return res.status(403).json({ msg: 'Not authorized to pay for this booking.' });
        }
        if (booking.status !== 'PaymentPending') {
            return res.status(400).json({ msg: `Booking is already in '${booking.status}' status.` });
        }
        if (booking.totalAmount <= 0) {
             // For free bookings, we can confirm it directly without payment.
             // This logic can be handled in the booking controller itself.
             // Here we assume only bookings with an amount > 0 hit this endpoint.
             return res.status(400).json({ msg: 'No payment required for this booking.' });
        }

        const options = {
            amount: Math.round(booking.totalAmount * 100), // Amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: booking.bookingRefId, // Use our unique booking ref as the receipt
            notes: {
                bookingId: booking._id.toString(),
                userId: userId,
            },
        };

        const order = await razorpay.orders.create(options);
        
        // Save the razorpay_order_id to our booking document
        booking.razorpayOrderId = order.id;
        await booking.save();
        
        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            bookingId: booking._id,
        });

    } catch (err) {
        console.error('Razorpay order creation error:', err);
        res.status(500).json({ msg: 'Server error while creating payment order.' });
    }
};

// @desc    Verify payment signature
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Booking not found for verification.' });
        }
        
        // Recreate the signature on the server to verify authenticity
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Signature matches - payment is authentic
            booking.razorpayPaymentId = razorpay_payment_id;
            booking.razorpaySignature = razorpay_signature;
            booking.status = 'Confirmed';
            
            await booking.save({ session });
            await session.commitTransaction();

            // TODO: Send confirmation email (can be done asynchronously)

            res.status(200).json({
                success: true,
                msg: 'Payment verified successfully. Booking confirmed!',
                bookingId: booking._id,
                bookingRefId: booking.bookingRefId,
            });

        } else {
            // Signature does not match
            await session.abortTransaction();
            booking.status = 'PaymentFailed';
            await booking.save(); // Save the failed status outside the transaction
            return res.status(400).json({ success: false, msg: 'Payment verification failed. Signature mismatch.' });
        }
    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('Payment verification error:', err);
        res.status(500).json({ msg: 'Server error during payment verification.' });
    } finally {
        session.endSession();
    }
};