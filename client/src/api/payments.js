// File: /client/src/api/payments.js
import axios from 'axios';

const API_URL = '/api/payments';

/**
 * Creates a Razorpay order on the backend for a given pending booking.
 * @param {string} bookingId - The ID of the booking with 'PaymentPending' status.
 * @returns {Promise<object>} - The Razorpay order details from the backend.
 */
export const createPaymentOrderApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required to create a payment order.');
    try {
        const response = await axios.post(`${API_URL}/create-order`, { bookingId });
        return response.data;
    } catch (error) {
        console.error('Error creating payment order:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create payment order');
    }
};

/**
 * Sends payment details to the backend for verification.
 * @param {object} verificationData - { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }
 * @returns {Promise<object>} - The success response from the backend after verification.
 */
export const verifyPaymentApi = async (verificationData) => {
    if (!verificationData.razorpay_payment_id || !verificationData.razorpay_order_id) {
        throw new Error('Payment verification details are missing.');
    }
    try {
        const response = await axios.post(`${API_URL}/verify`, verificationData);
        return response.data;
    } catch (error) {
        console.error('Error verifying payment:', error.response?.data || error.message);
        throw error.response?.data || new Error('Payment verification failed');
    }
};