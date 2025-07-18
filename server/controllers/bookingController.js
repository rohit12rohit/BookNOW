// File: /server/controllers/bookingController.js
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

/**
 * Creates a new booking with tiered pricing.
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
        console.log(`[createBooking] Transaction started for showtime ${showtimeId}`);

        const showtime = await Showtime.findById(showtimeId).populate('venue').session(session);

        if (!showtime) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Showtime not found.' });
        }
        if (!showtime.isActive) {
            await session.abortTransaction();
            return res.status(400).json({ msg: 'This showtime is no longer active.' });
        }
        if (!showtime.priceTiers || showtime.priceTiers.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ msg: 'Pricing information not available for this showtime.' });
        }
        if (!showtime.venue || !showtime.venue.screens) {
            await session.abortTransaction();
            return res.status(500).json({ msg: 'Venue or screen details are missing for the showtime.' });
        }

        // Atomically reserve seats
        const updatedShowtimeSeats = await Showtime.findOneAndUpdate(
            { _id: showtimeId, bookedSeats: { $not: { $elemMatch: { $in: seats } } } },
            { $addToSet: { bookedSeats: { $each: seats } } },
            { new: true, session: session }
        );

        if (!updatedShowtimeSeats) {
            await session.abortTransaction();
            const currentShowForError = await Showtime.findById(showtimeId).select('bookedSeats');
            const alreadyBookedForError = seats.filter(seat => currentShowForError?.bookedSeats.includes(seat));
            return res.status(409).json({ msg: `Seats [${alreadyBookedForError.join(', ')}] are already booked. Please select different seats.` });
        }
        console.log(`[createBooking] Seats [${seats.join(', ')}] successfully reserved.`);

        // --- OPTIMIZED PRICE CALCULATION ---
        const screenForLayout = showtime.venue.screens.id(showtime.screenId);
        if (!screenForLayout || !screenForLayout.seatLayout || !screenForLayout.seatLayout.rows) {
            await session.abortTransaction();
            return res.status(500).json({ msg: 'Screen layout not found for price calculation.' });
        }
        
        // Create a lookup map for seat types for efficient access
        const seatTypeMap = new Map();
        for (const row of screenForLayout.seatLayout.rows) {
            for (const seat of row.seats) {
                const seatIdentifier = `${row.rowId}${seat.seatNumber}`;
                seatTypeMap.set(seatIdentifier, seat.type || 'Normal');
            }
        }
        
        // Create a lookup map for prices
        const priceMap = new Map(showtime.priceTiers.map(tier => [tier.seatType, tier.price]));
        const defaultPrice = priceMap.get('Normal') || 0;

        let calculatedOriginalAmount = 0;
        for (const seatIdentifier of seats) {
            const seatType = seatTypeMap.get(seatIdentifier);
            if (!seatType) {
                 await session.abortTransaction();
                 return res.status(400).json({ msg: `Seat ${seatIdentifier} could not be found in the screen layout.` });
            }
            const price = priceMap.get(seatType) ?? defaultPrice;
            calculatedOriginalAmount += price;
        }
        // --- END OF OPTIMIZED CALCULATION ---
        console.log(`[createBooking] Calculated Original Amount: ${calculatedOriginalAmount}`);

        let finalAmount = calculatedOriginalAmount;
        let discountAmount = 0;
        let appliedPromoCodeDoc = null;

        if (promoCodeString) {
            const promoCodeDoc = await PromoCode.findOne({ code: promoCodeString.trim().toUpperCase(), isActive: true }).session(session);
            if (promoCodeDoc && promoCodeDoc.isValid()) {
                const calculatedDiscount = promoCodeDoc.calculateDiscount(calculatedOriginalAmount);
                if (calculatedDiscount > 0) {
                    discountAmount = calculatedDiscount;
                    finalAmount = calculatedOriginalAmount - discountAmount;
                    appliedPromoCodeDoc = promoCodeDoc;
                } else if (calculatedOriginalAmount < promoCodeDoc.minPurchaseAmount) {
                    await session.abortTransaction();
                    return res.status(400).json({ errors: [{ msg: `Minimum purchase amount of Rs. ${promoCodeDoc.minPurchaseAmount} not met for code ${promoCodeString}` }] });
                }
            } else if (promoCodeString) {
                await session.abortTransaction();
                return res.status(400).json({ errors: [{ msg: 'Invalid or expired promo code.' }] });
            }
        }
        finalAmount = Math.max(finalAmount, 0);

        // Generate a unique booking reference ID with a retry mechanism
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
            await session.abortTransaction();
            throw new Error('Failed to generate a unique booking reference ID.');
        }

        const newBooking = new Booking({
            bookingRefId: bookingRefIdGenerated,
            user: userId,
            showtime: showtimeId,
            seats: seats,
            originalAmount: calculatedOriginalAmount,
            totalAmount: finalAmount,
            discountAmount: discountAmount,
            promoCodeApplied: appliedPromoCodeDoc ? appliedPromoCodeDoc._id : null,
            status: 'Confirmed',
            paymentId: `SIM_PAY_${Date.now()}`,
        });

        const booking = await newBooking.save({ session: session });

        if (appliedPromoCodeDoc) {
            await PromoCode.updateOne(
                { _id: appliedPromoCodeDoc._id },
                { $inc: { uses: 1 } },
                { session: session }
            );
        }

        await session.commitTransaction();
        console.log(`[createBooking] Transaction committed for booking ${booking.bookingRefId}`);

        // Post-transaction tasks (e.g., sending email)
        const confirmedBookingForEmail = await Booking.findById(booking._id)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title' },
                    { path: 'event', select: 'title' },
                    { path: 'venue', select: 'name address' }
                ]
            });
        
        if (confirmedBookingForEmail?.user?.email) {
            const user = confirmedBookingForEmail.user;
            const show = confirmedBookingForEmail.showtime;
            const subject = `Your BookNOW Booking Confirmation (ID: ${confirmedBookingForEmail.bookingRefId})`;
            const message = `<h2>Booking Confirmed!</h2><p>Hi ${user.name},</p><p>Details:</p><ul><li>Booking ID: ${confirmedBookingForEmail.bookingRefId}</li><li>Movie: ${show.movie?.title || show.event?.title}</li><li>Venue: ${show.venue.name} (${show.venue.address.city})</li><li>Screen: ${show.screenName}</li><li>Date & Time: ${new Date(show.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li><li>Seats: ${confirmedBookingForEmail.seats.join(', ')}</li><li>Amount Paid: Rs. ${confirmedBookingForEmail.totalAmount.toFixed(2)} ${confirmedBookingForEmail.discountAmount > 0 ? `(after Rs. ${confirmedBookingForEmail.discountAmount.toFixed(2)} discount)` : ''}</li></ul>`;
            // Send email without waiting for it to finish
            sendEmail({ to: user.email, subject: subject, html: message }).catch(emailError => {
                console.error(`[createBooking] Failed to send confirmation email for booking ${booking.bookingRefId}:`, emailError);
            });
        }
        
        // Respond to the client
        const populatedApiResponse = await Booking.findById(booking._id)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                populate: [ 
                    { path: 'movie', select: 'title posterUrl' }, 
                    { path: 'event', select: 'title' },
                    { path: 'venue', select: 'name address' } 
                ]
            }).populate('promoCodeApplied', 'code');
            
        res.status(201).json(populatedApiResponse);

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
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
 * Get a specific booking by ID for the logged-in user
 * @route GET /api/bookings/:id
 * @access Private
 */
