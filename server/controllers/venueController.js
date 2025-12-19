// server/controllers/venueController.js
// Purpose: Venue CRUD with strict organizer association.

const Venue = require('../models/Venue');
const User = require('../models/User');
const Showtime = require('../models/Showtime');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// @desc    Get all active venues
// @route   GET /api/venues
// @access  Public
exports.getVenues = async (req, res) => {
    try {
        const { city, status, page = 1, limit = 10 } = req.query;
        let query = {};

        // Status Filter
        if (req.user?.role === 'admin') {
            if (status === 'active') query.isActive = true;
            else if (status === 'inactive') query.isActive = false;
            // else 'all'
        } else {
            // Public/Organizers only see active venues in the general list
            query.isActive = true;
        }

        if (city) {
            query['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
        }

        const count = await Venue.countDocuments(query);
        const venues = await Venue.find(query)
            .populate('organizer', 'organizationName')
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: venues.length,
            total: count,
            data: venues
        });

    } catch (err) {
        console.error('Get Venues Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get Venue By ID
// @route   GET /api/venues/:id
// @access  Public (Conditional)
exports.getVenueById = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('organizer', 'name organizationName');

        if (!venue) return res.status(404).json({ msg: 'Venue not found' });

        // Access Rule: Active venues are public. Inactive are Owner/Admin only.
        if (!venue.isActive) {
            const isOwner = req.user && (venue.organizer._id.toString() === req.user.id);
            const isAdmin = req.user && req.user.role === 'admin';
            
            if (!isOwner && !isAdmin) {
                return res.status(404).json({ msg: 'Venue not found or inactive' });
            }
        }

        res.status(200).json(venue);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Create Venue
// @route   POST /api/venues
// @access  Private (Approved Organizer/Admin)
exports.createVenue = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const organizerId = req.user.id;
        
        // 1. Create Venue
        const [venue] = await Venue.create([{
            ...req.body,
            organizer: organizerId,
            isActive: true
        }], { session });

        // 2. Link Venue to Organizer User Profile (Critical Step)
        if (req.user.role === 'organizer') {
            await User.findByIdAndUpdate(organizerId, {
                $addToSet: { managedVenues: venue._id }
            }, { session });
        }

        await session.commitTransaction();
        res.status(201).json(venue);

    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('Create Venue Error:', err);
        res.status(500).json({ msg: 'Server error creating venue' });
    } finally {
        session.endSession();
    }
};

// @desc    Update Venue
// @route   PUT /api/venues/:id
// @access  Private (Owner/Admin)
exports.updateVenue = async (req, res) => {
    try {
        let venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ msg: 'Venue not found' });

        if (venue.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        venue = await Venue.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json(venue);
    } catch (err) {
        console.error('Update Venue Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Deactivate Venue (Soft Delete)
// @route   DELETE /api/venues/:id
// @access  Private (Owner/Admin)
exports.deleteVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ msg: 'Venue not found' });

        if (venue.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Safety Check: Are there active showtimes?
        const hasActiveShowtimes = await Showtime.exists({
            venue: venue._id,
            isActive: true,
            startTime: { $gte: new Date() }
        });

        if (hasActiveShowtimes) {
            return res.status(400).json({ 
                msg: 'Cannot deactivate venue. There are active upcoming showtimes.' 
            });
        }

        // Soft Delete
        venue.isActive = false;
        await venue.save();

        res.status(200).json({ msg: 'Venue deactivated successfully' });

    } catch (err) {
        console.error('Delete Venue Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};