// server/controllers/bookingController.js
// Purpose: Contains logic for handling booking-related API requests.

const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const Venue = require('../models/Venue');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

// Using a more standard alphabet without easily confused characters
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
 * @route POST /api/bookings
 * @access Private
 */
exports.createBooking = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { showtimeId, seats, promoCode: promoCodeString } = req.body;
    const userId = req.user.id;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ errors: [{ msg: 'Please select at least one seat.' }] });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const showtime = await Showtime.findById(showtimeId)
            .populate('venue movie event')
            .session(session);
            
        if (!showtime || !showtime.isActive || !showtime.priceTiers) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Showtime not found or is invalid.' });
        }
        
        const user = await User.findById(userId).session(session);
        if(!user) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Lock Seats
        const updatedShowtime = await Showtime.findOneAndUpdate(
            { _id: showtimeId, bookedSeats: { $not: { $elemMatch: { $in: seats } } } },
            { $addToSet: { bookedSeats: { $each: seats } } },
            { new: true, session }
        );

        if (!updatedShowtime) {
            await session.abortTransaction();
            return res.status(409).json({ msg: 'One or more selected seats are already booked.' });
        }

        // Calculate Price
        const screenForLayout = showtime.venue.screens.id(showtime.screenId);
        // Fallback for seatMap if screen layout is missing/changed
        let seatTypeMap = new Map();
        if (screenForLayout && screenForLayout.seatLayout) {
             seatTypeMap = new Map(screenForLayout.seatLayout.rows.flatMap(r => 
                r.seats.map(s => [`${r.rowId}${s.seatNumber}`, s.type || 'Normal'])
            ));
        }

        const priceMap = new Map(showtime.priceTiers.map(t => [t.seatType, t.price]));
        const defaultPrice = priceMap.get('Normal') || 0;
        
        let originalAmount = seats.reduce((total, seatId) => {
            const type = seatTypeMap.get(seatId) || 'Normal';
            return total + (priceMap.get(type) ?? defaultPrice);
        }, 0);

        // Apply Promo Code
        let finalAmount = originalAmount;
        let discountAmount = 0;
        let appliedPromoCodeDoc = null;

        if (promoCodeString) {
            const promoCodeDoc = await PromoCode.findOne({ 
                code: promoCodeString.trim().toUpperCase(), 
                isActive: true 
            }).session(session);

            if (promoCodeDoc && promoCodeDoc.isValid() && originalAmount >= promoCodeDoc.minPurchaseAmount) {
                discountAmount = promoCodeDoc.calculateDiscount(originalAmount);
                finalAmount = originalAmount - discountAmount;
                appliedPromoCodeDoc = promoCodeDoc;
                // Increment use count
                await PromoCode.updateOne({ _id: promoCodeDoc._id }, { $inc: { uses: 1 } }, { session });
            } else if (promoCodeDoc) {
                await session.abortTransaction();
                return res.status(400).json({ errors: [{ msg: `Minimum purchase of Rs. ${promoCodeDoc.minPurchaseAmount} not met.` }] });
            } else {
                await session.abortTransaction();
                return res.status(400).json({ errors: [{ msg: 'Invalid or expired promo code.' }] });
            }
        }

        const bookingRefId = await generateUniqueBookingRefId(session);
        
        const qrCodeDetails = {
            bookingRefId,
            userName: user.name,
            userEmail: user.email,
            itemTitle: showtime.movie?.title || showtime.event?.title,
            venueName: showtime.venue.name,
            showtime: showtime.startTime,
            seats,
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

        await newBooking.save({ session });
        await session.commitTransaction();
        
        res.status(201).json(newBooking);

    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        if (err.code === 112) {
            return res.status(409).json({ msg: 'Seats booked by another user. Try again.' });
        }
        console.error('[createBooking] Error:', err);
        res.status(500).json({ msg: 'Server error during booking.' });
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
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl duration releaseDate' },
                    { path: 'venue', select: 'name address' },
                    { path: 'event', select: 'title imageUrl' }
                ],
                select: 'startTime screenName'
            })
            .sort({ bookingTime: -1 });
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * Get a specific booking by ID
 * @route GET /api/bookings/:id
 * @access Private
 */
