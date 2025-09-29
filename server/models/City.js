// server/models/City.js
// Purpose: Defines the schema for the City collection.

const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a city name'],
        trim: true,
        unique: true, // Ensure city names are unique
        index: true
    },
    state: {
        type: String,
        required: [true, 'Please provide the state'],
        trim: true
    },
    isActive: { // Controls if the city appears in public listings/dropdowns
        type: Boolean,
        default: true,
        index: true
    },
    // Optional fields you might add later:
    // isFeatured: { type: Boolean, default: false }, // Highlight major cities?
    // imageUrl: { type: String }, // Image for the city?
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('City', CitySchema);