// server/controllers/bookingController.js
// Purpose: Contains logic for handling booking-related API requests.

const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const Venue = require('../models/Venue');
const Setting = require('../models/Setting');
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

        // Calculate total amount based on seat types and tiered pricing
        let calculatedOriginalAmount = 0;
        const screenForLayout = showtime.venue.screens.id(showtime.screenId);
        if (!screenForLayout || !screenForLayout.seatLayout || !screenForLayout.seatLayout.rows) {
            await session.abortTransaction();
            return res.status(500).json({ msg: 'Screen layout not found for price calculation.' });
        }

        for (const seatIdentifier of seats) {
            let seatType = 'Normal';
            let foundSeatInLayout = false;
            for (const row of screenForLayout.seatLayout.rows) {
                const seatInRow = row.seats.find(s => `${row.rowId}${s.seatNumber}` === seatIdentifier);
                if (seatInRow) {
                    seatType = seatInRow.type || 'Normal';
                    foundSeatInLayout = true;
                    break;
                }
            }

            if (!foundSeatInLayout) {
                await session.abortTransaction();
                return res.status(400).json({ msg: `Seat ${seatIdentifier} could not be found in the screen layout.` });
            }

            const priceTier = showtime.priceTiers.find(pt => pt.seatType === seatType);
            if (!priceTier || typeof priceTier.price !== 'number') {
                await session.abortTransaction();
                return res.status(400).json({ msg: `Price for seat type '${seatType}' is not configured for this showtime.` });
            }
            calculatedOriginalAmount += priceTier.price;
        }
        console.log(`[createBooking] Calculated Original Amount (pre-discount/pre-GST): ${calculatedOriginalAmount}`);

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
        
        let gstRate = 0;
        const gstSetting = await Setting.findOne({ name: 'GST_RATE' }).session(session);
        if (gstSetting && typeof gstSetting.value === 'number' && gstSetting.value >= 0) {
            gstRate = gstSetting.value;
        } else {
            console.warn('[createBooking] GST_RATE setting not found or invalid, defaulting to 0%.');
        }

        const gstAmount = parseFloat(((finalAmount * gstRate) / 100).toFixed(2));
        finalAmount = parseFloat((finalAmount + gstAmount).toFixed(2));

        console.log(`[createBooking] Discount Amount: ${discountAmount}, GST Rate: ${gstRate}%, GST Amount: ${gstAmount}, Final Amount (with GST): ${finalAmount}`);


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
            gstAmount: gstAmount,
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
            const message = `<h2>Booking Confirmed!</h2><p>Hi ${user.name},</p><p>Details:</p><ul><li>Booking ID: ${confirmedBookingForEmail.bookingRefId}</li><li>Movie: ${show.movie?.title || show.event?.title}</li><li>Venue: ${show.venue.name} (${show.venue.address.city})</li><li>Screen: ${show.screenName}</li><li>Date & Time: ${new Date(show.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li><li>Seats: ${confirmedBookingForEmail.seats.join(', ')}</li><li>Amount Paid: Rs. ${confirmedBookingForEmail.totalAmount.toFixed(2)} ${confirmedBookingForEmail.discountAmount > 0 ? `(after Rs. ${confirmedBookingForEmail.discountAmount.toFixed(2)} discount)` : ''} (Includes Rs. ${confirmedBookingForEmail.gstAmount.toFixed(2)} GST)</li></ul>`;
            sendEmail({ to: user.email, subject: subject, html: message }).catch(emailError => {
                console.error(`[createBooking] Failed to send confirmation email for booking ${booking.bookingRefId}:`, emailError);
            });
        }
        
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

        if (mongoose.Types.ObjectId.isValid(bookingIdentifier)) {
            query = { $or: [{ _id: bookingIdentifier }, { bookingRefId: bookingIdentifier.toUpperCase() }] };
        } else {
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
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ msg: 'Booking not found' });
        }
        if (booking.user.toString() !== userId) {
            await session.abortTransaction(); session.endSession();
            return res.status(403).json({ msg: 'User not authorized to cancel this booking' });
        }
        if (booking.status === 'Cancelled' || booking.status === 'CheckedIn') {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: `Booking is already ${booking.status}` });
        }
        const showtime = await Showtime.findById(booking.showtime).session(session);
        if (new Date(showtime.startTime).getTime() - Date.now() < (2 * 60 * 60 * 1000)) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: 'Cannot cancel booking close to showtime' });
        }
        booking.status = 'Cancelled';
        await booking.save({ session: session });
        await Showtime.findByIdAndUpdate(
            booking.showtime,
            { $pull: { bookedSeats: { $in: booking.seats } } },
            { new: true, session: session }
        );
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ msg: 'Booking cancelled successfully', booking });
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
                showtime: dayjs(booking.showtime.startTime).format('DD MMM useSelector, h:mm A'),
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