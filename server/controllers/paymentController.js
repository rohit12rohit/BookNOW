// server/controllers/paymentController.js
// Purpose: Razorpay payment logic

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Create Order ---
exports.createOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) return res.status(404).json({ msg: 'Booking not found' });
        
        // Ownership check using req.user._id (from new auth middleware)
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        if (booking.status !== 'PaymentPending') {
            return res.status(400).json({ msg: 'Booking is not pending payment.' });
        }

        const options = {
            amount: Math.round(booking.totalAmount * 100), // paise
            currency: "INR",
            receipt: booking.bookingRefId,
            notes: { bookingId: booking._id.toString() }
        };

        const order = await razorpay.orders.create(options);

        booking.razorpayOrderId = order.id;
        await booking.save();

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID // Send key to frontend convenience
        });

    } catch (err) {
        console.error('Payment Order Error:', err);
        res.status(500).json({ msg: 'Server error creating payment order' });
    }
};

// --- Verify Payment ---
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
    
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Idempotency: If already confirmed, just return success
        if (booking.status === 'Confirmed') {
            await session.abortTransaction();
            return res.status(200).json({ success: true, msg: 'Booking already confirmed.' });
        }

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            booking.razorpayPaymentId = razorpay_payment_id;
            booking.razorpaySignature = razorpay_signature;
            booking.status = 'Confirmed';
            
            await booking.save({ session });
            await session.commitTransaction();

            res.status(200).json({ success: true, msg: 'Booking Confirmed!', bookingId: booking._id });
        } else {
            await session.abortTransaction();
            // We don't save 'PaymentFailed' here immediately to allow user to retry 
            // without losing the booking, or we can handle it in a separate cleanup job.
            return res.status(400).json({ success: false, msg: 'Invalid payment signature' });
        }

    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('Verify Payment Error:', err);
        res.status(500).json({ msg: 'Server error verifying payment' });
    } finally {
        session.endSession();
    }
};