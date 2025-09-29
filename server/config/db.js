// server/config/db.js
const mongoose = require('mongoose');
// mongoose.set('strictPopulate', false);
const connectDB = async () => {
    try {
        // --- REPLACE the previous log line with these two ---
        console.log('[DB Connection] Attempting connection...'); // Log static text
        console.log('[DB Connection] URI:', process.env.MONGODB_URI); // Log the URI separately
        // --- END REPLACEMENT ---

        await mongoose.connect(process.env.MONGODB_URI, { /* options */ });
        console.log(`MongoDB Connected: ${mongoose.connection.host}`); // Changed to mongoose.connection.host

    } catch (err) {
        console.error(`MongoDB Connection Error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;