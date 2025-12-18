// server/controllers/showtimeController.js
// Purpose: Contains logic for handling showtime-related API requests.

const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Venue = require('../models/Venue');
const Event = require('../models/Event');
const mongoose = require('mongoose');
const dayjs = require('dayjs');

// Helper: Check if user can manage venue
const checkVenueAccess = async (venueId, userId, userRole, session) => {
    const venueQuery = Venue.findById(venueId);
    if (session) venueQuery.session(session);
    const venue = await venueQuery;

    if (!venue) return { authorized: false, error: 'Venue not found for access check.', status: 404 };
    if (userRole === 'admin' || venue.organizer.toString() === userId) {
        return { authorized: true, venue };
    }
    return { authorized: false, error: 'User not authorized to manage this venue.', status: 403 };
};

// @desc    Get showtimes (filtered by movie, venue, date, etc.)
// @route   GET /api/showtimes
// @access  Public
exports.getShowtimes = async (req, res) => {
    const { movieId, eventId, venueId, date, sort } = req.query;
    const query = { isActive: true };

    if (movieId) query.movie = movieId;
    if (eventId) query.event = eventId;
    if (venueId) query.venue = venueId;

    if (date) {
        try {
            const startDate = dayjs(date).startOf('day').toDate();
            const endDate = dayjs(date).endOf('day').toDate();
            query.startTime = { $gte: startDate, $lt: endDate };
        } catch (e) { console.warn("Invalid date format for showtime filter:", date); }
    } else {
        query.startTime = { $gte: new Date() };
    }

    let sortOptions = { startTime: 1 };
    // Add other sort options if needed
    if (sort === 'startTime_asc') sortOptions = { startTime: 1 };

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit;

    try {
        const total = await Showtime.countDocuments(query);
        const showtimes = await Showtime.find(query)
            .populate('movie', 'title posterUrl')
            .populate('event', 'title imageUrl')
            .populate('venue', 'name address.city')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit)
            .lean();

        const pagination = {};
        if ((startIndex + limit) < total) pagination.next = { page: page + 1, limit };
        if (startIndex > 0) pagination.prev = { page: page - 1, limit };

        res.status(200).json({ success: true, count: showtimes.length, total, pagination, data: showtimes });
    } catch (err) {
        console.error('Error fetching showtimes:', err);
        res.status(500).json({ msg: 'Server error fetching showtimes' });
    }
};

