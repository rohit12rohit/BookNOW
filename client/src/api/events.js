// client/src/api/events.js
import axios from 'axios';
const API_URL = '/api/events'; // Base URL for event routes

/**
 * Fetches events based on query parameters.
 * @param {object} params - E.g., { category, city, date, tag, status, sort, limit, page }
 * @returns {Promise<object>} - API response { success, count, total, pagination, data: [events] }
 */
export const getEventsApi = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch events');
  }
};

/**
 * Fetches details for a single event by ID.
 * @param {string} eventId - The ID of the event.
 * @returns {Promise<object>} - The event details object.
 */
export const getEventByIdApi = async (eventId) => {
  if (!eventId) throw new Error('Event ID is required');
  try {
      const response = await axios.get(`${API_URL}/${eventId}`);
      return response.data;
  } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch event details');
  }
};

// --- NEW FUNCTIONS FOR ADMIN/ORGANIZER MANAGEMENT ---

/**
 * Creates a new event. Requires admin/organizer authentication.
 * @param {object} eventData - Data for the new event.
 * @returns {Promise<object>} - The created event object.
 */
export const createEventApi = async (eventData) => {
    try {
        const response = await axios.post(API_URL, eventData);
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create event');
    }
};

/**
 * Updates an existing event. Requires admin/organizer authentication.
 * @param {string} eventId - The ID of the event to update.
 * @param {object} eventData - Updated data for the event.
 * @returns {Promise<object>} - The updated event object.
 */
export const updateEventApi = async (eventId, eventData) => {
    if (!eventId) throw new Error('Event ID is required for update');
    try {
        const response = await axios.put(`${API_URL}/${eventId}`, eventData);
        return response.data;
    } catch (error) {
        console.error(`Error updating event ${eventId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update event');
    }
};

/**
 * Deletes an event. Requires admin/organizer authentication.
 * @param {string} eventId - The ID of the event to delete.
 * @returns {Promise<object>} - Success response.
 */
export const deleteEventApi = async (eventId) => {
    if (!eventId) throw new Error('Event ID is required for deletion');
    try {
        const response = await axios.delete(`${API_URL}/${eventId}`);
        return response.data; // Expected: { success: true, msg: 'Event deleted successfully' }
    } catch (error) {
        console.error(`Error deleting event ${eventId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete event');
    }
};