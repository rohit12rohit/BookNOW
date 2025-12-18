// server/models/User.js
// Purpose: Defines the schema for the User collection in MongoDB using Mongoose.

const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Needed here if using pre-save hook, but we'll hash in controller

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true, // Ensure email addresses are unique
        match: [ // Basic email format validation
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        // required: [true, 'Please provide a password'], // Not required for Google OAuth
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Prevent password from being returned in queries by default
    },
    googleId: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'admin'], // Allowed roles
        default: 'user' // Default role for new signups
    },
    // --- Organizer Specific Fields (Populated only if role is 'organizer') ---
    organizationName: {
        type: String,
    },
    managedVenues: [{ // Array of Venue ObjectIDs managed by this organizer
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue' // Reference to the 'Venue' model (we'll create later)
    }],
    isApproved: { // Flag for admin approval of organizer accounts
        type: Boolean,
        default: false
    },
    // --- End Organizer Specific Fields ---
    createdAt: { // Timestamp for when the user was created
        type: Date,
        default: Date.now
    },
    // Optional: Add fields for password reset later if needed
    resetPasswordToken: String,   // Stores the HASHED version of the reset token
    resetPasswordExpire: Date
});

/* // Example: Pre-save hook to hash password (Alternative to hashing in controller)
UserSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) {
        next();
    }
    // Hash the password with cost of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
}); 

/* // Example: Instance method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}; */

// --- NEW: Method to generate and hash password reset token ---
// (Add this method to the UserSchema)
UserSchema.methods.getResetPasswordToken = function() {
    // 1. Generate Token (Plain text token)
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash Token and set to resetPasswordToken field
    // We store the HASH in the DB, not the plain token
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 3. Set expire time (e.g., 10 minutes from now)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds

    // 4. Return the PLAIN text token (to be sent via email)
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);