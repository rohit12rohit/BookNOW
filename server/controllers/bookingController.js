// server/controllers/bookingController.js
// Purpose: Contains logic for handling booking-related API requests.

const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const Venue = require('../models/Venue');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const dayjs = require('dayjs');
const { customAlphabet } = require('nanoid');

// Using a more standard alphabet without easily confused characters (e.g., I, O, 0, 1)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateBookingRefId = customAlphabet(ALPHABET, 6);

// Helper to generate unique ID
async function generateUniqueBookingRefId(session) {
    let bookingRefIdGenerated;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;
    while (!bookingRefIdGenerated && attempts < MAX_ATTEMPTS) {
        const potentialId = generateBookingRefId();
        const existing = await Booking.findOne({ bookingRefId: potentialId }, '_id', { session });
        if (!existing) {
            bookingRefIdGenerated = potentialId;
        }
        attempts++;
    }
    if (!bookingRefIdGenerated) {
        throw new Error('Failed to generate a unique booking reference ID.');
    }
    return bookingRefIdGenerated;
}

/**
 * Creates a new booking with a 'PaymentPending' status.
 * This is the first step in the booking process before payment.
 * @route POST /api/bookings
 * @access Private (Authenticated Users)
 */
exports.createBooking = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { showtimeId, seats, promoCode: promoCodeString } = req.body;
    const userId = req.user.id;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ errors: [{ msg: 'Please select at least one seat.' }] });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const showtime = await Showtime.findById(showtimeId).populate('venue').populate('movie').populate('event').session(session);
        if (!showtime || !showtime.isActive || !showtime.priceTiers || showtime.priceTiers.length === 0) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Showtime not found or is invalid.' });
        }
        
        const user = await User.findById(userId).session(session);
        if(!user) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'User not found.' });
        }

        const updatedShowtime = await Showtime.findOneAndUpdate(
            { _id: showtimeId, bookedSeats: { $not: { $elemMatch: { $in: seats } } } },
            { $addToSet: { bookedSeats: { $each: seats } } },
            { new: true, session: session }
        );
        if (!updatedShowtime) {
            await session.abortTransaction();
            return res.status(409).json({ msg: 'One or more selected seats are already booked. Please select different seats.' });
        }

        const screenForLayout = showtime.venue.screens.id(showtime.screenId);
        const seatTypeMap = new Map(screenForLayout.seatLayout.rows.flatMap(r => r.seats.map(s => [`${r.rowId}${s.seatNumber}`, s.type || 'Normal'])));
        const priceMap = new Map(showtime.priceTiers.map(t => [t.seatType, t.price]));
        const defaultPrice = priceMap.get('Normal') || 0;
        let originalAmount = seats.reduce((total, seatId) => total + (priceMap.get(seatTypeMap.get(seatId)) ?? defaultPrice), 0);

        let finalAmount = originalAmount;
        let discountAmount = 0;
        let appliedPromoCodeDoc = null;
        if (promoCodeString) {
            const promoCodeDoc = await PromoCode.findOne({ code: promoCodeString.trim().toUpperCase(), isActive: true }).session(session);
            if (promoCodeDoc && promoCodeDoc.isValid() && originalAmount >= promoCodeDoc.minPurchaseAmount) {
                discountAmount = promoCodeDoc.calculateDiscount(originalAmount);
                finalAmount = originalAmount - discountAmount;
                appliedPromoCodeDoc = promoCodeDoc;
                await PromoCode.updateOne({ _id: promoCodeDoc._id }, { $inc: { uses: 1 } }, { session });
            } else if (promoCodeDoc) {
                await session.abortTransaction();
                return res.status(400).json({ errors: [{ msg: `Minimum purchase of Rs. ${promoCodeDoc.minPurchaseAmount} not met.` }] });
            } else {
                 await session.abortTransaction();
                return res.status(400).json({ errors: [{ msg: 'Invalid, expired, or inapplicable promo code.' }] });
            }
        }

        const bookingRefId = await generateUniqueBookingRefId(session);
        
        const qrCodeDetails = {
            bookingRefId: bookingRefId,
            userName: user.name,
            userEmail: user.email,
            itemTitle: showtime.movie?.title || showtime.event?.title,
            venueName: showtime.venue.name,
            screenName: showtime.screenName,
            showtime: showtime.startTime,
            seats: seats,
            totalAmount: Math.max(finalAmount, 0)
        };

        const newBooking = new Booking({
            bookingRefId,
            user: userId,
            showtime: showtimeId,
            seats,
            originalAmount,
            totalAmount: Math.max(finalAmount, 0),
            discountAmount,
            promoCodeApplied: appliedPromoCodeDoc ? appliedPromoCodeDoc._id : null,
            status: 'PaymentPending',
            qrCodeData: JSON.stringify(qrCodeDetails)
        });

        const booking = await newBooking.save({ session: session });
        await session.commitTransaction();
        
        res.status(201).json(booking);

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        // *** THIS IS THE FIX ***
        // Check for MongoDB's write conflict error code (112)
        if (err.code === 112) {
            console.error('[createBooking] Write Conflict Error:', err);
            return res.status(409).json({ msg: 'These seats were just booked by another user. Please select different seats and try again.' });
        }
        // *** END OF FIX ***

        console.error('[createBooking] Error:', err);
        res.status(err.status || 500).json({ msg: err.message || 'Server error during booking.', errors: err.errors });
    } finally {
        session.endSession();
    }
};

