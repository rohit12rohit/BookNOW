// server/server.js
// Purpose: Main entry point for the backend Express application. Sets up middleware, routes, and starts the server.

// Load environment variables from .env file right at the start
require('dotenv').config();

// Import necessary packages
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db'); // Import database connection function
const passportSetup = require('./config/passport-setup'); // Import passport setup

// --- Initialize Express App ---
const app = express();

// --- Import Both Routers from reviewRoutes.js ---
const { movieReviewRouter, reviewManagementRouter } = require('./routes/reviewRoutes');


const paymentRoutes = require('./routes/paymentRoutes');


// --- Connect to Database ---
connectDB();

// --- Core Middlewares ---
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ extended: false }));

// --- Session and Passport Middleware ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(passport.initialize());
app.use(passport.session());


// --- API Routes ---
app.get('/', (req, res) => {
    res.json({ message: `Welcome to BookNOW API - Current Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}` });
});

// Mount Routers for different features
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes')); // <-- ADD THIS LINE
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

// app.listen(PORT, () => {
//     console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
// });

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
}

module.exports = app;