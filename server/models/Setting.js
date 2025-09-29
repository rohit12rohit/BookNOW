// server/models/Setting.js
// Purpose: Defines the schema for storing global application settings.

const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true, // Store setting names in uppercase for consistency (e.g., 'GST_RATE')
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can store string, number, boolean, etc.
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the 'updatedAt' field on save
SettingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Setting', SettingSchema);