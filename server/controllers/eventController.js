// server/controllers/eventController.js
// Purpose: Contains logic for handling event information API requests (CRUD).

const Event = require('../models/Event');
const Venue = require('../models/Venue');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User'); 

// --- Helper: Check if user can manage venue (if venue is linked) ---
const checkEventVenueAccess = async (venueId, userId, userRole) => {
    if (!venueId) return { authorized: true };
    if (!mongoose.Types.ObjectId.isValid(venueId)) return { authorized: false, error: 'Invalid Venue ID format', status: 400 };

    const venue = await Venue.findById(venueId);
    if (!venue) return { authorized: false, error: 'Linked venue not found', status: 404 };

    if (userRole === 'admin' || venue.organizer.toString() === userId) {
        return { authorized: true, venue };
    }
    return { authorized: false, error: 'User not authorized for the linked venue', status: 403 };
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


// @desc    Get all events (with filtering and sorting)
// @route   GET /api/events?city=Bhubaneswar&category=Music&status=upcoming&sort=startDate_asc&limit=10&page=1
// @access  Public
exports.getEvents = async (req, res) => {
    try {
        const query = {};
        const { category, city, date, tag, status, sort } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- Filtering ---
        if (status === 'upcoming' || !req.user) {
             query.status = { $in: ['Scheduled'] };
             query.startDate = { $gte: today };
        } else if (status === 'past') {
             query.startDate = { $lt: today };
        }

        if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        if (city) query['address.city'] = { $regex: new RegExp(city, 'i') };
        if (tag) query.tags = { $regex: new RegExp(`^${tag}$`, 'i') };

        if (date) {
             try {
                const startDate = new Date(`${date}T00:00:00.000Z`);
                const endDate = new Date(startDate);
                endDate.setUTCDate(startDate.getUTCDate() + 1);
                query.$and = query.$and || [];
                query.$and.push({ startDate: { $lt: endDate } });
                query.$and.push({ $or: [ { endDate: { $gte: startDate } }, { endDate: { $exists: false } } ] });
                if(query.startDate?.$gte === today && status !== 'past') delete query.startDate;


            } catch (e) { return res.status(400).json({ msg: 'Invalid date format (YYYY-MM-DD)'}); }
        }

        // --- Sorting ---
        let sortOptions = { startDate: 1 };
        if (sort) {
             switch (sort) {
                case 'startDate_desc':
                    sortOptions = { startDate: -1 };
                    break;
                 case 'title_asc':
                    sortOptions = { title: 1 };
                    break;
             }
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const total = await Event.countDocuments(query);
        const events = await Event.find(query)
                                 .populate('venue', 'name address.city')
                                 .sort({ startDate: 1 })
                                 .skip((page - 1) * limit)
                                 .limit(limit);

        const pagination = {};
        if ((page * limit) < total) pagination.next = { page: page + 1, limit };
        if (page > 1) pagination.prev = { page: page - 1, limit };

        res.status(200).json({ success: true, count: events.length, total, pagination, data: events });

    } catch (err) {
        console.error('Error fetching events:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
    const eventId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ msg: 'Invalid Event ID format' });
    }

    try {
        const event = await Event.findById(eventId)
                                 .populate('venue', 'name address facilities'); // trailerUrl and imageUrl will be included by default
        if (!event || event.status === 'Cancelled') {
             return res.status(404).json({ msg: 'Event not found or has been cancelled' });
        }

        res.status(200).json(event);
    } catch (err) {
        console.error('Error fetching event by ID:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin or Approved Organizer)
exports.createEvent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { venue, trailerUrl, ...eventData } = req.body;

    try {
        if (req.user.role === 'organizer') {
             const organizer = await User.findById(req.user.id).select('isApproved');
             if (!organizer?.isApproved) {
                 return res.status(403).json({ msg: 'Organizer account not approved to create events.' });
             }
        }

        const newEvent = new Event({
            ...eventData,
            venue: venue || undefined,
            trailerUrl: trailerUrl || undefined,
            organizer: req.user.id,
        });

        const event = await newEvent.save();
        res.status(201).json(event);

    } catch (err) {
        console.error('Error creating event:', err.message);
        if (err.code === 11000) {
             return res.status(400).json({ errors: [{ msg: 'Event with this title already exists' }] });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ errors: messages });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Update an existing event
// @route   PUT /api/events/:id
// @access  Private (Admin or Owning Organizer - needs ownership logic)
exports.updateEvent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const eventId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { venue, trailerUrl, ...eventData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ msg: 'Invalid Event ID format' });
    }

    try {
        let event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // --- Authorization Check ---
        if (venue !== undefined) {
             const access = await checkEventVenueAccess(venue || null, userId, userRole);
             if (!access.authorized) {
                return res.status(access.status).json({ msg: `Cannot update: ${access.error}` });
             }
        }
        const originalVenueAccess = await checkEventVenueAccess(event.venue, userId, userRole);
        if (!originalVenueAccess.authorized && userRole !== 'admin') {
             return res.status(403).json({ msg: 'User not authorized to update this event (based on original venue)' });
        }

        // Perform the update
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { $set: { ...eventData, venue: venue, trailerUrl: trailerUrl } },
            { new: true, runValidators: true }
        ).populate('venue', 'name address.city');

        res.status(200).json(updatedEvent);

    } catch (err) {
        console.error('Error updating event:', err.message);
         if (err.code === 11000) {
             return res.status(400).json({ errors: [{ msg: 'Event with this title already exists' }] });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ errors: messages });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin or Owning Organizer)
exports.deleteEvent = async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ msg: 'Invalid Event ID format' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        const venueAccess = await checkEventVenueAccess(event.venue, userId, userRole);
        if (!venueAccess.authorized && userRole !== 'admin') {
             return res.status(403).json({ msg: 'User not authorized to delete this event' });
        }

        await event.remove();
        res.status(200).json({ success: true, msg: 'Event deleted successfully' });

    } catch (err) {
         console.error('Error deleting event:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};