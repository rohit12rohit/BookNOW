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
        const response = await axios.get(`${MOVIE_API_URL}/${movieId}/reviews`);
        return response.data; // Returns array of reviews
    } catch (error) {
        console.error(`Error fetching reviews for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch reviews');
    }
};

/**
 * Creates a new review for a movie.
 * Requires user authentication.
 * @param {string} movieId - The ID of the movie being reviewed.
 * @param {object} reviewData - { rating: number, comment?: string }
 * @returns {Promise<object>} - The created review object.
 */
export const createReviewApi = async (movieId, reviewData) => {
    if (!movieId) throw new Error('Movie ID is required for creating a review');
    try {
        // POST /api/movies/:movieId/reviews
        const response = await axios.post(`${MOVIE_API_URL}/${movieId}/reviews`, reviewData);
        return response.data;
    } catch (error) {
        console.error(`Error creating review for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create review');
    }
};

/**
 * Updates an existing review.
 * Requires user authentication (and ownership of the review).
 * @param {string} reviewId - The ID of the review to update.
 * @param {object} reviewData - { rating?: number, comment?: string } (fields to update)
 * @returns {Promise<object>} - The updated review object.
 */
export const updateReviewApi = async (reviewId, reviewData) => {
    if (!reviewId) throw new Error('Review ID is required for updating a review');
    try {
        // PUT /api/reviews/:reviewId
        const response = await axios.put(`${REVIEW_API_URL}/${reviewId}`, reviewData);
        return response.data;
    } catch (error) {
        console.error(`Error updating review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update review');
    }
};

/**
 * Deletes a review.
 * Requires user authentication (and ownership of the review, or admin role).
 * @param {string} reviewId - The ID of the review to delete.
 * @returns {Promise<object>} - Success message object.
 */
export const deleteReviewApi = async (reviewId) => {
    if (!reviewId) throw new Error('Review ID is required for deleting a review');
    try {
        // DELETE /api/reviews/:reviewId
        const response = await axios.delete(`${REVIEW_API_URL}/${reviewId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete review');
    }
};