exports.getBookingById = async (req, res) => {
    const bookingIdentifier = req.params.id;
    const userId = req.user.id;

    try {
        let query;

        // Check if the identifier is a potential MongoDB ObjectId.
        if (mongoose.Types.ObjectId.isValid(bookingIdentifier)) {
            // If it could be an ObjectId, search by either _id or bookingRefId for flexibility
            query = { $or: [{ _id: bookingIdentifier }, { bookingRefId: bookingIdentifier.toUpperCase() }] };
        } else {
            // If it's not a valid ObjectId format, it must be a bookingRefId
            query = { bookingRefId: bookingIdentifier.toUpperCase() };
        }
        
        const booking = await Booking.findOne(query)
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

        // Authorization Check: Allow if the booking belongs to the logged-in user OR if the user is an admin
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
 * Cancel a booking
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
            session.endSession();
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Authorization: Ensure the person cancelling is the one who made the booking
        if (booking.user.toString() !== userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ msg: 'User not authorized to cancel this booking' });
        }

        // Business Logic: Check if the booking is in a cancellable state
        if (booking.status === 'Cancelled' || booking.status === 'CheckedIn') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ msg: `Booking is already ${booking.status} and cannot be cancelled.` });
        }

        const showtime = await Showtime.findById(booking.showtime).session(session);
        if (!showtime) {
            // This case indicates a data integrity issue, but we handle it gracefully
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ msg: 'Associated showtime not found.' });
        }
        
        // Business Logic: Prevent cancellation if the showtime is too soon (e.g., within 2 hours)
        const twoHoursInMillis = 2 * 60 * 60 * 1000;
        if (new Date(showtime.startTime).getTime() - Date.now() < twoHoursInMillis) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ msg: 'Cannot cancel booking this close to the showtime.' });
        }

        // Update the booking status
        booking.status = 'Cancelled';
        await booking.save({ session: session });

        // Release the seats by pulling them from the showtime's bookedSeats array
        await Showtime.findByIdAndUpdate(
            booking.showtime,
            { $pullAll: { bookedSeats: booking.seats } },
            { new: true, session: session }
        );

        // TODO: Handle promo code use count reversal if applicable in your business logic
        // if (booking.promoCodeApplied) { ... }

        await session.commitTransaction();
        session.endSession();

        // TODO: Trigger refund process if a real payment gateway was used

        res.status(200).json({ success: true, msg: 'Booking cancelled successfully', booking });

    } catch (err) {
        console.error('Error cancelling booking:', err.message);
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};

