// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { loginUserApi, registerUserApi, getMeApi, googleLoginApi } from '../api/auth'; // Import from the file created above

// Helper to set Authorization header for Axios requests & manage localStorage
const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('authToken', token); // Save token
        console.log('Auth Token Set');
    } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('authToken'); // Remove token
        console.log('Auth Token Removed');
    }
};

// Create Context
const AuthContext = createContext(null);

// Create Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true); // Start loading until initial check is done
    const [authError, setAuthError] = useState(null);

    // Function to load user data based on token
    const loadUser = useCallback(async (currentToken) => {
        console.log('AuthProvider: loadUser called with token:', !!currentToken);
        if (!currentToken) {
            setIsLoading(false);
            logout(); // Ensure state is clean if no token
            return;
        }
        setAuthToken(currentToken);
        setIsAuthenticated(true);
        setIsLoading(true);
        try {
            const userData = await getMeApi(currentToken);
            setUser(userData);
            console.log("AuthProvider: User loaded successfully:", userData?.email);
        } catch (error) {
            console.error("AuthProvider: Failed to load user data (likely invalid/expired token):", error.message);
            logout(); // Clear state if token invalid
        } finally {
            setIsLoading(false);
        }
    }, []); // useCallback wraps loadUser

    // Initial load effect on component mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            setToken(token);
            loadUser(token);
            // navigate('/');
        } else {
            const storedToken = localStorage.getItem('authToken');
            console.log("AuthProvider: Initial mount check - Stored token found:", !!storedToken);
            loadUser(storedToken); // Attempt to load user if token exists
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount (loadUser is memoized)

    // Login function
    const login = async (credentials) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const data = await loginUserApi(credentials);
            setToken(data.token); // Set token in state first
            await loadUser(data.token); // Load user profile uses the token to set headers
            return true; // Success
        } catch (error) {
            const errorMsg = error.errors ? error.errors.map(e => e.msg).join(', ') : (error.message || 'Login failed.');
            setAuthError(errorMsg);
            logout(); // Clean up on failure
            return false; // Failure
        } finally {
            setIsLoading(false);
        }
    };

    // Google Login function
    const googleLogin = () => {
        googleLoginApi();
    };


    // Register function
    const register = async (userData) => {
         setIsLoading(true);
         setAuthError(null);
         try {
            const data = await registerUserApi(userData);
            setToken(data.token);
            await loadUser(data.token); // Automatically login and load user
             return { success: true, isApproved: data.isApproved }; // Return success and approval status
         } catch (error) {
             const errorMsg = error.errors ? error.errors.map(e => e.msg).join(', ') : (error.message || 'Registration failed.');
             setAuthError(errorMsg);
             logout(); // Clean up on failure
             return { success: false };
         } finally {
             setIsLoading(false);
         }
    };

    // Logout function
    const logout = () => {
        setAuthToken(null); // Clear token/header/localStorage
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoading(false);
        console.log("AuthProvider: User logged out");
    };

    // Provide state and functions to consuming components
    const contextValue = {
        user,
        token,
        isAuthenticated,
        isLoading,
        authError,
        setAuthError, // Allow components to clear error messages
        login,
        googleLogin,
        register,
        logout,
        loadUser // Could be useful if token needs manual refresh check elsewhere
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {/* Don't render children until initial auth check is complete */}
            {/*!isLoading ? children : <div>Loading Application...</div> */}
             {/* Render children immediately, components can check isLoading themselves */}
             {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};