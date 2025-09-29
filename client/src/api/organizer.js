// client/src/api/organizer.js
import axios from 'axios';

const API_URL = '/api/organizer'; // Base URL for organizer-specific routes

/**
 * Fetches dashboard statistics for the logged-in organizer.
 * Requires organizer authentication.
 * @returns {Promise<object>}
 */
export const getOrganizerDashboardStatsApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/dashboard`);
        return response.data;
    } catch (error) {
        console.error('Error fetching organizer dashboard stats:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer dashboard stats');
    }
};

/**
 * Fetches venues managed by the logged-in organizer.
 * Requires organizer authentication.
 * @returns {Promise<Array>} - Array of venue objects.
 */
export const getMyVenuesApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/venues`);
        return response.data; // Expects an array of venues
    } catch (error) {
        console.error('Error fetching organizer venues:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer venues');
    }
};

/**
 * Fetches showtimes for venues managed by the logged-in organizer.
 * Requires organizer authentication.
 * @param {object} params - Optional filter params (e.g., venueId, movieId, date)
 * @returns {Promise<Array>} - Array of showtime objects.
 */
export const getMyShowtimesApi = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/showtimes`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching organizer showtimes:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer showtimes');
    }
};

/**
 * Fetches bookings for showtimes at venues managed by the logged-in organizer.
 * Requires organizer authentication.
 * @param {object} params - Optional filter params (e.g., showtimeId, date, status)
 * @returns {Promise<Array>} - Array of booking objects.
 */
export const getMyVenueBookingsApi = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/bookings`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching organizer venue bookings:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer venue bookings');
    }
};

/**
 * Updates the logged-in organizer's profile.
 * Requires organizer authentication.
 * @param {object} profileData - { name?, organizationName? }
 * @returns {Promise<object>}
 */
export const updateMyOrganizerProfileApi = async (profileData) => {
    try {
        const response = await axios.put(`${API_URL}/profile`, profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating organizer profile:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update organizer profile');
    }
};

/**
 * Fetches events managed by the logged-in organizer.
 * @returns {Promise<Array>} - Array of event objects.
 */
export const getMyEventsApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/events`);
        return response.data; // Expects an array of events
    } catch (error) {
        console.error('Error fetching organizer events:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer events');
    }
};

// Note: For creating/updating/deleting specific venues or showtimes, organizers will likely use
// the general /api/venues and /api/showtimes routes. Those API functions would be in
// client/src/api/venues.js and client/src/api/showtimes.js.
// The backend controllers for those routes already check for ownership or admin role.