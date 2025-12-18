// client/src/api/search.js
import axios from 'axios';

const API_URL = '/api/search';

/**
 * Performs a global search across movies, events, venues.
 * @param {string} query - The search term.
 * @param {number} [limit=10] - Max results per category.
 * @returns {Promise<object>} - Object containing results: { query, results: { movies: [], events: [], venues: [] } }
 */
export const globalSearchApi = async (query, limit = 10) => {
    if (!query || query.trim().length < 2) {
        // You might want to throw an error or return a specific structure for short queries
        // For now, let's let the backend handle min query length if it has one.
    }
    try {
        const response = await axios.get(API_URL, { params: { q: query, limit } });
        return response.data;
    } catch (error) {
        console.error('Global Search API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Search failed');
    }
};