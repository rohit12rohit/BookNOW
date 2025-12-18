// server/controllers/cityController.js
// Purpose: Handles public requests related to cities.

const City = require('../models/City');
const mongoose = require('mongoose');

// @desc    Get all ACTIVE cities (for public dropdowns/selection)
// @route   GET /api/cities
// @access  Public
exports.getActiveCities = async (req, res) => {
     try {
        const cities = await City.find({ isActive: true }).select('name state').sort({ name: 1 }); // Only return name/state
        res.status(200).json(cities);
    } catch (err) {
        console.error('Error fetching active cities:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};