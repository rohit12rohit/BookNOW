// File: /server/controllers/adminController.js
// Purpose: Contains logic for handling administrative actions.

const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Event = require('../models/Event');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Venue = require('../models/Venue');
const Review = require('../models/Review');
const City = require('../models/City');
const sendEmail = require('../utils/sendEmail');


// @desc    Get all users (with optional filtering by role)
// @route   GET /api/admin/users
// @access  Private (Admin Only)
exports.getAllUsers = async (req, res) => {
    const { role } = req.query; // Allow filtering like /api/admin/users?role=organizer
    const query = {};
    if (role && ['user', 'organizer', 'admin'].includes(role)) {
        query.role = role;
    }

    try {
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get a single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin Only)
exports.getUserById = async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }
    try {
        const user = await User.findById(userId)
                               .select('-password')
                               .populate('managedVenues', 'name address.city');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user by ID:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Approve a pending organizer account
// @route   PUT /api/admin/organizers/:id/approve
// @access  Private (Admin Only)
exports.approveOrganizer = async (req, res) => {
    const organizerId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
        return res.status(400).json({ msg: 'Invalid Organizer ID format' });
    }
    try {
        const organizer = await User.findOne({ _id: organizerId, role: 'organizer' });
        if (!organizer) {
            return res.status(404).json({ msg: 'Organizer not found or user is not an organizer' });
        }
        if (organizer.isApproved) {
            return res.status(400).json({ msg: 'Organizer is already approved' });
        }
        organizer.isApproved = true;
        await organizer.save();
        const organizerObj = organizer.toObject();
        delete organizerObj.password;
        res.status(200).json({
            msg: 'Organizer approved successfully',
            organizer: organizerObj
        });
    } catch (err) {
        console.error('Error approving organizer:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Update user details (e.g., change role, name - use with caution)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin Only)
exports.updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;
    const { name, role, isApproved, organizationName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const updateFields = {};
        if (name) updateFields.name = name;
        if (role) updateFields.role = role;

        const finalRole = role || user.role;
        
        if (finalRole === 'organizer') {
            if (typeof isApproved === 'boolean') {
                updateFields.isApproved = isApproved;
            }
            if (organizationName) {
                 updateFields.organizationName = organizationName;
            }
        } else {
            updateFields.isApproved = false;
            updateFields.managedVenues = [];
            updateFields.organizationName = undefined;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ msg: 'User updated successfully', user: updatedUser });

    } catch (err) {
        console.error('Error updating user:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Delete a user (Use with extreme caution!)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin Only)
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (req.user.id === userId || user.id === req.user.id) {
            return res.status(400).json({ msg: 'Admin cannot delete their own account.' });
        }
        await user.remove();
        res.status(200).json({ msg: 'User deleted successfully' });
    } catch (err) {
         console.error('Error deleting user:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- Promo Code Management ---

// @desc    Get all promo codes
// @route   GET /api/admin/promocodes
// @access  Private (Admin Only)
exports.getAllPromoCodes = async (req, res) => {
    try {
        const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
        res.status(200).json(promoCodes);
    } catch (err) {
        console.error('Error fetching promo codes:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get a single promo code by ID
// @route   GET /api/admin/promocodes/:id
// @access  Private (Admin Only)
exports.getPromoCodeById = async (req, res) => {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Promo Code ID format' });
    }
    try {
        const promoCode = await PromoCode.findById(req.params.id);
        if (!promoCode) {
            return res.status(404).json({ msg: 'Promo code not found' });
        }
        res.status(200).json(promoCode);
    } catch (err) {
         console.error('Error fetching promo code by ID:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Create a new promo code
// @route   POST /api/admin/promocodes
// @access  Private (Admin Only)
exports.createPromoCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Convert code to uppercase before saving/checking
    if (req.body.code) {
        req.body.code = req.body.code.toUpperCase();
    }

    try {
        // Check if code already exists
        const existingCode = await PromoCode.findOne({ code: req.body.code });
        if (existingCode) {
            return res.status(400).json({ errors: [{ msg: 'Promo code already exists' }]});
        }

        const promoCode = await PromoCode.create(req.body);
        res.status(201).json(promoCode);
    } catch (err) {
        console.error('Error creating promo code:', err.message);
        // Handle validation errors etc.
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};


// @desc    Update a promo code
// @route   PUT /api/admin/promocodes/:id
// @access  Private (Admin Only)
exports.updatePromoCode = async (req, res) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Promo Code ID format' });
    }

    // Prevent changing the code itself? Or validate uniqueness if changed.
    if (req.body.code) {
        delete req.body.code; // Typically code shouldn't be updated, only other fields
        // Or add logic to check uniqueness if allowing code change
    }
     if (req.body.uses) {
        delete req.body.uses; // Prevent manually setting uses count via update
    }


    try {
        const promoCode = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true // Run schema validations on update
        });

        if (!promoCode) {
            return res.status(404).json({ msg: 'Promo code not found' });
        }
        res.status(200).json(promoCode);
    } catch (err) {
        console.error('Error updating promo code:', err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};


// @desc    Delete a promo code
// @route   DELETE /api/admin/promocodes/:id
// @access  Private (Admin Only)
exports.deletePromoCode = async (req, res) => {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Promo Code ID format' });
    }
    try {
        const promoCode = await PromoCode.findById(req.params.id);
        if (!promoCode) {
            return res.status(404).json({ msg: 'Promo code not found' });
        }

        // Consider if codes with uses should be deletable or just deactivated
        await promoCode.remove();
        res.status(200).json({ success: true, msg: 'Promo code deleted' });

    } catch (err) {
        console.error('Error deleting promo code:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// --- Booking Management ---
/**
 * @desc    Get all bookings (Admin access, with filters)
 * @route   GET /api/admin/bookings
 * @access  Private (Admin Only)
 */
exports.getAllBookings = async (req, res) => {
    try {
        const { userId, showtimeId, movieId, eventId, venueId, date, status, sort, bookingRefId } = req.query;
        const query = {};

        // --- 1. Build the primary query object for the 'Booking' collection ---
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            query.user = userId;
        }
        if (status && ['PaymentPending', 'Confirmed', 'Cancelled', 'CheckedIn', 'PaymentFailed'].includes(status)) {
            query.status = status;
        }
        if (bookingRefId) {
            query.bookingRefId = bookingRefId.trim().toUpperCase();
        }

        // --- 2. Handle filtering by showtime properties (movie, event, venue) ---
        // If a specific showtimeId is provided, use it directly.
        if (showtimeId && mongoose.Types.ObjectId.isValid(showtimeId)) {
            query.showtime = showtimeId;
        } else {
            // Otherwise, build a sub-query to find relevant showtime IDs first.
            const showtimeSubQuery = {};
            if (movieId && mongoose.Types.ObjectId.isValid(movieId)) showtimeSubQuery.movie = movieId;
            if (eventId && mongoose.Types.ObjectId.isValid(eventId)) showtimeSubQuery.event = eventId;
            if (venueId && mongoose.Types.ObjectId.isValid(venueId)) showtimeSubQuery.venue = venueId;

            // If any of those filters exist, find the corresponding showtimes.
            if (Object.keys(showtimeSubQuery).length > 0) {
                const relevantShowtimeIds = await Showtime.find(showtimeSubQuery).distinct('_id');
                // If no showtimes match, there can be no bookings. Return early.
                if (relevantShowtimeIds.length === 0) {
                    return res.status(200).json({ success: true, count: 0, total: 0, pagination: {}, data: [] });
                }
                // Add the list of showtime IDs to the main query.
                query.showtime = { $in: relevantShowtimeIds };
            }
        }

        // --- 3. Handle date filtering ---
        if (date) {
            try {
                const startDate = dayjs(date).startOf('day').toDate();
                const endDate = dayjs(date).endOf('day').toDate();
                query.bookingTime = { $gte: startDate, $lte: endDate };
            } catch (e) {
                console.warn("Invalid date format for booking filter:", date);
            }
        }

        // --- 4. Define sorting options ---
        let sortOptions = { bookingTime: -1 }; // Default sort
        if (sort) {
            // Add custom sort logic here if needed, e.g., switch(sort) { ... }
        }

        // --- 5. Handle pagination ---
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        // --- 6. Execute queries for total count and paginated data ---
        const total = await Booking.countDocuments(query);

        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .populate({
                path: 'showtime', // Populate the showtime document
                select: 'startTime movie event venue screenName', // Select desired fields
                populate: [
                    {
                        path: 'venue', // Nested populate for venue
                        select: 'name'
                    },
                    {
                        path: 'movie', // Nested populate for movie (will be null if not a movie showtime)
                        select: 'title'
                    },
                    {
                        path: 'event', // Nested populate for event (will be null if not an event showtime)
                        select: 'title'
                    }
                ]
            })
            .populate('promoCodeApplied', 'code')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit)
            .lean(); // Use .lean() for faster read-only queries

        // --- 7. Construct pagination object for the response ---
        const pagination = {};
        if ((startIndex + limit) < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        // --- 8. Send the final response ---
        res.status(200).json({ success: true, count: bookings.length, total, pagination, data: bookings });

    } catch (err) {
        console.error('Error fetching all bookings (Admin):', err);
        // Handle specific Mongoose errors if necessary
        if (err.name === 'StrictPopulateError') {
            console.error('StrictPopulateError Path:', err.path);
        }
        res.status(500).json({ msg: 'Server error fetching bookings', error: err.message });
    }
};



// @desc    Get a single booking by ID (Admin access)
// @route   GET /api/admin/bookings/:id
// @access  Private (Admin Only)
exports.getBookingByIdAdmin = async (req, res) => {
    const bookingId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ msg: 'Invalid Booking ID format' });
    }

    try {
        const booking = await Booking.findById(bookingId)
            .select('+qrCodeData') // *** THIS IS THE FIX ***
            .populate('user', 'name email role')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl duration' },
                    { path: 'event', select: 'title imageUrl' },
                    { 
                        path: 'venue', 
                        select: 'name address',
                        populate: { path: 'organizer', select: 'name organizationName' }
                    }
                ]
            })
            .populate('promoCodeApplied')
            .populate('checkedInBy', 'name email');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        res.status(200).json(booking);

    } catch (err) {
        console.error('Error fetching booking by ID (Admin):', err);
        res.status(500).json({ msg: 'Server error fetching booking details', error: err.message });
    }
};


// --- Platform Statistics ---

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
// @access  Private (Admin Only)
exports.getPlatformStats = async (req, res) => {
    try {
        // Use Promise.all to run counts in parallel for efficiency
        const [
            totalUsers,
            totalOrganizers,
            approvedOrganizers,
            totalMovies,
            totalActiveVenues,
            totalUpcomingEvents,
            totalUpcomingShowtimes,
            totalBookings,
            confirmedBookings,
            totalPromoCodes,
            activePromoCodes,
            revenueData // Array from aggregation pipeline
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'organizer' }),
            User.countDocuments({ role: 'organizer', isApproved: true }),
            Movie.countDocuments(),
            Venue.countDocuments({ isActive: true }),
            Event.countDocuments({ status: 'Scheduled', startDate: { $gte: new Date() } }),
            Showtime.countDocuments({ isActive: true, startTime: { $gte: new Date() } }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Confirmed' }),
            PromoCode.countDocuments(),
            PromoCode.countDocuments({ isActive: true }),
            // Simulate total revenue from confirmed bookings
            Booking.aggregate([
                { $match: { status: 'Confirmed' } }, // Only confirmed bookings
                { $group: {
                    _id: null, // Group all documents together
                    totalRevenue: { $sum: '$totalAmount' } // Sum the final amount paid
                 }}
            ])
        ]);

        // Extract total revenue from aggregation result (if any bookings exist)
        const simulatedTotalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    organizers: totalOrganizers,
                    approvedOrganizers: approvedOrganizers,
                    regularUsers: totalUsers - totalOrganizers // Calculated
                },
                content: {
                    movies: totalMovies,
                    activeVenues: totalActiveVenues,
                    upcomingEvents: totalUpcomingEvents,
                    upcomingShowtimes: totalUpcomingShowtimes
                },
                bookings: {
                    total: totalBookings,
                    confirmed: confirmedBookings
                    // Add counts for other statuses if needed
                },
                promoCodes: {
                    total: totalPromoCodes,
                    active: activePromoCodes
                },
                financials: { // Note: Based on simulated payments
                    simulatedTotalRevenue: simulatedTotalRevenue.toFixed(2) // Format to 2 decimal places
                }
            }
        });

    } catch (err) {
        console.error('Error fetching platform stats (Admin):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- Review Management (Admin) ---

// @desc    Get all reviews (Admin access, with filters)
// @route   GET /api/admin/reviews?userId=...&movieId=...&rating=5&page=1&limit=20
// @access  Private (Admin Only)
exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const { userId, movieId, rating, sort } = req.query;
        const query = {};

        // --- Filtering ---
        if (userId && mongoose.Types.ObjectId.isValid(userId)) query.user = userId;
        if (movieId && mongoose.Types.ObjectId.isValid(movieId)) query.movie = movieId;
        if (rating) {
            const numericRating = parseInt(rating, 10);
            if (!isNaN(numericRating) && numericRating >= 1 && numericRating <= 5) { // Adjust max if scale is different
                query.rating = numericRating;
            }
        }

        // --- Sorting ---
        let sortOptions = { createdAt: -1 }; // Default: newest reviews first
        if (sort) {
            switch (sort) {
                case 'createdAt_asc': sortOptions = { createdAt: 1 }; break;
                case 'rating_desc': sortOptions = { rating: -1, createdAt: -1 }; break;
                case 'rating_asc': sortOptions = { rating: 1, createdAt: -1 }; break;
                // Add more sort options if needed
            }
        }

        // --- Pagination ---
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Get total count matching the query
        const total = await Review.countDocuments(query);

        // Execute query
        const reviews = await Review.find(query)
            .populate('user', 'name email') // Populate user info
            .populate('movie', 'title') // Populate movie title
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit);

        // Pagination result
        const pagination = {};
        if (endIndex < total) pagination.next = { page: page + 1, limit };
        if (startIndex > 0) pagination.prev = { page: page - 1, limit };

        res.status(200).json({ success: true, count: reviews.length, total, pagination, data: reviews });

    } catch (err) {
        console.error('Error fetching all reviews (Admin):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Get all reviews with pending reports
// @route   GET /api/admin/reviews/reported
// @access  Private (Admin Only)
exports.getReportedReviewsAdmin = async (req, res) => {
    try {
        // Find reviews that have at least one report with 'pending' status
        const reportedReviews = await Review.find({ 'reports.status': 'pending' })
            .populate('user', 'name email') // Who wrote the review
            .populate('movie', 'title') // Which movie the review is for
            .populate('reports.user', 'name email') // Who reported the review
            .sort({ createdAt: -1 });

        res.status(200).json(reportedReviews);
    } catch (err) {
        console.error('Error fetching reported reviews (Admin):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Resolve a report on a review (delete review or dismiss report)
// @route   PUT /api/admin/reviews/:reviewId/resolve
// @access  Private (Admin Only)
exports.resolveReportedReviewAdmin = async (req, res) => {
    const { reviewId } = req.params;
    const { action } = req.body; // 'delete' or 'dismiss'

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID format' });
    }

    if (!['delete', 'dismiss'].includes(action)) {
        return res.status(400).json({ msg: "Invalid action. Must be 'delete' or 'dismiss'." });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        if (action === 'delete') {
            // This will trigger the pre('remove') hook to recalculate the movie's average rating
            await review.remove();
            res.status(200).json({ success: true, msg: 'Review deleted successfully.' });
        } else if (action === 'dismiss') {
            // Mark all pending reports as resolved
            await Review.updateOne(
                { _id: reviewId, 'reports.status': 'pending' },
                { $set: { 'reports.$[].status': 'resolved' } }
            );
            res.status(200).json({ success: true, msg: 'Reports dismissed successfully.' });
        }
    } catch (err) {
        console.error(`Error resolving report for review ${reviewId}:`, err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- City Management (Admin) ---

// @desc    Get all cities (for admin management)
// @route   GET /api/admin/cities
// @access  Private (Admin Only)
exports.getAllCitiesAdmin = async (req, res) => {
    try {
        // Admin gets all cities, regardless of isActive status
        const cities = await City.find().sort({ state: 1, name: 1 }); // Sort by state then name
        res.status(200).json(cities);
    } catch (err) {
        console.error('Error fetching cities (Admin):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Create a new city
// @route   POST /api/admin/cities
// @access  Private (Admin Only)
exports.createCity = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, state, isActive } = req.body;

    try {
        // Check if city already exists (case-insensitive check might be better)
        let city = await City.findOne({ name: new RegExp(`^${name}$`, 'i') });
        if (city) {
            return res.status(400).json({ errors: [{ msg: 'City already exists' }]});
        }

        city = await City.create({ name, state, isActive });
        res.status(201).json(city);
    } catch (err) {
        console.error('Error creating city:', err.message);
        if (err.code === 11000) { return res.status(400).json({ errors: [{ msg: 'City already exists (duplicate key).' }]});}
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};

// @desc    Update a city (e.g., change state, activate/deactivate)
// @route   PUT /api/admin/cities/:id
// @access  Private (Admin Only)
exports.updateCity = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid City ID format' });
    }

    const { name, state, isActive } = req.body;
    const updateData = {};
    if (name) updateData.name = name; // Allow renaming? Check for uniqueness if allowing.
    if (state) updateData.state = state;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    try {
        // Optional: Add check here if renaming to ensure new name doesn't already exist

        const city = await City.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!city) {
            return res.status(404).json({ msg: 'City not found' });
        }
        res.status(200).json(city);
    } catch (err) {
        console.error('Error updating city:', err.message);
         if (err.code === 11000) { return res.status(400).json({ errors: [{ msg: 'Another city with this name already exists.' }]});}
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};

// @desc    Delete a city
// @route   DELETE /api/admin/cities/:id
// @access  Private (Admin Only)
exports.deleteCity = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid City ID format' });
    }
    try {
        // --- CORRECTED LOGIC ---
        // Use the static findByIdAndDelete method instead of fetching then removing.
        // This is the modern, correct way and avoids the ".remove() is not a function" error.
        const city = await City.findByIdAndDelete(req.params.id);
        
        if (!city) {
            return res.status(404).json({ msg: 'City not found' });
        }

        // TODO: Add dependency checks? Are any venues using this city?
        // For now, deletion proceeds.

        res.status(200).json({ success: true, msg: 'City deleted successfully' });

    } catch (err) {
        console.error('Error deleting city:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// --- Booking Management (Admin - Continued) ---

// @desc    Cancel any booking by ID (Admin access)
// @route   PUT /api/admin/bookings/:id/cancel
// @access  Private (Admin Only)
// cancelAnyBookingAdmin - Ensure this is also reviewed if it uses similar populates
exports.cancelAnyBookingAdmin = async (req, res) => {
    const bookingId = req.params.id;
    const adminUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ msg: 'Invalid Booking ID format' });
    }

    const mongoSession = await mongoose.startSession(); // Renamed to avoid conflict with HTTP session

    try {
        mongoSession.startTransaction();

        const bookingToCancel = await Booking.findById(bookingId)
            // Populate necessary fields for logic and email, lean can be used here too
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                select: 'startTime movie event venue seats', // Need seats for $pullAll
            })
            .session(mongoSession)
            .lean(); // Use lean if performing manual sub-population

        if (!bookingToCancel) {
            await mongoSession.abortTransaction(); mongoSession.endSession();
            return res.status(404).json({ msg: 'Booking not found' });
        }

        if (bookingToCancel.status === 'Cancelled') {
            await mongoSession.abortTransaction(); mongoSession.endSession();
            return res.status(400).json({ msg: `Booking is already Cancelled` });
        }

        const originalStatus = bookingToCancel.status;

        // Update booking status directly
        await Booking.updateOne(
            { _id: bookingId },
            { $set: { status: 'Cancelled' /*, notes: `Cancelled by Admin ${adminUserId} on ${new Date()}` */ } },
            { session: mongoSession }
        );


        if ((originalStatus === 'Confirmed' || originalStatus === 'PaymentPending' || originalStatus === 'CheckedIn') && bookingToCancel.showtime && bookingToCancel.seats) {
            console.log(`[Admin Cancel] Releasing seats ${bookingToCancel.seats.join(', ')} for booking ${bookingId} from showtime ${bookingToCancel.showtime._id}.`);
            const showtimeUpdateResult = await Showtime.updateOne(
                { _id: bookingToCancel.showtime._id },
                { $pullAll: { bookedSeats: bookingToCancel.seats } },
                { session: mongoSession }
            );
            if (showtimeUpdateResult.modifiedCount === 0 && bookingToCancel.seats.length > 0) {
                console.warn(`[Admin Cancel] Showtime ${bookingToCancel.showtime._id} seat release might not have modified (modifiedCount: 0).`);
            }
        } else {
            console.log(`[Admin Cancel] Booking ${bookingId} status was ${originalStatus}, seats not explicitly released again or showtime/seats info missing.`);
        }

        await mongoSession.commitTransaction();
        mongoSession.endSession();

        // Fetch the fully populated booking for the email and response AFTER transaction
        const finalBookingDetails = await Booking.findById(bookingId)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                select: 'startTime movie event venue screenName',
                populate: [
                    { path: 'movie', select: 'title' },
                    { path: 'event', select: 'title' },
                    { path: 'venue', select: 'name' }
                ]
            }).lean();


        if (finalBookingDetails?.user?.email) {
            const subject = `Your BookNOW Booking (Ref: ${finalBookingDetails.bookingRefId || finalBookingDetails._id.toString().slice(-6)}) Has Been Cancelled`;
            const itemTitle = finalBookingDetails.showtime?.movie?.title || finalBookingDetails.showtime?.event?.title || "the scheduled item";
            const showtimeDateTime = finalBookingDetails.showtime?.startTime ? dayjs(finalBookingDetails.showtime.startTime).format('DD MMM YY, hh:mm A') : "N/A";
            const message = `
                 <p>Hi ${finalBookingDetails.user.name},</p>
                 <p>This email is to inform you that your BookNOW booking (Ref ID: <strong>${finalBookingDetails.bookingRefId || finalBookingDetails._id.toString().slice(-6)}</strong>) for ${itemTitle} originally scheduled for ${showtimeDateTime} has been cancelled by administration.</p>
                 <p>If applicable, any refunds will be processed according to our policy. Please allow a few business days for this to reflect in your account.</p>
                 <p>If you have questions, please contact our support team.</p>
                 <p>Sincerely,<br/>The BookNOW Team</p>`;
            try {
              await sendEmail({ to: finalBookingDetails.user.email, subject: subject, html: message });
              console.log(`[Admin Cancel] Cancellation notification sent to ${finalBookingDetails.user.email}`);
            } catch (emailError) {
              console.error(`[Admin Cancel] Failed to send cancellation email for ${bookingId}: ${emailError.message}`);
            }
        }

        res.status(200).json({ success: true, msg: 'Booking cancelled successfully by admin', booking: finalBookingDetails });

    } catch (err) {
        console.error('Error cancelling booking (Admin):', err);
        if (mongoSession.inTransaction()) {
            await mongoSession.abortTransaction();
        }
        mongoSession.endSession();
        res.status(500).json({ msg: `Server error: ${err.message}`, path: err.path });
    }
};