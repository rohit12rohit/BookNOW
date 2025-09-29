// client/src/api/venues.js
import axios from 'axios';

const API_URL = '/api/venues'; // Public & Organizer/Admin endpoint for venues

/**
 * Fetches active venues (public view).
 * @param {object} params - Query params { city, facility, sort, limit, page }
 * @returns {Promise<object>}
 */
export const getVenuesApi = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching venues:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch venues');
    }
};

/**
 * Fetches a single venue by ID (public view).
 * @param {string} venueId
 * @returns {Promise<object>}
 */
export const getVenueByIdApi = async (venueId) => {
    if (!venueId) throw new Error('Venue ID is required');
    try {
        const response = await axios.get(`${API_URL}/${venueId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching venue ${venueId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch venue details');
    }
};

/**
 * Creates a new venue. Requires Organizer/Admin authentication.
 * Token is expected to be set in axios default headers by AuthContext.
 * @param {object} venueData - Data for the new venue.
 * @returns {Promise<object>} - The created venue object.
 */
export const createVenueApi = async (venueData) => {
    try {
        const response = await axios.post(API_URL, venueData);
        return response.data;
    } catch (error) {
        console.error('Error creating venue:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create venue');
    }
};

/**
 * Updates an existing venue. Requires Organizer (owner) / Admin authentication.
 * @param {string} venueId
 * @param {object} venueData
 * @returns {Promise<object>} - The updated venue object.
 */
export const updateVenueApi = async (venueId, venueData) => {
    if (!venueId) throw new Error('Venue ID is required for update');
    try {
        const response = await axios.put(`${API_URL}/${venueId}`, venueData);
        return response.data;
    } catch (error) {
        console.error(`Error updating venue ${venueId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update venue');
    }
};

/**
 * Deletes a venue. Requires Organizer (owner) / Admin authentication.
 * (Backend might implement soft delete).
 * @param {string} venueId
 * @returns {Promise<object>}
 */
export const deleteVenueApi = async (venueId) => {
    if (!venueId) throw new Error('Venue ID is required for deletion');
    try {
        const response = await axios.delete(`${API_URL}/${venueId}`);
        return response.data; // { msg: 'Venue deactivated/removed successfully' }
    } catch (error) {
        console.error(`Error deleting venue ${venueId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete venue');
    }
};