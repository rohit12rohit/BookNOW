// server/server.js
// Purpose: Main entry point for the backend Express application. Sets up middleware, routes, and starts the server.

// Load environment variables from .env file right at the start
require('dotenv').config();

// Import necessary packages
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import database connection function

// --- Initialize Express App ---
const app = express();

// --- Import Both Routers from reviewRoutes.js ---
const { movieReviewRouter, reviewManagementRouter } = require('./routes/reviewRoutes');


const paymentRoutes = require('./routes/paymentRoutes');


// --- Connect to Database ---
connectDB();

// --- Core Middlewares ---
app.use(cors());
app.use(express.json({ extended: false }));

// --- API Routes ---
app.get('/', (req, res) => {
    res.json({ message: `Welcome to BookNOW API - Current Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}` });
});

// Mount Routers for different features
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/venues', require('./routes/venueRoutes'));
app.use('/api/showtimes', require('./routes/showtimeRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/organizer', require('./routes/organizerRoutes'));
app.use('/api/scan', require('./routes/scanRoutes.js')); 
app.use('/api/events', require('./routes/eventRoutes')); 
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/cities', require('./routes/cityRoutes'));

// --- Mount Review Routers Correctly ---
app.use('/api/reviews', reviewManagementRouter);
app.use('/api/movies/:movieId/reviews', movieReviewRouter); // This nested route is correct here
app.use('/api/payments', paymentRoutes);
// --- Define Port and Start Server ---
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});