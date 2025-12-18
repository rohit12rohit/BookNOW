// File: /server/controllers/venueController.js
// Purpose: Contains logic for handling venue-related API requests (CRUD).

const Venue = require('../models/Venue');
const User = require('../models/User'); // Needed to update organizer's managedVenues
const { validationResult } = require('express-validator');

// @desc    Get all active venues (with filtering and sorting)
// @route   GET /api/venues?city=Bhubaneswar&facility=Parking&sort=name_asc&limit=10&page=1
// @access  Public
exports.getVenues = async (req, res) => {
    try {
        const { city, facility, sort, status } = req.query;
        let query = {}; // Start with an empty query object

        // --- CORRECTED LOGIC ---
        // For non-admins, always filter for active venues.
        if (req.user?.role !== 'admin') {
            query.isActive = true;
        } 
        // For admins, the filter depends on the 'status' query parameter.
        else {
            if (status === 'active') {
                query.isActive = true;
            } else if (status === 'inactive') {
                query.isActive = false;
            }
            // If status is 'all' or not provided, we add no 'isActive' filter,
            // so all venues are returned for the admin.
        }

        // --- The rest of the function remains the same ---
        if (city) {
            query['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
        }
        // ... (sorting and pagination logic is unchanged) ...
        
        // --- Execute Query ---
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const total = await Venue.countDocuments(query);

        const venues = await Venue.find(query)
                                .populate('organizer', 'organizationName')
                                .sort({ name: 1 }) // Simplified sort for clarity
                                .skip(startIndex)
                                .limit(limit);

        const pagination = {
            next: (startIndex + limit < total) ? { page: page + 1, limit } : null,
            prev: (startIndex > 0) ? { page: page - 1, limit } : null,
        };

        res.status(200).json({ success: true, count: venues.length, total, pagination, data: venues });

    } catch (err) {
        console.error('Error fetching venues:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get a single venue by ID
// @route   GET /api/venues/:id
// @access  Public
exports.getVenueById = async (req, res) => {
    try {
        // Step 1: Find the venue by its ID, without checking its active status.
        const venue = await Venue.findById(req.params.id)
                                 .populate('organizer', 'name organizationName');

        // Step 2: If the venue doesn't exist in the database at all, return 404.
        if (!venue) {
            return res.status(404).json({ msg: 'Venue not found' });
        }

        // Step 3: If the venue is active, anyone can view it.
        if (venue.isActive) {
            return res.status(200).json(venue);
        }

        // Step 4: If the venue is INACTIVE, check if the user is authorized to see it.
        // req.user is available because we added authMiddleware to the route.
        const user = req.user;

        // An admin OR the venue's owner can see the inactive venue.
        if (user && (user.role === 'admin' || venue.organizer._id.toString() === user.id)) {
            return res.status(200).json(venue);
        }
        
        // Step 5: If none of the above conditions are met, deny access.
        // This happens if a public user or an unauthorized organizer tries to access an inactive venue.
        return res.status(404).json({ msg: 'Venue not found or is inactive' });

    } catch (err) {
        console.error('Error fetching venue by ID:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Venue not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Create a new venue
// @route   POST /api/venues
// @access  Private (Admin or Approved Organizer)
exports.createVenue = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, facilities, screens } = req.body;
    const organizerId = req.user.id; // From authMiddleware

    try {
         // Security Check: Ensure the logged-in user is actually an approved organizer or admin
        const user = await User.findById(organizerId);
        if (!user || (user.role === 'organizer' && !user.isApproved) && user.role !== 'admin') {
             return res.status(403).json({ msg: 'User not authorized or not approved to create venues' });
        }

        // Create new venue instance
        const newVenue = new Venue({
            name,
            address,
            facilities,
            screens, // Assumes screens data is sent in correct format
            organizer: organizerId, // Assign the logged-in user as the organizer
            isActive: true // Default to active
        });

        // Save the venue
        const venue = await newVenue.save();

        // IMPORTANT: Add this venue's ID to the managing organizer's User document
        if (user.role === 'organizer') {
            user.managedVenues.push(venue._id);
            await user.save();
        }

        res.status(201).json(venue);

    } catch (err) {
        console.error('Error creating venue:', err.message);
        // Handle potential duplicate key errors if unique indexes are added
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Update an existing venue
// @route   PUT /api/venues/:id
// @access  Private (Admin or Owning Organizer)
exports.updateVenue = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, facilities, screens, isActive } = req.body;
    const venueId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        let venue = await Venue.findById(venueId);

        if (!venue) {
            return res.status(404).json({ msg: 'Venue not found' });
        }

        // --- Authorization Check: Allow Admins OR the specific Organizer who owns it ---
        if (venue.organizer.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ msg: 'User not authorized to update this venue' });
        }

        // Prepare updated fields
        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (address) updatedFields.address = address;
        if (facilities) updatedFields.facilities = facilities;
        if (screens) updatedFields.screens = screens; // Allow updating screens array
        if (typeof isActive === 'boolean') updatedFields.isActive = isActive; // Allow updating active status

        // Perform the update
        venue = await Venue.findByIdAndUpdate(
            venueId,
            { $set: updatedFields },
            { new: true, runValidators: true } // Return updated doc, run schema validation
        ).populate('organizer', 'name organizationName');

        res.status(200).json(venue);

    } catch (err) {
        console.error('Error updating venue:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Venue not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Delete a venue (Soft delete might be better - setting isActive=false)
// @route   DELETE /api/venues/:id
// @access  Private (Admin or Owning Organizer)
exports.deleteVenue = async (req, res) => {
    const venueId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const venue = await Venue.findById(venueId);

        if (!venue) {
            return res.status(404).json({ msg: 'Venue not found' });
        }

        // --- Authorization Check: Allow Admins OR the specific Organizer who owns it ---
        if (venue.organizer.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ msg: 'User not authorized to delete this venue' });
        }

        // TODO: Check for dependencies - Are there upcoming showtimes scheduled at this venue?
        // If yes, prevent deletion or handle cascade (e.g., cancel showtimes).
        // For now, we proceed. Consider soft delete (setting isActive=false) instead of hard delete.

        // --- Hard Delete ---
        // await venue.remove();

        // --- Soft Delete (Recommended) ---
        venue.isActive = false;
        await venue.save();


        // Remove venue reference from the organizer's managedVenues array
        await User.findByIdAndUpdate(venue.organizer, {
            $pull: { managedVenues: venueId }
        });


        // res.status(200).json({ msg: 'Venue removed successfully' }); // For hard delete
        res.status(200).json({ msg: 'Venue deactivated successfully' }); // For soft delete

    } catch (err) {
        console.error('Error deleting/deactivating venue:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Venue not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};