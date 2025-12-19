// server/controllers/bookingController.js
// Purpose: Handles booking creation, cancellation, and retrieval.

const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

// Safe alphabet for IDs (no 0/O, 1/I)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateBookingRefId = customAlphabet(ALPHABET, 6);

// Helper: Unique ID generation
async function generateUniqueBookingRefId(session) {
    let id;
    let attempts = 0;
    while (attempts < 5) {
        const potential = generateBookingRefId();
        const existing = await Booking.findOne({ bookingRefId: potential }).session(session);
        if (!existing) {
            id = potential;
            break;
        }
        attempts++;
    }
    if (!id) throw new Error('Failed to generate unique Booking ID');
    return id;
}

// --- Create Booking ---
exports.createBooking = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { showtimeId, seats, promoCode: promoCodeString } = req.body;
    const userId = req.user._id; // User attached by authMiddleware

    if (!seats || seats.length === 0) {
        return res.status(400).json({ errors: [{ msg: 'Select at least one seat.' }] });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // 1. Fetch Showtime with lock logic implied by findOneAndUpdate later
        const showtime = await Showtime.findById(showtimeId)
            .populate('venue movie event')
            .session(session);
            
        if (!showtime || !showtime.isActive) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Showtime not available.' });
        }

        // 2. Atomic Seat Locking
        // We attempt to add seats to 'bookedSeats' ONLY IF they aren't already there.
        const updatedShowtime = await Showtime.findOneAndUpdate(
            { 
                _id: showtimeId, 
                bookedSeats: { $not: { $elemMatch: { $in: seats } } } 
            },
            { $addToSet: { bookedSeats: { $each: seats } } },
            { new: true, session }
        );

        if (!updatedShowtime) {
            await session.abortTransaction();
            return res.status(409).json({ msg: 'One or more seats are already booked.' });
        }

        // 3. Calculate Pricing
        const screen = showtime.venue.screens.id(showtime.screenId);
        // Map "Row+Num" -> "Type" (e.g. "A1" -> "VIP")
        const seatTypeMap = new Map();
        screen.seatLayout.rows.forEach(row => {
            row.seats.forEach(seat => {
                seatTypeMap.set(`${row.rowId}${seat.seatNumber}`, seat.type);
            });
        });

        const priceMap = new Map(showtime.priceTiers.map(t => [t.seatType, t.price]));
        
        let originalAmount = 0;
        seats.forEach(seatId => {
            const type = seatTypeMap.get(seatId) || 'Normal';
            const price = priceMap.get(type) || 0;
            originalAmount += price;
        });

        // 4. Handle Promo Code
        let finalAmount = originalAmount;
        let discountAmount = 0;
        let appliedPromo = null;

        if (promoCodeString) {
            const code = await PromoCode.findOne({ 
                code: promoCodeString.toUpperCase(), 
                isActive: true 
            }).session(session);

            if (code) {
                if (code.isValid() && originalAmount >= code.minPurchaseAmount) {
                    discountAmount = code.calculateDiscount(originalAmount);
                    finalAmount = Math.max(0, originalAmount - discountAmount);
                    appliedPromo = code._id;
                    await PromoCode.findByIdAndUpdate(code._id, { $inc: { uses: 1 } }).session(session);
                } else {
                    await session.abortTransaction();
                    return res.status(400).json({ msg: `Promo code requirements not met (Min: ${code.minPurchaseAmount})` });
                }
            } else {
                await session.abortTransaction();
                return res.status(400).json({ msg: 'Invalid or expired promo code.' });
            }
        }

        const bookingRefId = await generateUniqueBookingRefId(session);

        // 5. Create Booking
        const newBooking = new Booking({
            bookingRefId,
            user: userId,
            showtime: showtimeId,
            seats,
            originalAmount,
            totalAmount: finalAmount,
            discountAmount,
            promoCodeApplied: appliedPromo,
            status: 'PaymentPending',
            // Simple QR data: Ref ID is usually sufficient for lookup
            qrCodeData: JSON.stringify({ bookingRefId, seats, showtimeId }) 
        });

        await newBooking.save({ session });
        await session.commitTransaction();

        res.status(201).json(newBooking);

    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('Create Booking Error:', err);
        res.status(500).json({ msg: 'Booking failed due to server error.' });
    } finally {
        session.endSession();
    }
};

