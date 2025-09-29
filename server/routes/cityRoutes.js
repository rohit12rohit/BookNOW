// server/routes/cityRoutes.js
// Purpose: Defines public API routes related to cities.

const express = require('express');
const { getActiveCities } = require('../controllers/cityController');

const router = express.Router();

// @route   GET /api/cities
// @desc    Get list of active cities for public use
// @access  Public
router.get('/', getActiveCities);

module.exports = router;