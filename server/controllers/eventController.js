// server/controllers/eventController.js
// Purpose: Contains logic for handling event information API requests (CRUD).

const Event = require('../models/Event');
const Venue = require('../models/Venue'); // Needed for potential venue validation
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User'); 

// --- Helper: Check if user can manage venue (if venue is linked) ---
// Reusing helper logic concept from showtimeController
const checkEventVenueAccess = async (venueId, userId, userRole) => {
    if (!venueId) return { authorized: true }; // No specific venue linked, access granted based on role check
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
        // Status Filter
        // if (status === 'upcoming' || !status) { // Default to upcoming
        if (status === 'upcoming' || !req.user) {
             query.status = { $in: ['Scheduled'] }; // Only scheduled
             query.startDate = { $gte: today }; // Starting today or later
        } else if (status === 'past') {
             // Could filter by status='Completed' OR (status='Scheduled' AND startDate < today)
             query.startDate = { $lt: today }; // Started before today
        } // else status === 'all', no date/status filter applied initially

        if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        if (city) query['address.city'] = { $regex: new RegExp(city, 'i') }; // Use 'address.city'
        if (tag) query.tags = { $regex: new RegExp(`^${tag}$`, 'i') }; // Match tag in array

        if (date) { // Filter events happening ON this specific date
             try {
                const startDate = new Date(`${date}T00:00:00.000Z`);
                const endDate = new Date(startDate);
                endDate.setUTCDate(startDate.getUTCDate() + 1);
                 // Event should start before the end of the day AND end after the start of the day (if endDate exists)
                 // Or simply start within the day if no endDate
                query.$and = query.$and || []; // Ensure $and array exists
                query.$and.push({ startDate: { $lt: endDate } });
                query.$and.push({ $or: [ { endDate: { $gte: startDate } }, { endDate: { $exists: false } } ] });
                // Remove the simpler startDate filter if date range is used
                if(query.startDate?.$gte === today && status !== 'past') delete query.startDate;


            } catch (e) { return res.status(400).json({ msg: 'Invalid date format (YYYY-MM-DD)'}); }
        }

        // --- Sorting ---
        let sortOptions = { startDate: 1 }; // Default sort: Soonest first
        if (sort) {
             switch (sort) {
                case 'startDate_desc':
                    sortOptions = { startDate: -1 }; // Furthest first
                    break;
                 case 'title_asc':
                    sortOptions = { title: 1 };
                    break;
                 // Add more if needed
             }
        }

        // --- Pagination ---
    //     const page = parseInt(req.query.page, 10) || 1;
    //     const limit = parseInt(req.query.limit, 10) || 10;
    //     const startIndex = (page - 1) * limit;
    //     const endIndex = page * limit;
    //     const total = await Event.countDocuments(query);

    //     // Execute Query
    //     const events = await Event.find(query)
    //                              .populate('venue', 'name address.city')
    //                              .sort(sortOptions)
    //                              .skip(startIndex)
    //                              .limit(limit)
    //                              .select('-organizerInfo.__v'); // Example exclusion

    //     // Pagination result
    //     const pagination = {};
    //     if (endIndex < total) pagination.next = { page: page + 1, limit };
    //     if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    //     res.status(200).json({ success: true, count: events.length, total, pagination, data: events });

    // } catch (err) {
    //     console.error('Error fetching events:', err.message);
    //     res.status(500).json({ msg: 'Server error' });
    // }

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
                                 .populate('venue', 'name address facilities'); // Populate linked venue details

        if (!event || event.status === 'Cancelled') { // Don't show cancelled events via direct ID lookup? Or show with status?
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

    const { venue, ...eventData } = req.body;

    try {
        // This check now works because 'User' is imported
        if (req.user.role === 'organizer') {
             const organizer = await User.findById(req.user.id).select('isApproved');
             if (!organizer?.isApproved) {
                 return res.status(403).json({ msg: 'Organizer account not approved to create events.' });
             }
        }

        const newEvent = new Event({
            ...eventData,
            venue: venue || undefined,
            organizer: req.user.id,
        });

        const event = await newEvent.save();
        res.status(201).json(event);

    } catch (err) {
        console.error('Error creating event:', err.message);
        if (err.code === 11000) {
             return res.status(400).json({ errors: [{ msg: 'Event with this title already exists' }] });
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
    const { venue, ...eventData } = req.body; // Separate venue if provided in update

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ msg: 'Invalid Event ID format' });
    }

    try {
        let event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // --- Authorization Check ---
        // 1. Check access to the *new* venue if venue is being changed
        if (venue !== undefined) { // If venue field is present in request body
             const access = await checkEventVenueAccess(venue || null, userId, userRole); // Allow null to unset venue
             if (!access.authorized) {
                return res.status(access.status).json({ msg: `Cannot update: ${access.error}` });
             }
        }
        // 2. Check access based on the *original* venue OR if user is admin
        const originalVenueAccess = await checkEventVenueAccess(event.venue, userId, userRole);
        if (!originalVenueAccess.authorized && userRole !== 'admin') {
            // If user isn't admin and isn't authorized for the original venue (if any)
             return res.status(403).json({ msg: 'User not authorized to update this event (based on original venue)' });
        }
        // More refined logic might be needed: Maybe only allow updating non-venue fields if not owner/admin?
        // Or link event directly to `addedBy` user for ownership checks if no venue.


        // Perform the update
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
             // Update eventData and handle venue separately
            { $set: { ...eventData, venue: venue } },
            { new: true, runValidators: true }
        ).populate('venue', 'name address.city');

        res.status(200).json(updatedEvent);

    } catch (err) {
        console.error('Error updating event:', err.message);
         if (err.code === 11000) {
             return res.status(400).json({ errors: [{ msg: 'Event with this title already exists' }] });
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

        // --- Authorization Check --- (Similar to update)
         const venueAccess = await checkEventVenueAccess(event.venue, userId, userRole);
        if (!venueAccess.authorized && userRole !== 'admin') {
             return res.status(403).json({ msg: 'User not authorized to delete this event' });
        }

        // TODO: Add dependency checks? Are there bookings linked to this event (if implementing event booking)?

        await event.remove();
        res.status(200).json({ success: true, msg: 'Event deleted successfully' });

    } catch (err) {
         console.error('Error deleting event:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};