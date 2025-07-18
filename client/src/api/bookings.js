// File: /client/src/api/bookings.js
// Handles API calls related to bookings.
import axios from 'axios';

const API_URL = '/api/bookings'; // Base URL for booking endpoints

/**
 * Creates a new booking by calling the backend API.
 * Requires authentication token to be set in Axios defaults (handled by AuthContext).
 * @param {object} bookingData - { showtimeId, seats, promoCode? }
 * @returns {Promise<object>} - Promise resolving to the created booking object from the backend.
 */
export const createBookingApi = async (bookingData) => {
    console.log("[createBookingApi] Sending booking data:", bookingData);
    try {
        // Make the POST request to the backend endpoint
        // Auth token should be automatically included by Axios defaults if set by AuthContext
        const response = await axios.post(API_URL, bookingData);
        console.log("[createBookingApi] Backend response:", response.data);
        // Return the booking details received from the backend
        return response.data;
    } catch (error) {
        console.error('Booking API error:', error.response?.data || error.message);
        // Rethrow the error data (which might contain { msg: '...' } or { errors: [...] })
        // for the component to handle and display.
        throw error.response?.data || new Error('Booking failed');
    }
};

/**
 * Fetches bookings for the currently logged-in user.
 * Requires authentication token.
 * @returns {Promise<Array>} - Promise resolving to an array of booking objects.
 */
export const getMyBookingsApi = async () => {
    console.log("[getMyBookingsApi] Fetching user's bookings...");
    try {
        // Auth token automatically included by Axios defaults set in AuthContext
        const response = await axios.get(`${API_URL}/me`);
        console.log("[getMyBookingsApi] Received bookings:", response.data);
        // Ensure response is always an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Get My Bookings API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch your bookings');
    }
};

/**
 * Fetches a specific booking by its ID. Checks ownership on backend.
 * Requires authentication token.
 * @param {string} bookingId - The ID of the booking to fetch.
 * @returns {Promise<object>} - Promise resolving to the booking object.
 */
export const getBookingByIdApi = async (bookingId) => {
     if (!bookingId) throw new Error('Booking ID is required');
     console.log(`[getBookingByIdApi] Fetching booking: ${bookingId}`);
    try {
        // Auth token automatically included
        const response = await axios.get(`${API_URL}/${bookingId}`);
        console.log(`[getBookingByIdApi] Received booking details for ${bookingId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Get Booking By ID (${bookingId}) API error:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch booking details');
    }
};


/**
 * Cancels a specific booking by its ID.
 * Requires authentication token.
 * @param {string} bookingId - The ID of the booking to cancel.
 * @returns {Promise<object>} - Promise resolving to the success response object.
 */
export const cancelBookingApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required');
    try {
        // Auth token automatically included by Axios defaults
        const response = await axios.put(`${API_URL}/${bookingId}/cancel`);
        return response.data; // Returns { success: true, msg: '...', booking: {...} }
    } catch (error) {
         console.error(`Cancel Booking (${bookingId}) API error:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to cancel booking');
    }
};