/**
 * Get bookings for the logged-in user
 * @route GET /api/bookings/me
 * @access Private
 */
exports.getMyBookings = async (req, res) => {
    const userId = req.user.id;
    try {
        const bookings = await Booking.find({ user: userId })
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl duration releaseDate' },
                    { path: 'venue', select: 'name address' }
                ],
                select: 'startTime screenName'
            })
            .sort({ bookingTime: -1 });
        res.status(200).json(bookings);
    } catch (err) {
        console.error('Error fetching user bookings:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * Get a specific booking by ID for the logged-in user or admin
 * @route GET /api/bookings/:id
 * @access Private
 */
exports.getBookingById = async (req, res) => {
    const bookingIdentifier = req.params.id;
    const userId = req.user.id;
    try {
        const query = mongoose.Types.ObjectId.isValid(bookingIdentifier)
            ? { $or: [{ _id: bookingIdentifier }, { bookingRefId: bookingIdentifier.toUpperCase() }] }
            : { bookingRefId: bookingIdentifier.toUpperCase() };
        
        const booking = await Booking.findOne(query)
             .select('+qrCodeData') // Explicitly select the qrCodeData field
             .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl duration language genre censorRating' },
                    { path: 'venue', select: 'name address facilities' }
                ]
            }).populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        if (booking.user._id.toString() !== userId && req.user.role !== 'admin') {
             return res.status(403).json({ msg: 'User not authorized to view this booking' });
        }
        res.status(200).json(booking);
    } catch (err) {
        console.error('Error fetching booking by ID:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * Cancel a booking (by user)
 * @route PUT /api/bookings/:id/cancel
 * @access Private
 */
exports.cancelBooking = async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ msg: 'Invalid Booking ID format' });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Booking not found' });
        }

        if (booking.user.toString() !== userId) {
            await session.abortTransaction();
            return res.status(403).json({ msg: 'User not authorized to cancel this booking' });
        }

        if (booking.status === 'Cancelled' || booking.status === 'CheckedIn') {
            await session.abortTransaction();
            return res.status(400).json({ msg: `Booking is already ${booking.status} and cannot be cancelled.` });
        }

        const showtime = await Showtime.findById(booking.showtime).session(session);
        if (!showtime) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Associated showtime not found.' });
        }
        
        const twoHoursInMillis = 2 * 60 * 60 * 1000;
        if (new Date(showtime.startTime).getTime() - Date.now() < twoHoursInMillis) {
            await session.abortTransaction();
            return res.status(400).json({ msg: 'Cannot cancel booking this close to the showtime.' });
        }

        booking.status = 'Cancelled';
        await booking.save({ session: session });

        await Showtime.findByIdAndUpdate(
            booking.showtime,
            { $pullAll: { bookedSeats: booking.seats } },
            { new: true, session: session }
        );

        // TODO: Handle promo code use count reversal if applicable
        await session.commitTransaction();
        res.status(200).json({ success: true, msg: 'Booking cancelled successfully', booking });
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('Error cancelling booking:', err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    } finally {
        session.endSession();
    }
};

