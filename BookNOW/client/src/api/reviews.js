// client/src/api/reviews.js
import axios from 'axios';

// Note: Reviews are nested under movies for fetching
const MOVIE_API_URL = '/api/movies';
const REVIEW_API_URL = '/api/reviews'; // For managing own reviews later

/**
 * Fetches reviews for a specific movie.
 * @param {string} movieId - The ID of the movie.
 * @returns {Promise<Array>} - Promise resolving to an array of review objects.
 */
export const getReviewsForMovieApi = async (movieId) => {
    if (!movieId) throw new Error('Movie ID is required for fetching reviews');
    try {
        // GET /api/movies/:movieId/reviews
        const response = await axios.get(`<span class="math-inline">\{MOVIE\_API\_URL\}/</span>{movieId}/reviews`);
        return response.data; // Returns array of reviews
    } catch (error) {
        console.error(`Error fetching reviews for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch reviews');
    }
};

// Add create/update/delete review API calls later