/**
 * Validate a booking via QR code scan data
 * @route POST /api/scan/validate
 * @access Private (Admin or Organizer)
 */
exports.validateBookingQR = async (req, res) => {
    const { bookingRefId } = req.body;
    const staffUserId = req.user.id;
    const staffUserRole = req.user.role;

    if (!bookingRefId || typeof bookingRefId !== 'string') {
        return res.status(400).json({ msg: 'Invalid Booking Reference ID format' });
    }
    
    try {
        const booking = await Booking.findOne({ bookingRefId: bookingRefId.toUpperCase() })
            .populate({ path: 'showtime', populate: { path: 'movie', select: 'title' } })
            .populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking reference not found' });
        }

        let isAuthorized = false;
        if (staffUserRole === 'admin') {
            isAuthorized = true;
        } else if (staffUserRole === 'organizer' && booking.showtime?.venue) {
            const venue = await Venue.findById(booking.showtime.venue).select('organizer');
            const organizer = await User.findById(staffUserId).select('isApproved');
            if (venue && organizer && venue.organizer.toString() === staffUserId && organizer.isApproved) {
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

        res.status(200).json({
            success: true,
            message: 'Check-in Successful!',
            bookingDetails: {
                bookingRefId: booking.bookingRefId,
                userName: booking.user.name,
                movieTitle: booking.showtime?.movie?.title || booking.showtime?.event?.title || 'N/A',
                showtime: dayjs(booking.showtime.startTime).format('DD MMM, h:mm A'),
                screenName: booking.showtime.screenName,
                seats: booking.seats,
                checkInTime: booking.checkInTime.toLocaleString('en-IN')
            }
        });
    } catch (err) {
        console.error('[validateBookingQR] Error:', err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};

/**
 * Creates a new booking with a 'PaymentPending' status.
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

        // 1. Fetch showtime and venue details
        const showtime = await Showtime.findById(showtimeId).populate('venue').session(session);
        if (!showtime || !showtime.isActive || !showtime.priceTiers || showtime.priceTiers.length === 0) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Showtime not found or is invalid.' });
        }

        // 2. Atomically check for and reserve seats
        const updatedShowtime = await Showtime.findOneAndUpdate(
            { _id: showtimeId, bookedSeats: { $not: { $elemMatch: { $in: seats } } } },
            { $addToSet: { bookedSeats: { $each: seats } } },
            { new: true, session: session }
        );
        if (!updatedShowtime) {
            await session.abortTransaction();
            return res.status(409).json({ msg: 'One or more selected seats are already booked. Please select different seats.' });
        }

        // 3. Calculate total amount based on seat types and tiered pricing
        // (Optimized price calculation logic remains the same)
        const screenForLayout = showtime.venue.screens.id(showtime.screenId);
        const seatTypeMap = new Map(screenForLayout.seatLayout.rows.flatMap(r => r.seats.map(s => [`${r.rowId}${s.seatNumber}`, s.type || 'Normal'])));
        const priceMap = new Map(showtime.priceTiers.map(t => [t.seatType, t.price]));
        const defaultPrice = priceMap.get('Normal') || 0;
        let originalAmount = seats.reduce((total, seatId) => total + (priceMap.get(seatTypeMap.get(seatId)) ?? defaultPrice), 0);

        // 4. Apply promo code if provided
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
            } else {
                await session.abortTransaction();
                return res.status(400).json({ errors: [{ msg: 'Invalid, expired, or inapplicable promo code.' }] });
            }
        }

        // 5. Generate unique booking reference ID
        const bookingRefId = await generateUniqueBookingRefId(session);

        // 6. Create the booking with 'PaymentPending' status
        const newBooking = new Booking({
            bookingRefId,
            user: userId,
            showtime: showtimeId,
            seats,
            originalAmount,
            totalAmount: Math.max(finalAmount, 0),
            discountAmount,
            promoCodeApplied: appliedPromoCodeDoc ? appliedPromoCodeDoc._id : null,
            status: 'PaymentPending' // Set initial status
        });

        const booking = await newBooking.save({ session: session });
        await session.commitTransaction();
        
        // 7. Respond with the pending booking details
        // The frontend will use this booking._id to create the payment order
        res.status(201).json(booking);

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('[createBooking] Error:', err);
        res.status(err.status || 500).json({ msg: err.message || 'Server error during booking.', errors: err.errors });
    } finally {
        session.endSession();
    }
};

// Helper to generate unique ID, since it's used in two places now
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
