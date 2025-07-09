    // client/src/api/movies.js
    import axios from 'axios';
    const API_URL = '/api/movies';
    /**
     * Fetches movies based on query parameters.
     * @param {object} params - Query parameters (e.g., { status: 'now_showing', limit: 8 })
     * @returns {Promise<object>} - Promise resolving to the API response data (including pagination and data array)
     */
    export const getMoviesApi = async (params = {}) => {
      try {
        // Use the full base URL
        const response = await axios.get(API_URL, { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching movies (Direct URL):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch movies');
      }
    };

    /**
     * Fetches details for a single movie by ID.
     * @param {string} movieId - The ID of the movie.
     * @returns {Promise<object>} - Promise resolving to the movie details object.
     */
    export const getMovieByIdApi = async (movieId) => {
        if (!movieId) throw new Error('Movie ID is required');
        try {
             // Construct the full URL
            const url = `${API_URL}/${movieId}`;
            console.log(`[getMovieByIdApi - Direct] Attempting fetch from: ${url}`); // Log the URL
            const response = await axios.get(url);
            return response.data; // Returns the movie object
        } catch (error) {
            console.error(`Error fetching movie ${movieId} (Direct URL):`, error.response?.data || error.message);
            // Check for CORS errors specifically if they appear now
            if (error.message.includes('Network Error') || error.message.includes('CORS')) {
                 console.error("CORS or Network Error detected! Ensure backend allows requests from frontend origin or that backend is running.");
            }
            throw error.response?.data || new Error('Failed to fetch movie details');
        }
    };
    /**
 * Creates a new movie. Requires admin/organizer authentication.
 * @param {object} movieData - Data for the new movie.
 * @returns {Promise<object>} - Promise resolving to the created movie object.
 */
export const createMovieApi = async (movieData) => {
    try {
        const response = await axios.post(API_URL, movieData);
        return response.data;
    } catch (error) {
        console.error('Error creating movie:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create movie');
    }
};

/**
 * Updates an existing movie. Requires admin/organizer authentication.
 * @param {string} movieId - The ID of the movie to update.
 * @param {object} movieData - Updated data for the movie.
 * @returns {Promise<object>} - Promise resolving to the updated movie object.
 */
export const updateMovieApi = async (movieId, movieData) => {
    if (!movieId) throw new Error('Movie ID is required for update');
    try {
        const response = await axios.put(`${API_URL}/${movieId}`, movieData);
        return response.data;
    } catch (error) {
        console.error(`Error updating movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update movie');
    }
};

/**
 * Deletes a movie. Requires admin authentication.
 * @param {string} movieId - The ID of the movie to delete.
 * @returns {Promise<object>} - Promise resolving to the success response.
 */
export const deleteMovieApi = async (movieId) => {
    if (!movieId) throw new Error('Movie ID is required for deletion');
    try {
        const response = await axios.delete(`${API_URL}/${movieId}`);
        return response.data; // Expected: { msg: 'Movie removed successfully' }
    } catch (error) {
        console.error(`Error deleting movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete movie');
    }
};