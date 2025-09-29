// // client/src/api/showtimes.js
// // Handles API calls related to showtimes.
// import axios from 'axios';
// const API_URL = '/api/showtimes';

// /**
//  * Fetches showtimes based on query parameters.
//  * @param {object} params - Query params { movieId, eventId, venueId, date (YYYY-MM-DD), sort, limit, page }
//  * @returns {Promise<object>} - Promise resolving to API response { success, count, ..., data: [showtimes] }
//  */
// export const getShowtimesApi = async (params = {}) => {
//     try {
//         const response = await axios.get(API_URL, { params });
//         return response.data; // Returns the full response object
//     } catch (error) {
//          console.error('Error fetching showtimes:', error.response?.data || error.message);
//          throw error.response?.data || new Error('Failed to fetch showtimes');
//     }
// };

// /**
//  * Fetches the seat map layout and booked status for a specific showtime.
//  * @param {string} showtimeId - The ID of the showtime.
//  * @returns {Promise<object>} - Promise resolving to the seat map data object.
//  */
// export const getShowtimeSeatmapApi = async (showtimeId) => {
//     if (!showtimeId) throw new Error('Showtime ID is required for fetching seat map');
//     try {
//         // GET /api/showtimes/:showtimeId/seatmap
//         const response = await axios.get(`${API_URL}/${showtimeId}/seatmap`);
//         return response.data; // Returns { showtimeId, screenId, screenName, layout: { rows: [...] } }
//     } catch (error) {
//         console.error(`Error fetching seat map for showtime ${showtimeId}:`, error.response?.data || error.message);
//         throw error.response?.data || new Error('Failed to fetch seat map');
//     }
// };

// // --- ADD THIS FUNCTION ---
// /**
//  * Fetches details for a single showtime by ID.
//  * @param {string} showtimeId - The ID of the showtime.
//  * @returns {Promise<object>} - Promise resolving to the showtime details object.
//  */
// export const getShowtimeByIdApi = async (showtimeId) => {
//     if (!showtimeId) throw new Error('Showtime ID is required');
//     try {
//         // GET /api/showtimes/:showtimeId
//         const response = await axios.get(`${API_URL}/${showtimeId}`);
//         return response.data; // Returns the populated showtime object
//     } catch (error) {
//         console.error(`Error fetching showtime ${showtimeId}:`, error.response?.data || error.message);
//         throw error.response?.data || new Error('Failed to fetch showtime details');
//     }
// };
// // --- END ADDITION ---

// client/src/api/showtimes.js
// Handles API calls related to showtimes.
import axios from 'axios';
const API_URL = '/api/showtimes'; // Base URL for showtime endpoints

/**
 * Fetches showtimes based on query parameters.
 * @param {object} params - Query params { movieId, eventId, venueId, date (YYYY-MM-DD), sort, limit, page }
 * @returns {Promise<object>} - Promise resolving to API response { success, count, ..., data: [showtimes] }
 */
export const getShowtimesApi = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data; // Returns the full response object
    } catch (error) {
         console.error('Error fetching showtimes:', error.response?.data || error.message);
         throw error.response?.data || new Error('Failed to fetch showtimes');
    }
};

/**
 * Fetches the seat map layout and booked status for a specific showtime.
 * @param {string} showtimeId - The ID of the showtime.
 * @returns {Promise<object>} - Promise resolving to the seat map data object.
 */
export const getShowtimeSeatmapApi = async (showtimeId) => {
    if (!showtimeId) throw new Error('Showtime ID is required for fetching seat map');
    try {
        // GET /api/showtimes/:showtimeId/seatmap
        const url = `${API_URL}/${showtimeId}/seatmap`;
        console.log(`[getShowtimeSeatmapApi] Fetching from: ${url}`); // Log URL
        const response = await axios.get(url);
        console.log(`[getShowtimeSeatmapApi] Response for ${showtimeId}:`, response.data); // Log response data
        // Expected response: { showtimeId, screenId, screenName, layout: { rows: [...] } }
        return response.data;
    } catch (error) {
        console.error(`Error fetching seat map for showtime ${showtimeId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch seat map');
    }
};

/**
 * Fetches details for a single showtime by ID.
 * @param {string} showtimeId - The ID of the showtime.
 * @returns {Promise<object>} - Promise resolving to the showtime details object.
 */
export const getShowtimeByIdApi = async (showtimeId) => {
    if (!showtimeId) throw new Error('Showtime ID is required');
    try {
        // GET /api/showtimes/:showtimeId
        const url = `${API_URL}/${showtimeId}`;
        console.log(`[getShowtimeByIdApi] Fetching from: ${url}`); // Log URL
        const response = await axios.get(url);
        console.log(`[getShowtimeByIdApi] Response for ${showtimeId}:`, response.data); // Log response data
        return response.data; // Returns the populated showtime object
    } catch (error) {
        console.error(`Error fetching showtime ${showtimeId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch showtime details');
    }
};


// --- Functions for Organizer/Admin Showtime Management ---

/**
 * Creates a new showtime. Requires Organizer/Admin authentication.
 * Token is expected to be set in axios default headers by AuthContext.
 * @param {object} showtimeData - Data for the new showtime { movie, venue, screenId, startTime, price, event? }.
 * @returns {Promise<object>} - The created showtime object.
 */
export const createShowtimeApi = async (showtimeData) => {
    try {
        const response = await axios.post(API_URL, showtimeData);
        return response.data;
    } catch (error) {
        console.error('Error creating showtime:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create showtime');
    }
};

/**
 * Updates an existing showtime. Requires Organizer (owner) / Admin authentication.
 * @param {string} showtimeId
 * @param {object} showtimeData - Fields to update (e.g., startTime, price, isActive).
 * @returns {Promise<object>} - The updated showtime object.
 */
export const updateShowtimeApi = async (showtimeId, showtimeData) => {
    if (!showtimeId) throw new Error('Showtime ID is required for update');
    try {
        const response = await axios.put(`${API_URL}/${showtimeId}`, showtimeData);
        return response.data;
    } catch (error) {
        console.error(`Error updating showtime ${showtimeId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update showtime');
    }
};

/**
 * Deletes (or deactivates) a showtime. Requires Organizer (owner) / Admin authentication.
 * @param {string} showtimeId
 * @returns {Promise<object>} - Success message.
 */
export const deleteShowtimeApi = async (showtimeId) => {
    if (!showtimeId) throw new Error('Showtime ID is required for deletion');
    try {
        const response = await axios.delete(`${API_URL}/${showtimeId}`);
        return response.data; // Expected: { msg: 'Showtime deactivated/deleted successfully' }
    } catch (error) {
        console.error(`Error deleting showtime ${showtimeId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete showtime');
    }
};