/**
 * Cancels a 'PaymentPending' booking. Called when user closes payment modal.
 * @route PUT /api/bookings/:id/cancel-pending
 * @access Private (Owner of booking)
 */
exports.cancelPendingBooking = async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const booking = await Booking.findOne({ _id: bookingId, user: userId }).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Pending booking not found or you are not the owner.' });
        }
        if (booking.status !== 'PaymentPending') {
            await session.abortTransaction();
            return res.status(400).json({ msg: `Booking status is '${booking.status}', not 'PaymentPending'.` });
        }

        // Release seats
        await Showtime.updateOne(
            { _id: booking.showtime },
            { $pullAll: { bookedSeats: booking.seats } },
            { session }
        );

        // Update booking status to 'Cancelled' or 'PaymentFailed'
        booking.status = 'PaymentFailed';
        await booking.save({ session });
        
        await session.commitTransaction();
        res.status(200).json({ success: true, msg: 'Booking cancelled and seats released.' });
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('Error cancelling pending booking:', err);
        res.status(500).json({ msg: 'Server error.' });
    } finally {
        session.endSession();
    }
};


/**
 * Validate a booking via QR code scan data
 * @route POST /api/scan/validate
 * @access Private (Admin or Organizer)
 */
exports.validateBookingQR = async (req, res) => {
    const { qrCodeData } = req.body; // Expect the full QR data string
    const staffUserId = req.user.id;
    
    let bookingDetails;
    try {
        bookingDetails = JSON.parse(qrCodeData);
    } catch (e) {
        return res.status(400).json({ msg: 'Invalid QR Code format.' });
    }

    if (!bookingDetails.bookingRefId) {
        return res.status(400).json({ msg: 'QR Code is missing a booking reference ID.' });
    }

    try {
        const booking = await Booking.findOne({ bookingRefId: bookingDetails.bookingRefId.toUpperCase() })
            .populate({ path: 'showtime', populate: { path: 'venue', select: 'organizer' } });

        if (!booking) {
            return res.status(404).json({ msg: 'Booking reference not found' });
        }
        
        let isAuthorized = false;
        if (req.user.role === 'admin') {
            isAuthorized = true;
        } else if (req.user.role === 'organizer' && booking.showtime?.venue?.organizer) {
            if (booking.showtime.venue.organizer.toString() === staffUserId) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ msg: 'Not authorized to validate bookings for this venue' });
        }
        if (booking.status === 'CheckedIn') {
            return res.status(409).json({ msg: `Booking already checked in at ${booking.checkInTime?.toLocaleString('en-IN')}` });
        }
        if (booking.status !== 'Confirmed') {
            return res.status(400).json({ msg: `Booking status is '${booking.status}', cannot check in.` });
        }
        
        booking.isCheckedIn = true;
        booking.checkInTime = new Date();
        booking.checkedInBy = staffUserId;
        booking.status = 'CheckedIn';
        await booking.save();

        // Respond with the details from the QR code for confirmation on the scanner's screen
        res.status(200).json({
            success: true,
            message: 'Check-in Successful!',
            bookingDetails: {
                ...bookingDetails,
                checkInTime: booking.checkInTime.toLocaleString('en-IN')
            }
        });
    } catch (err) {
        console.error('[validateBookingQR] Error:', err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};