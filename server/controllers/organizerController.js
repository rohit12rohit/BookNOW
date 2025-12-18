// server/controllers/organizerController.js
// Purpose: Contains logic for API endpoints specific to the logged-in organizer.

const Venue = require('../models/Venue');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const User = require('../models/User');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const { validationResult } = require('express-validator');


// @desc    Get dashboard stats for the logged-in organizer
// @route   GET /api/organizer/dashboard
// @access  Private (Approved Organizer Only)
exports.getOrganizerDashboardStats = async (req, res) => {
    const organizerId = req.user.id;
    try {
        const venueCount = await Venue.countDocuments({ organizer: organizerId, isActive: true });

        // Count upcoming showtimes for their venues
        const upcomingShowtimeCount = await Showtime.countDocuments({
            venue: { $in: await Venue.find({ organizer: organizerId }).distinct('_id') }, // Find venues managed by organizer
            startTime: { $gte: new Date() }, // Starting from now
            isActive: true
        });

        // Count total active showtimes
         const totalActiveShowtimeCount = await Showtime.countDocuments({
            venue: { $in: await Venue.find({ organizer: organizerId }).distinct('_id') },
            isActive: true
        });

        // Count recent bookings (e.g., last 7 days) for their venues/showtimes
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentBookingCount = await Booking.countDocuments({
            showtime: { $in: await Showtime.find({ venue: { $in: await Venue.find({ organizer: organizerId }).distinct('_id') }}).distinct('_id')},
            bookingTime: { $gte: sevenDaysAgo },
            status: 'Confirmed' // Count only confirmed bookings
        });


        res.status(200).json({
            managedVenues: venueCount,
            upcomingShowtimes: upcomingShowtimeCount,
            totalActiveShowtimes: totalActiveShowtimeCount,
            recentBookings: recentBookingCount,
        });

    } catch (err) {
        console.error('Error fetching organizer dashboard stats:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Get all venues managed by the logged-in organizer
// @route   GET /api/organizer/venues
// @access  Private (Approved Organizer Only)
exports.getMyVenues = async (req, res) => {
    const organizerId = req.user.id;
    try {
        const venues = await Venue.find({ organizer: organizerId }) // No need for isActive check here, show all owned
            .sort({ name: 1 });
        res.status(200).json(venues);
    } catch (err) {
        console.error('Error fetching organizer venues:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Get showtimes for venues managed by the logged-in organizer (with filtering)
// @route   GET /api/organizer/showtimes
// @access  Private (Approved Organizer Only)
exports.getMyShowtimes = async (req, res) => {
    const organizerId = req.user.id;
    const { venueId, movieId, date, status } = req.query; // Allow filtering

    try {
        // 1. Get IDs of venues managed by this organizer
        const managedVenueIds = await Venue.find({ organizer: organizerId }).distinct('_id');
        if (managedVenueIds.length === 0) {
             return res.status(200).json([]); // No venues, so no showtimes
        }

        // 2. Build query based on managed venues and filters
        const query = { venue: { $in: managedVenueIds } };

        if (venueId) { // Filter by a specific venue (must be one they manage)
             if (!managedVenueIds.some(id => id.equals(venueId))) {
                  return res.status(403).json({ msg: 'Access denied to this venue\'s showtimes' });
             }
             if (!mongoose.Types.ObjectId.isValid(venueId)) return res.status(400).json({ msg: 'Invalid Venue ID' });
            query.venue = venueId;
        }
        if (movieId) {
             if (!mongoose.Types.ObjectId.isValid(movieId)) return res.status(400).json({ msg: 'Invalid Movie ID' });
            query.movie = movieId;
        }
         if (date) {
            try {
                const startDate = new Date(`${date}T00:00:00.000Z`);
                const endDate = new Date(startDate);
                endDate.setUTCDate(startDate.getUTCDate() + 1);
                query.startTime = { $gte: startDate, $lt: endDate };
            } catch (e) { return res.status(400).json({ msg: 'Invalid date format (YYYY-MM-DD)'}); }
        }
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        // Default: show all (active/inactive) if status not specified, or add default like future shows only?

        // 3. Fetch showtimes
        const showtimes = await Showtime.find(query)
            .populate('movie', 'title')
            .populate('venue', 'name')
            .sort({ startTime: -1 }); // Sort by most recent start time

        res.status(200).json(showtimes);

    } catch (err) {
        console.error('Error fetching organizer showtimes:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Get bookings for showtimes at venues managed by the logged-in organizer
// @route   GET /api/organizer/bookings
// @access  Private (Approved Organizer Only)
exports.getMyVenueBookings = async (req, res) => {
     const organizerId = req.user.id;
     const { showtimeId, date, status } = req.query; // Allow filtering

     try {
        // 1. Find showtime IDs linked to the organizer's venues
        const managedVenueIds = await Venue.find({ organizer: organizerId }).distinct('_id');
         if (managedVenueIds.length === 0) return res.status(200).json([]);

        const showtimeQuery = { venue: { $in: managedVenueIds } };
        if (showtimeId) { // Filter by specific showtime (must be one they manage)
            if (!mongoose.Types.ObjectId.isValid(showtimeId)) return res.status(400).json({ msg: 'Invalid Showtime ID' });
            const st = await Showtime.findById(showtimeId).select('venue');
            if (!st || !managedVenueIds.some(id => id.equals(st.venue))) {
                 return res.status(403).json({ msg: 'Access denied to this showtime\'s bookings' });
            }
            showtimeQuery._id = showtimeId;
        }
        // Add date filtering based on showtime's startTime if needed

        const relevantShowtimeIds = await Showtime.find(showtimeQuery).distinct('_id');
        if (relevantShowtimeIds.length === 0) return res.status(200).json([]);


        // 2. Build booking query based on relevant showtimes and filters
        const bookingQuery = { showtime: { $in: relevantShowtimeIds } };

        if (status && ['Pending', 'Confirmed', 'Cancelled', 'CheckedIn'].includes(status)) {
            bookingQuery.status = status;
        }
        // Add date filtering based on bookingTime if needed
         if (date) {
            try {
                const startDate = new Date(`${date}T00:00:00.000Z`);
                const endDate = new Date(startDate);
                endDate.setUTCDate(startDate.getUTCDate() + 1);
                bookingQuery.bookingTime = { $gte: startDate, $lt: endDate };
            } catch (e) { return res.status(400).json({ msg: 'Invalid date format (YYYY-MM-DD)'}); }
        }


        // 3. Fetch bookings
        const bookings = await Booking.find(bookingQuery)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                select: 'startTime movie screenName venue',
                 populate: [
                    { path: 'movie', select: 'title'},
                    { path: 'venue', select: 'name'}
                 ]
            })
            .sort({ bookingTime: -1 });

        res.status(200).json(bookings);

    } catch (err) {
        console.error('Error fetching organizer venue bookings:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Update the logged-in organizer's profile details
// @route   PUT /api/organizer/profile
// @access  Private (Approved Organizer Only)
exports.updateMyProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const organizerId = req.user.id;
    const { name, organizationName } = req.body; // Fields organizer can change

    try {
        const updateFields = {};
        if (name) updateFields.name = name;
        if (organizationName) updateFields.organizationName = organizationName;
        // Do not allow changing email/role/approval status here

        if (Object.keys(updateFields).length === 0) {
             return res.status(400).json({ msg: 'No valid fields provided for update' });
        }

        const updatedOrganizer = await User.findByIdAndUpdate(
            organizerId,
            { $set: updateFields },
            { new: true, runValidators: true } // Return updated doc, run schema validation
        ).select('-password -managedVenues'); // Exclude sensitive/large fields


        if (!updatedOrganizer) {
            // Should not happen if middleware passed
            return res.status(404).json({ msg: 'Organizer not found' });
        }

        res.status(200).json({ msg: 'Profile updated successfully', organizer: updatedOrganizer });

    } catch (err) {
        console.error('Error updating organizer profile:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get events for the logged-in organizer
// @route   GET /api/organizer/events
// @access  Private (Approved Organizer Only)
exports.getMyEvents = async (req, res) => {
    const organizerId = req.user.id;
    try {
        const events = await Event.find({ organizer: organizerId }).sort({ startDate: -1 });
        res.status(200).json(events);
    } catch (err) {
        console.error('Error fetching organizer events:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};