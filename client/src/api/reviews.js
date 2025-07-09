// client/src/api/reviews.js
import axios from 'axios';

const MOVIE_API_URL = '/api/movies';
const REVIEW_API_URL = '/api/reviews';

/**
 * Fetches reviews for a specific movie.
 * @param {string} movieId - The ID of the movie.
 * @returns {Promise<Array>} - Promise resolving to an array of review objects.
 */
export const getReviewsForMovieApi = async (movieId) => {
    if (!movieId) throw new Error('Movie ID is required for fetching reviews');
    try {
        const response = await axios.get(`${MOVIE_API_URL}/${movieId}/reviews`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching reviews for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch reviews');
    }
};

/**
 * Creates a new review for a movie. Requires authentication.
 * @param {string} movieId - The ID of the movie being reviewed.
 * @param {object} reviewData - { rating: number, comment?: string }
 * @returns {Promise<object>} - The created review object.
 */
export const createReviewApi = async (movieId, reviewData) => {
    if (!movieId) throw new Error('Movie ID is required for creating a review');
    try {
        const response = await axios.post(`${MOVIE_API_URL}/${movieId}/reviews`, reviewData);
        return response.data;
    } catch (error) {
        console.error(`Error creating review for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create review');
    }
};

/**
 * Updates an existing review. Requires authentication.
 * @param {string} reviewId - The ID of the review to update.
 * @param {object} reviewData - { rating?: number, comment?: string }
 * @returns {Promise<object>} - The updated review object.
 */
export const updateReviewApi = async (reviewId, reviewData) => {
    if (!reviewId) throw new Error('Review ID is required for updating a review');
    try {
        const response = await axios.put(`${REVIEW_API_URL}/${reviewId}`, reviewData);
        return response.data;
    } catch (error) {
        console.error(`Error updating review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update review');
    }
};

/**
 * Deletes a review. Requires owner/admin/organizer authentication.
 * @param {string} reviewId - The ID of the review to delete.
 * @returns {Promise<object>} - Success message object.
 */
export const deleteReviewApi = async (reviewId) => {
    if (!reviewId) throw new Error('Review ID is required for deleting a review');
    try {
        const response = await axios.delete(`${REVIEW_API_URL}/${reviewId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete review');
    }
};

// --- NEW API FUNCTIONS ---

/**
 * Likes or unlikes a review. Requires authentication.
 * @param {string} reviewId - The ID of the review.
 * @returns {Promise<object>} - The updated review object with new like/dislike counts.
 */
export const likeReviewApi = async (reviewId) => {
    if (!reviewId) throw new Error('Review ID is required to like a review.');
    try {
        const response = await axios.put(`${REVIEW_API_URL}/${reviewId}/like`);
        return response.data;
    } catch (error) {
        console.error(`Error liking review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to like review');
    }
};

/**
 * Dislikes or un-dislikes a review. Requires authentication.
 * @param {string} reviewId - The ID of the review.
 * @returns {Promise<object>} - The updated review object with new like/dislike counts.
 */
export const dislikeReviewApi = async (reviewId) => {
    if (!reviewId) throw new Error('Review ID is required to dislike a review.');
    try {
        const response = await axios.put(`${REVIEW_API_URL}/${reviewId}/dislike`);
        return response.data;
    } catch (error) {
        console.error(`Error disliking review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to dislike review');
    }
};

/**
 * Reports a review. Requires authentication.
 * @param {string} reviewId - The ID of the review to report.
 * @param {string} reason - The reason for the report.
 * @returns {Promise<object>} - A success message.
 */
export const reportReviewApi = async (reviewId, reason) => {
    if (!reviewId || !reason) throw new Error('Review ID and a reason are required to report a review.');
    try {
        const response = await axios.post(`${REVIEW_API_URL}/${reviewId}/report`, { reason });
        return response.data;
    } catch (error) {
        console.error(`Error reporting review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to report review');
    }
};