// --- Get My Bookings ---
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'showtime',
                select: 'startTime screenName',
                populate: [
                    { path: 'movie', select: 'title posterUrl duration' },
                    { path: 'venue', select: 'name address' },
                    { path: 'event', select: 'title imageUrl' } // Handle events too
                ]
            })
            .sort({ bookingTime: -1 });
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- Get Booking By ID ---
exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = mongoose.Types.ObjectId.isValid(id) 
            ? { _id: id } 
            : { bookingRefId: id.toUpperCase() };

        const booking = await Booking.findOne(query)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl' },
                    { path: 'venue', select: 'name address facilities' },
                    { path: 'event' }
                ]
            });

        if (!booking) return res.status(404).json({ msg: 'Booking not found' });

        // Access Control
        const isOwner = booking.user._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ msg: 'Not authorized.' });
        }

        res.status(200).json(booking);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- Cancel Booking (User) ---
exports.cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const booking = await Booking.findById(req.params.id).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Booking not found' });
        }
        if (booking.user.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ msg: 'Not authorized' });
        }
        if (['Cancelled', 'CheckedIn'].includes(booking.status)) {
            await session.abortTransaction();
            return res.status(400).json({ msg: 'Cannot cancel this booking.' });
        }

        // Fetch showtime to check time limits
        const showtime = await Showtime.findById(booking.showtime).session(session);
        const hoursLeft = (new Date(showtime.startTime) - new Date()) / (1000 * 60 * 60);

        if (hoursLeft < 2) { // Example: 2 hour cancellation policy
            await session.abortTransaction();
            return res.status(400).json({ msg: 'Cancellation not allowed within 2 hours of showtime.' });
        }

        // Release seats
        await Showtime.findByIdAndUpdate(
            booking.showtime,
            { $pullAll: { bookedSeats: booking.seats } },
            { session }
        );

        booking.status = 'Cancelled';
        await booking.save({ session });
        await session.commitTransaction();

        res.status(200).json({ msg: 'Booking cancelled successfully.' });

    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        res.status(500).json({ msg: 'Server error' });
    } finally {
        session.endSession();
    }
};

// --- Validate QR (Organizer/Admin) ---
exports.validateBookingQR = async (req, res) => {
    const { qrCodeData } = req.body;
    
    try {
        const details = JSON.parse(qrCodeData);
        if (!details.bookingRefId) throw new Error('Invalid QR Data');

        const booking = await Booking.findOne({ bookingRefId: details.bookingRefId })
            .populate({ path: 'showtime', populate: { path: 'venue' } });

        if (!booking) return res.status(404).json({ msg: 'Booking not found.' });

        // Authorization: Admin OR Organizer of THAT venue
        const isOrganizer = req.user.role === 'organizer' && 
                            booking.showtime.venue.organizer.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOrganizer && !isAdmin) {
            return res.status(403).json({ msg: 'Not authorized to scan this ticket.' });
        }

        if (booking.status === 'CheckedIn') {
            return res.status(409).json({ 
                msg: `Already Checked In`, 
                time: booking.checkInTime 
            });
        }

        if (booking.status !== 'Confirmed') {
            return res.status(400).json({ msg: 'Ticket not confirmed/paid.' });
        }

        booking.status = 'CheckedIn';
        booking.isCheckedIn = true;
        booking.checkInTime = Date.now();
        booking.checkedInBy = req.user._id;
        await booking.save();

        res.status(200).json({ success: true, msg: 'Check-in Successful', booking });

    } catch (err) {
        console.error(err);
        res.status(400).json({ msg: 'Invalid QR Code' });
    }
};