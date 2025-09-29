// client/src/api/admin.js
import axios from 'axios';

const API_URL = '/api/admin'; // Base URL for admin routes

// --- User Management ---
export const getAllUsersAdminApi = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/users`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching all users (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch users');
    }
};

export const approveOrganizerAdminApi = async (organizerId) => {
    if (!organizerId) throw new Error('Organizer ID is required for approval');
    try {
        const response = await axios.put(`${API_URL}/organizers/${organizerId}/approve`);
        return response.data;
    } catch (error) {
        console.error(`Error approving organizer ${organizerId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to approve organizer');
    }
};

export const updateUserAdminApi = async (userId, userData) => {
    try {
        const response = await axios.put(`${API_URL}/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update user');
    }
};

export const deleteUserAdminApi = async (userId) => {
    try {
        const response = await axios.delete(`${API_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting user ${userId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete user');
    }
};

// --- Promo Code Management API Functions ---
export const getAllPromoCodesAdminApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/promocodes`);
        return response.data;
    } catch (error) {
        console.error('Error fetching promo codes (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch promo codes');
    }
};

export const createPromoCodeAdminApi = async (promoCodeData) => {
    try {
        const response = await axios.post(`${API_URL}/promocodes`, promoCodeData);
        return response.data;
    } catch (error) {
        console.error('Error creating promo code (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create promo code');
    }
};

export const updatePromoCodeAdminApi = async (promoCodeId, promoCodeData) => {
    try {
        const response = await axios.put(`${API_URL}/promocodes/${promoCodeId}`, promoCodeData);
        return response.data;
    } catch (error) {
        console.error(`Error updating promo code ${promoCodeId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update promo code');
    }
};

export const deletePromoCodeAdminApi = async (promoCodeId) => {
    try {
        const response = await axios.delete(`${API_URL}/promocodes/${promoCodeId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting promo code ${promoCodeId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete promo code');
    }
};

// --- City Management API Functions ---
export const getAllCitiesAdminApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/cities`);
        return response.data;
    } catch (error) {
        console.error('Error fetching cities (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch cities');
    }
};

export const createCityAdminApi = async (cityData) => {
    try {
        const response = await axios.post(`${API_URL}/cities`, cityData);
        return response.data;
    } catch (error) {
        console.error('Error creating city (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create city');
    }
};

export const updateCityAdminApi = async (cityId, cityData) => {
    try {
        const response = await axios.put(`${API_URL}/cities/${cityId}`, cityData);
        return response.data;
    } catch (error) {
        console.error(`Error updating city ${cityId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update city');
    }
};

export const deleteCityAdminApi = async (cityId) => {
    try {
        const response = await axios.delete(`${API_URL}/cities/${cityId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting city ${cityId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete city');
    }
};

/**
 * Fetches all venues for admin, potentially including inactive ones.
 * @param {object} params - Optional query params, e.g., { page, limit, status: 'all' }
 * @returns {Promise<object>} - Promise resolving to an array of venue objects and pagination.
 */
export const getAllVenuesAdminApi = async (params = { status: 'all', limit: 100 }) => { // Default to fetching all with a high limit
    try {
        // Admins might use the general /api/venues endpoint,
        // but the backend controller for that endpoint would need to be aware of the admin role
        // to return all venues (active and inactive).
        // Alternatively, a dedicated /api/admin/venues endpoint could be created.
        // For now, let's assume /api/venues can handle an admin request appropriately.
        const response = await axios.get(`/api/venues`, { params }); // Using the public venue route
        return response.data;
    } catch (error) {
        console.error('Error fetching all venues (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch venues for admin');
    }
};

// --- Venue Management API Functions (for Admin) ---

/**
 * Updates a venue (specifically for an admin, e.g., changing isActive status).
 * @param {string} venueId - The ID of the venue to update.
 * @param {object} venueData - Data to update (e.g., { isActive: false }).
 * @returns {Promise<object>} - Promise resolving to the updated venue object.
 */
export const updateVenueAdminApi = async (venueId, venueData) => {
    if (!venueId) throw new Error('Venue ID is required for update');
    try {
        // Admin uses the general PUT /api/venues/:id route.
        // The backend's roleMiddleware (isOrganizerOrAdmin) and venueController
        // should allow an admin to update any venue.
        const response = await axios.put(`/api/venues/${venueId}`, venueData);
        return response.data;
    } catch (error) {
        console.error(`Error updating venue ${venueId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update venue');
    }
};

// Note: Deleting venues by admin should be handled carefully.
// The existing DELETE /api/venues/:id is protected by isOrganizerOrAdmin,
// and the controller has an ownership check OR admin check.
// So, an admin *can* delete venues using a generic deleteVenueApi if you add one to client/src/api/venues.js
// For this component, we'll focus on activate/deactivate.

// --- Booking Management API Functions (for Admin) ---

/**
 * Fetches all bookings for admin, with pagination and filtering.
 * @param {object} params - E.g., { userId, showtimeId, movieId, eventId, venueId, date, status, page, limit, sort }
 * @returns {Promise<object>} - Promise resolving to an object containing bookings array and pagination info.
 */
export const getAllBookingsAdminApi = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/bookings`, { params });
        return response.data; // Expected: { success, count, total, pagination, data: [bookings] }
    } catch (error) {
        console.error('Error fetching all bookings (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch bookings for admin');
    }
};

/**
 * Fetches a single booking by its ID (Admin access).
 * @param {string} bookingId - The ID of the booking.
 * @returns {Promise<object>} - Promise resolving to the booking object.
 */
export const getBookingByIdAdminApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required');
    try {
        const response = await axios.get(`${API_URL}/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching booking ${bookingId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch booking details for admin');
    }
};

/**
 * Cancels any booking by its ID (Admin action).
 * @param {string} bookingId - The ID of the booking to cancel.
 * @returns {Promise<object>} - Promise resolving to the success response.
 */
export const cancelAnyBookingAdminApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required for cancellation');
    try {
        const response = await axios.put(`${API_URL}/bookings/${bookingId}/cancel`);
        return response.data; // Expected: { success: true, msg: '...', booking: {...} }
    } catch (error) {
        console.error(`Error cancelling booking ${bookingId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to cancel booking as admin');
    }
};

// --- Platform Statistics API Function ---

/**
 * Fetches platform-wide statistics. Requires admin authentication.
 * @returns {Promise<object>} - Promise resolving to the statistics object.
 */
export const getPlatformStatsAdminApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data; // Expected: { success: true, stats: { users: {...}, content: {...}, ... } }
    } catch (error) {
        console.error('Error fetching platform stats (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch platform statistics');
    }
};

/**
 * Fetches a single user by ID. Requires admin authentication.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<object>} - Promise resolving to the user object.
 */
export const getUserByIdAdminApi = async (userId) => {
    if (!userId) throw new Error('User ID is required');
    try {
        const response = await axios.get(`${API_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching user ${userId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch user details');
    }
};


/**
 * Fetches all reviews with pending reports. Requires admin authentication.
 * @returns {Promise<Array>} - Promise resolving to an array of review objects with report details.
 */
export const getReportedReviewsAdminApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/reviews/reported`);
        return response.data;
    } catch (error) {
        console.error('Error fetching reported reviews (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch reported reviews');
    }
};

/**
 * Resolves a report on a review. Requires admin authentication.
 * @param {string} reviewId - The ID of the review to resolve.
 * @param {string} action - The action to take ('delete' or 'dismiss').
 * @returns {Promise<object>} - Promise resolving to the success response.
 */
export const resolveReportAdminApi = async (reviewId, action) => {
    if (!reviewId || !action) throw new Error('Review ID and action are required');
    try {
        const response = await axios.put(`${API_URL}/reviews/${reviewId}/resolve`, { action });
        return response.data;
    } catch (error) {
        console.error(`Error resolving report for review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to resolve report');
    }
};
