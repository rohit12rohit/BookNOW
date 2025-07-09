// // // client/src/api/auth.js
// // // Purpose: Functions to interact with the backend authentication API endpoints.

// // import axios from 'axios';

// // // Base URL for auth calls (proxied by Vite during development)
// // const API_URL = '/api/auth';

// // /**
// //  * Registers a new user or organizer.
// //  * @param {object} userData - { name, email, password, role (optional), organizationName (optional) }
// //  * @returns {Promise<object>} - Promise resolving to response data { token, role, isApproved }
// //  */
// // export const registerUserApi = async (userData) => {
// //     try {
// //         const response = await axios.post(`${API_URL}/register`, userData);
// //         return response.data;
// //     } catch (error) {
// //         console.error('Registration API error:', error.response?.data || error.message);
// //         throw error.response?.data || new Error('Registration failed');
// //     }
// // };

// // /**
// //  * Logs in a user.
// //  * @param {object} credentials - { email, password }
// //  * @returns {Promise<object>} - Promise resolving to response data { token, role }
// //  */
// // export const loginUserApi = async (credentials) => {
// //     try {
// //         const response = await axios.post(`${API_URL}/login`, credentials);
// //         return response.data;
// //     } catch (error) {
// //         console.error('Login API error:', error.response?.data || error.message);
// //         throw error.response?.data || new Error('Login failed');
// //     }
// // };

// // /**
// //  * Fetches the profile of the currently logged-in user.
// //  * Requires auth token to be set in request headers.
// //  * @param {string} token - The JWT auth token.
// //  * @returns {Promise<object>} - Promise resolving to user profile data.
// //  */
// // export const getMeApi = async (token) => {
// //      if (!token) throw new Error('No token provided for getMe');
// //      try {
// //         const config = {
// //             headers: { 'Authorization': `Bearer ${token}` } // Use Bearer token standard
// //         };
// //         const response = await axios.get(`${API_URL}/me`, config);
// //         return response.data;
// //     } catch (error) {
// //         console.error('GetMe API error:', error.response?.data || error.message);
// //         if (error.response?.status === 401) {
// //              console.log("Token likely expired or invalid during getMe.");
// //         }
// //         throw error.response?.data || new Error('Failed to fetch profile');
// //     }
// // };
// // /**
// //  * Sends a password reset request to the backend.
// //  * @param {string} email - The user's email address.
// //  * @returns {Promise<object>} - Promise resolving to the backend success response.
// //  */
// // export const forgotPasswordApi = async (email) => {
// //     try {
// //         const response = await axios.post(`${API_URL}/forgotpassword`, { email });
// //         // Backend sends { success: true, data: "message..." }
// //         return response.data;
// //     } catch (error) {
// //         console.error('Forgot Password API error:', error.response?.data || error.message);
// //         throw error.response?.data || new Error('Failed to send password reset request');
// //     }
// // };

// // export const resetPasswordApi = async (resetToken, password) => {
// //     if (!resetToken) throw new Error('Reset token is required');
// //     try {
// //         // PUT /api/auth/resetpassword/:resettoken
// //         const response = await axios.put(`${API_URL}/resetpassword/${resetToken}`, { password });
// //         // Backend sends { success: true, msg: "..." }
// //         return response.data;
// //     } catch (error) {
// //         console.error('Reset Password API error:', error.response?.data || error.message);
// //         throw error.response?.data || new Error('Failed to reset password');
// //     }
// // };

// // /**
// //  * Sends a request to the backend to send an OTP to a mobile number.
// //  * @param {string} mobileNumber - The user's 10-digit mobile number.
// //  * @returns {Promise<object>} - Promise resolving to the backend success response.
// //  */
// // export const sendLoginOtpApi = async (mobileNumber) => {
// //     try {
// //         const response = await axios.post(`${API_URL}/login/mobile/send-otp`, { mobileNumber });
// //         return response.data;
// //     } catch (error) {
// //         console.error('Send OTP API error:', error.response?.data || error.message);
// //         throw error.response?.data || new Error('Failed to send OTP');
// //     }
// // };

// // /**
// //  * Sends the mobile number and OTP to the backend for verification and login.
// //  * @param {string} mobileNumber - The user's mobile number.
// //  * @param {string} otp - The 6-digit OTP received by the user.
// //  * @returns {Promise<object>} - Promise resolving to response data { token, role }
// //  */
// // export const verifyLoginOtpApi = async (mobileNumber, otp) => {
// //     try {
// //         const response = await axios.post(`${API_URL}/login/mobile/verify-otp`, { mobileNumber, otp });
// //         return response.data;
// //     } catch (error) {
// //         console.error('Verify OTP API error:', error.response?.data || error.message);
// //         throw error.response?.data || new Error('OTP verification failed');
// //     }
// // };

// // client/src/api/auth.js
// import axios from 'axios';
// const API_URL = '/api/auth';

// export const checkUserApi = (identifier) => axios.post(`${API_URL}/check-user`, { identifier });
// export const loginUserApi = (credentials) => axios.post(`${API_URL}/login`, credentials);
// export const sendOtpApi = (data) => axios.post(`${API_URL}/send-otp`, data);
// export const registerAndSendEmailOtpApi = (data) => axios.post(`${API_URL}/register-send-otp`, data);
// export const verifyOtpApi = (data) => axios.post(`${API_URL}/verify-otp`, data);
// export const googleAuthApi = (credential) => axios.post(`${API_URL}/google`, { credential });
// export const completeProfileApi = (data) => axios.put(`${API_URL}/me/complete-profile`, data);
// export const getMeApi = () => axios.get(`${API_URL}/me`);


// // @desc    Request a password reset link
// export const forgotPasswordApi = async (email) => {
//     try {
//         const response = await axios.post(`${API_URL}/forgotpassword`, { email });
//         return response.data;
//     } catch (error) {
//         console.error('Forgot Password API error:', error.response?.data || error.message);
//         throw error.response?.data || new Error('Failed to send password reset request');
//     }
// };

// // @desc    Reset password using a token
// export const resetPasswordApi = async (resetToken, password) => {
//     if (!resetToken) throw new Error('Reset token is required');
//     try {
//         const response = await axios.put(`${API_URL}/resetpassword/${resetToken}`, { password });
//         return response.data;
//     } catch (error) {
//         console.error('Reset Password API error:', error.response?.data || error.message);
//         throw error.response?.data || new Error('Failed to reset password');
//     }
// };


// client/src/api/auth.js
import axios from 'axios';

const API_URL = '/api/auth';

export const registerUserApi = async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

export const loginUserApi = async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
};

export const getMeApi = async () => {
    const response = await axios.get(`${API_URL}/me`);
    return response.data;
};

export const forgotPasswordApi = async (email) => {
    const response = await axios.post(`${API_URL}/forgotpassword`, { email });
    return response.data;
};

export const resetPasswordApi = async (resetToken, password) => {
    const response = await axios.put(`${API_URL}/resetpassword/${resetToken}`, { password });
    return response.data;
};