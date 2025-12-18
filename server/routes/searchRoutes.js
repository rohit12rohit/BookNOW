// server/routes/searchRoutes.js
// Purpose: Defines API route(s) for search functionality.

const express = require('express');
const { searchAll } = require('../controllers/searchController');
// No auth needed for public search

const router = express.Router();

// @route   GET /api/search
// @desc    Search movies, events, venues based on query 'q'
// @access  Public
router.get('/', searchAll);


module.exports = router;