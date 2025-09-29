// client/src/api/bookings.js
// Handles API calls related to bookings.
import axios from 'axios';

const API_URL = '/api/bookings'; // Base URL for booking endpoints

/**
 * Creates a new booking by calling the backend API.
 * @param {object} bookingData - { showtimeId, seats, promoCode? }
 * @returns {Promise<object>} - The created booking object.
 */
export const createBookingApi = async (bookingData) => {
    try {
        const response = await axios.post(API_URL, bookingData);
        return response.data;
    } catch (error) {
        console.error('Booking API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Booking failed');
    }
};

/**
 * Fetches bookings for the currently logged-in user.
 * @returns {Promise<Array>} - An array of booking objects.
 */
export const getMyBookingsApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/me`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Get My Bookings API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch your bookings');
    }
};

/**
 * Fetches a specific booking by its ID.
 * @param {string} bookingId - The ID of the booking to fetch.
 * @returns {Promise<object>} - The booking object.
 */
export const getBookingByIdApi = async (bookingId) => {
     if (!bookingId) throw new Error('Booking ID is required');
    try {
        const response = await axios.get(`${API_URL}/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error(`Get Booking By ID (${bookingId}) API error:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch booking details');
    }
};


/**
 * Cancels a confirmed booking by its ID (user action).
 * @param {string} bookingId - The ID of the booking to cancel.
 * @returns {Promise<object>} - The success response object.
 */
export const cancelBookingApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required');
    try {
        const response = await axios.put(`${API_URL}/${bookingId}/cancel`);
        return response.data;
    } catch (error) {
         console.error(`Cancel Booking (${bookingId}) API error:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to cancel booking');
    }
};

/**
 * Cancels a pending booking (e.g., when payment modal is closed).
 * @param {string} bookingId - The ID of the 'PaymentPending' booking.
 * @returns {Promise<object>} - The success response object.
 */
export const cancelPendingBookingApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required to cancel a pending booking');
    try {
        const response = await axios.put(`${API_URL}/${bookingId}/cancel-pending`);
        return response.data;
    } catch (error) {
        console.error(`Cancel Pending Booking (${bookingId}) API error:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to cancel pending booking');
    }
};