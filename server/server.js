// server/server.js
// Purpose: Main entry point for the backend Express application.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet'); // RECOMMENDED: Install via 'npm install helmet'
const connectDB = require('./config/db');
require('./config/passport-setup'); // Just import to execute the setup logic

// --- Initialize Express App ---
const app = express();

// --- Connect to Database ---
connectDB();

// --- Core Middlewares ---
// 1. Security Headers
app.use(helmet()); 

// 2. CORS
app.use(cors({
    // In production, strictly use the env var. In dev, allow localhost.
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

// 3. Body Parsers
app.use(express.json({ extended: false }));

// --- Session and Passport Middleware ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        // Secure cookies are required in production (HTTPS)
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Adjust based on your cross-site needs
    }
}));

app.use(passport.initialize());
app.use(passport.session());


// --- Import Routers ---
const { movieReviewRouter, reviewManagementRouter } = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// --- API Routes ---
app.get('/', (req, res) => {
    res.json({ 
        message: `Welcome to BookNOW API`, 
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Mount Routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
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

// Nested & Special Routers
app.use('/api/reviews', reviewManagementRouter);
app.use('/api/movies/:movieId/reviews', movieReviewRouter);
app.use('/api/payments', paymentRoutes);

// --- Global Error Handler (Must be last) ---
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]:', err.stack);
    
    // Hide stack trace in production
    const response = {
        success: false,
        msg: err.message || 'Internal Server Error'
    };
    
    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }

    res.status(err.status || 500).json(response);
});

// --- Start Server ---
const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
} else {
    // In production, let the process manager (like PM2) handle logging or just start silently
    app.listen(PORT);
}

module.exports = app;