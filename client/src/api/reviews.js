// File: /client/src/api/reviews.js
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
 * Creates a new review for a movie. Requires user authentication.
 * @param {string} movieId - The ID of the movie being reviewed.
 * @param {object} reviewData - { rating, comment }
 * @returns {Promise<object>} - The created review object.
 */
export const createReviewApi = async (movieId, reviewData) => {
    if (!movieId) throw new Error('Movie ID is required to create a review');
    try {
        const response = await axios.post(`${MOVIE_API_URL}/${movieId}/reviews`, reviewData);
        return response.data;
    } catch (error) {
        console.error(`Error creating review for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to submit review');
    }
};

/**
 * Likes a review. Requires authentication.
 * @param {string} reviewId - The ID of the review to like.
 * @returns {Promise<object>} - { likes: count, dislikes: count }
 */
export const likeReviewApi = async (reviewId) => {
    if (!reviewId) throw new Error('Review ID is required');
    try {
        const response = await axios.post(`${REVIEW_API_URL}/${reviewId}/like`);
        return response.data;
    } catch (error) {
        console.error(`Error liking review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to like review');
    }
};

/**
 * Dislikes a review. Requires authentication.
 * @param {string} reviewId - The ID of the review to dislike.
 * @returns {Promise<object>} - { likes: count, dislikes: count }
 */
export const dislikeReviewApi = async (reviewId) => {
    if (!reviewId) throw new Error('Review ID is required');
    try {
        const response = await axios.post(`${REVIEW_API_URL}/${reviewId}/dislike`);
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
 * @returns {Promise<object>} - Success message.
 */
export const reportReviewApi = async (reviewId, reason) => {
    if (!reviewId || !reason) throw new Error('Review ID and reason are required');
    try {
        const response = await axios.post(`${REVIEW_API_URL}/${reviewId}/report`, { reason });
        return response.data;
    } catch (error) {
        console.error(`Error reporting review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to report review');
    }
};

/**
 * Fetches reviews for the currently logged-in user.
 * @returns {Promise<Array>} - An array of review objects.
 */
export const getMyReviewsApi = async () => {
    try {
        const response = await axios.get(`${REVIEW_API_URL}/me`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Get My Reviews API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch your reviews');
    }
};