exports.getBookingById = async (req, res) => {
    const bookingIdentifier = req.params.id;
    try {
        const query = mongoose.Types.ObjectId.isValid(bookingIdentifier)
            ? { $or: [{ _id: bookingIdentifier }, { bookingRefId: bookingIdentifier.toUpperCase() }] }
            : { bookingRefId: bookingIdentifier.toUpperCase() };
        
        const booking = await Booking.findOne(query)
             .select('+qrCodeData')
             .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl duration' },
                    { path: 'venue', select: 'name address facilities' },
                    { path: 'event' }
                ]
            }).populate('user', 'name email');

        if (!booking) return res.status(404).json({ msg: 'Booking not found' });

        // Auth Check
        if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
             return res.status(403).json({ msg: 'Not authorized' });
        }
        res.status(200).json(booking);
    } catch (err) {
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
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const booking = await Booking.findById(bookingId).session(session);
        
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user.id) {
            await session.abortTransaction();
            return res.status(403).json({ msg: 'Not authorized' });
        }

        if (['Cancelled', 'CheckedIn'].includes(booking.status)) {
            await session.abortTransaction();
            return res.status(400).json({ msg: `Cannot cancel ${booking.status} booking.` });
        }

        const showtime = await Showtime.findById(booking.showtime).session(session);
        // Time check (2 hours)
        if (showtime && (new Date(showtime.startTime).getTime() - Date.now() < 2 * 60 * 60 * 1000)) {
            await session.abortTransaction();
            return res.status(400).json({ msg: 'Cannot cancel within 2 hours of showtime.' });
        }

        booking.status = 'Cancelled';
        await booking.save({ session });

        await Showtime.findByIdAndUpdate(
            booking.showtime,
            { $pullAll: { bookedSeats: booking.seats } },
            { session }
        );

        await session.commitTransaction();
        res.status(200).json({ success: true, msg: 'Booking cancelled', booking });
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        res.status(500).json({ msg: 'Server error' });
    } finally {
        session.endSession();
    }
};

/**
 * Cancel a pending booking (e.g. closed payment modal)
 * @route PUT /api/bookings/:id/cancel-pending
 * @access Private
 */
exports.cancelPendingBooking = async (req, res) => {
    const bookingId = req.params.id;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        
        const booking = await Booking.findOne({ _id: bookingId, user: req.user.id }).session(session);
        
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Pending booking not found.' });
        }
        if (booking.status !== 'PaymentPending') {
            await session.abortTransaction();
            return res.status(400).json({ msg: 'Booking is not pending.' });
        }

        // Release seats
        await Showtime.updateOne(
            { _id: booking.showtime },
            { $pullAll: { bookedSeats: booking.seats } },
            { session }
        );

        booking.status = 'PaymentFailed';
        await booking.save({ session });
        
        await session.commitTransaction();
        res.status(200).json({ success: true, msg: 'Booking cancelled' });
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('Cancel Pending Error:', err);
        res.status(500).json({ msg: 'Server error' });
    } finally {
        session.endSession();
    }
};


/**
 * Validate QR Code (Admin/Organizer)
 * @route POST /api/scan/validate
 * @access Private
 */
exports.validateBookingQR = async (req, res) => {
    const { qrCodeData } = req.body;
    
    let details;
    try {
        details = JSON.parse(qrCodeData);
    } catch (e) {
        return res.status(400).json({ msg: 'Invalid QR Format' });
    }

    if (!details.bookingRefId) return res.status(400).json({ msg: 'Invalid QR Data' });

    try {
        const booking = await Booking.findOne({ bookingRefId: details.bookingRefId.toUpperCase() })
            .populate({ path: 'showtime', populate: { path: 'venue' } });

        if (!booking) return res.status(404).json({ msg: 'Booking not found' });
        
        // Authorization
        const isOrganizer = req.user.role === 'organizer' && 
                            booking.showtime?.venue?.organizer?.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOrganizer && !isAdmin) {
            return res.status(403).json({ msg: 'Not authorized for this venue.' });
        }

        if (booking.status === 'CheckedIn') {
            return res.status(409).json({ msg: `Already Checked In at ${booking.checkInTime?.toLocaleString()}` });
        }
        if (booking.status !== 'Confirmed') {
            return res.status(400).json({ msg: 'Ticket not confirmed.' });
        }
        
        booking.isCheckedIn = true;
        booking.checkInTime = new Date();
        booking.checkedInBy = req.user.id;
        booking.status = 'CheckedIn';
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Check-in Successful!',
            bookingDetails: {
                ...details,
                checkInTime: booking.checkInTime.toLocaleString()
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};