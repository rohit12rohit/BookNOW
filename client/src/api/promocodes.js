// client/src/api/promocodes.js
// Handles API calls related to user-facing promo codes.
import axios from 'axios';

const API_URL = '/api/promocodes';

/**
 * Fetches a list of all active and valid promo codes for display on the frontend.
 * @returns {Promise<Array>} - Promise resolving to an array of simplified promo code objects.
 */
export const getAvailablePromoCodesApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/available`);
        return response.data; // Expected: [{ _id, code, description, discountType, discountValue, minPurchaseAmount, maxDiscountAmount }]
    } catch (error) {
        console.error('Error fetching available promo codes:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch available promo codes');
    }
};

/**
 * Sends a promo code and an amount to the backend for verification.
 * @param {string} code - The promo code string to verify.
 * @param {number} amount - The current booking amount (subtotal) before discount.
 * @returns {Promise<object>} - Promise resolving to verification result { valid: boolean, discount?: number, msg?: string, promoDetails?: object }
 */
export const verifyPromoCodeApi = async (code, amount) => {
    if (!code || amount === undefined || amount === null) {
        throw new Error('Promo code and amount are required for verification.');
    }
    try {
        const response = await axios.post(`${API_URL}/verify`, { code, amount });
        return response.data; // Expected: { valid, discount, msg, promoDetails }
    } catch (error) {
        console.error('Error verifying promo code:', error.response?.data || error.message);
        // Throw the structured error from backend if available, or a generic error
        throw error.response?.data || new Error('Failed to verify promo code');
    }
};