// @desc    Get a single showtime by ID
// @route   GET /api/showtimes/:id
// @access  Public
exports.getShowtimeById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ msg: 'Showtime not found (Invalid ID)' });
        }
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie')
            .populate('event')
            .populate({
                path: 'venue',
                select: 'name address screens',
            });
        if (!showtime) return res.status(404).json({ msg: 'Showtime not found' });
        res.status(200).json(showtime);
    } catch (err) {
        console.error('Error fetching showtime by ID:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get seat map for a specific showtime
// @route   GET /api/showtimes/:id/seatmap
// @access  Public
exports.getShowtimeSeatmap = async (req, res) => {
    const { id: showtimeId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
            return res.status(404).json({ msg: 'Showtime not found (Invalid ID)' });
        }
        const showtime = await Showtime.findById(showtimeId).select('venue screenId bookedSeats isActive');
        if (!showtime || !showtime.isActive) {
            return res.status(404).json({ msg: 'Showtime not found or is inactive' });
        }
        const venue = await Venue.findById(showtime.venue).select('screens name');
        if (!venue) {
            return res.status(404).json({ msg: 'Associated venue not found' });
        }
        const screen = venue.screens.id(showtime.screenId);
        if (!screen || !screen.seatLayout || !Array.isArray(screen.seatLayout.rows)) {
            return res.status(404).json({ msg: 'Screen layout not found for this showtime' });
        }

        const seatMap = {
            showtimeId: showtime._id,
            screenName: screen.name,
            layout: {
                rows: screen.seatLayout.rows.map(row => ({
                    rowId: row.rowId,
                    seats: row.seats.map(seat => {
                        const identifier = `${row.rowId}${seat.seatNumber}`;
                        return {
                            ...seat.toObject(),
                            identifier,
                            isBooked: showtime.bookedSeats.includes(identifier),
                        };
                    }),
                })),
            },
        };
        res.status(200).json(seatMap);
    } catch (err) {
        console.error('Error fetching seatmap:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Create a new showtime
// @route   POST /api/showtimes
// @access  Private (Admin or Organizer)
exports.createShowtime = async (req, res) => {
    const { venue: venueId, screenId, startTime, priceTiers, movie: movieId, event: eventId, isActive } = req.body;
    const { id: userId, role: userRole } = req.user;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const access = await checkVenueAccess(venueId, userId, userRole, session);
        if (!access.authorized) {
            await session.abortTransaction();
            return res.status(access.status).json({ msg: access.error });
        }
        const targetVenue = access.venue;
        const targetScreen = targetVenue.screens.id(screenId);
        if (!targetScreen) {
            await session.abortTransaction();
            return res.status(404).json({ msg: 'Screen not found in the specified venue.' });
        }

        let endTime;
        const parsedStartTime = dayjs(startTime).toDate();
        const bufferMs = 15 * 60 * 1000;

        if (movieId) {
            const movie = await Movie.findById(movieId).select('duration').session(session);
            if (!movie || !movie.duration) {
                await session.abortTransaction();
                return res.status(400).json({ msg: 'Movie not found or has an invalid duration.' });
            }
            endTime = new Date(parsedStartTime.getTime() + (movie.duration * 60000) + bufferMs);
        } else if (eventId) {
            const event = await Event.findById(eventId).select('endDate').session(session);
            if (!event) {
                await session.abortTransaction();
                return res.status(404).json({ msg: 'Event not found.' });
            }
            endTime = event.endDate || new Date(parsedStartTime.getTime() + (120 * 60000) + bufferMs); // Default 2 hours if no event end date
        }

        const newShowtimeData = { venue: venueId, screenId, screenName: targetScreen.name, startTime: parsedStartTime, endTime, totalSeats: targetScreen.capacity, priceTiers, movie: movieId || undefined, event: eventId || undefined, isActive };
        const overlap = await Showtime.findOne({ venue: venueId, screenId, startTime: { $lt: endTime }, endTime: { $gt: parsedStartTime } }).session(session);
        if (overlap) {
            await session.abortTransaction();
            return res.status(409).json({ msg: 'Showtime overlaps with an existing showtime on this screen.' });
        }

        const [newShowtime] = await Showtime.create([newShowtimeData], { session });
        await session.commitTransaction();
        res.status(201).json(newShowtime);
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('Error creating showtime:', err.message);
        res.status(500).json({ msg: 'Server error' });
    } finally {
        session.endSession();
    }
};

// @desc    Update a showtime
// @route   PUT /api/showtimes/:id
// @access  Private (Admin or Organizer)
exports.updateShowtime = async (req, res) => {
    const { priceTiers, isActive } = req.body;
    const { id: showtimeId } = req.params;
    const { id: userId, role: userRole } = req.user;
    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ msg: 'Showtime not found.' });

        const access = await checkVenueAccess(showtime.venue, userId, userRole);
        if (!access.authorized) return res.status(access.status).json({ msg: access.error });

        if (priceTiers) showtime.priceTiers = priceTiers;
        if (typeof isActive === 'boolean') showtime.isActive = isActive;

        await showtime.save();
        res.status(200).json(showtime);
    } catch (err) {
        console.error('Error updating showtime:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Delete a showtime (soft delete)
// @route   DELETE /api/showtimes/:id
// @access  Private (Admin or Organizer)
exports.deleteShowtime = async (req, res) => {
    const { id: showtimeId } = req.params;
    const { id: userId, role: userRole } = req.user;
    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ msg: 'Showtime not found.' });

        const access = await checkVenueAccess(showtime.venue, userId, userRole);
        if (!access.authorized) return res.status(access.status).json({ msg: access.error });

        if (showtime.bookedSeats && showtime.bookedSeats.length > 0) {
            return res.status(400).json({ msg: 'Cannot delete showtime with existing bookings. Please deactivate it instead.' });
        }

        // Soft delete by deactivating
        showtime.isActive = false;
        await showtime.save();
        res.status(200).json({ success: true, msg: 'Showtime has been deactivated.' });
    } catch (err) {
        console.error('Error deleting showtime:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};