// client/src/api/settings.js
// Handles API calls related to application settings.
import axios from 'axios';

const API_URL = '/api/settings';

/**
 * Fetches a specific setting by its name.
 * @param {string} settingName - The name of the setting (e.g., 'GST_RATE').
 * @returns {Promise<object>} - Promise resolving to the setting object.
 */
export const getSettingApi = async (settingName) => {
    if (!settingName) throw new Error('Setting name is required.');
    try {
        const response = await axios.get(`${API_URL}/${settingName}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching setting '${settingName}':`, error.response?.data || error.message);
        throw error.response?.data || new Error(`Failed to fetch setting '${settingName}'`);
    }
};

/**
 * Updates a specific setting by its name. (Admin Only)
 * @param {string} settingName - The name of the setting.
 * @param {object} settingData - The data to update (e.g., { value: 18, description: '...' }).
 * @returns {Promise<object>} - Promise resolving to the updated setting object.
 */
export const updateSettingApi = async (settingName, settingData) => {
    if (!settingName) throw new Error('Setting name is required for update.');
    try {
        const response = await axios.put(`${API_URL}/${settingName}`, settingData);
        return response.data;
    } catch (error) {
        console.error(`Error updating setting '${settingName}':`, error.response?.data || error.message);
        throw error.response?.data || new Error(`Failed to update setting '${settingName}'`);
    }
};

// You might also want a function to get all settings (for admin dashboard)
export const getAllSettingsApi = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching all settings:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch all settings');
    }
};