// server/controllers/searchController.js
// Purpose: Handles search requests across multiple collections.

const Movie = require('../models/Movie');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const mongoose = require('mongoose');

// @desc    Search across Movies, Events, Venues
// @route   GET /api/search?q=query&limit=10
// @access  Public
exports.searchAll = async (req, res) => {
    const searchTerm = req.query.q; // Get search term from query param 'q'
    const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10 results per category

    if (!searchTerm || searchTerm.trim().length < 2) { // Require a minimum query length?
        return res.status(400).json({ msg: 'Please provide a search term (at least 2 characters)' });
    }

    // Use case-insensitive regex for broader matching on non-text-indexed fields if needed
    // const regex = new RegExp(searchTerm, 'i');

    try {
        // Perform searches in parallel using Promise.all
        const [movieResults, eventResults, venueResults] = await Promise.all([
            // Search Movies using text index ($text)
            Movie.find(
                { $text: { $search: searchTerm } },
                { score: { $meta: 'textScore' } } // Project score for relevance sorting
            )
            .select('title description posterUrl releaseDate language genre averageRating') // Select relevant fields
            .sort({ score: { $meta: 'textScore' } }) // Sort by relevance score
            .limit(limit),

            // Search Events using text index ($text)
            Event.find(
                 { $text: { $search: searchTerm }, status: 'Scheduled', startDate: { $gte: new Date() } }, // Search only upcoming scheduled events
                 { score: { $meta: 'textScore' } }
            )
            .select('title description category imageUrl startDate address venue') // Select relevant fields
            .populate('venue', 'name') // Populate venue name if linked
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit),

            // Search Venues using text index ($text)
            Venue.find(
                { $text: { $search: searchTerm }, isActive: true },
                { score: { $meta: 'textScore' } }
            )
            .select('name address screens.name facilities') // Select relevant fields
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
        ]);

        res.status(200).json({
            query: searchTerm,
            results: {
                movies: movieResults,
                events: eventResults,
                venues: venueResults
            }
        });

    } catch (err) {
        console.error('Search Error:', err.message);
        // Text search might fail if index doesn't exist yet or other issues
        if (err.message.includes('text index required')) {
             return res.status(500).json({ msg: 'Search functionality requires text indexes to be configured on the database.' });
        }
        res.status(500).json({ msg: 'Server error during search' });
    }
};