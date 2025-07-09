// // client/src/contexts/AuthContext.jsx
// import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import { getMeApi, googleAuthApi } from '../api/auth';

// // Helper to set/remove the auth token for all axios requests and in localStorage
// const setAuthToken = (token) => {
//     if (token) {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//         localStorage.setItem('authToken', token);
//     } else {
//         delete axios.defaults.headers.common['Authorization'];
//         localStorage.removeItem('authToken');
//     }
// };

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [token, setToken] = useState(localStorage.getItem('authToken'));
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [isLoading, setIsLoading] = useState(true);
//     const [authError, setAuthError] = useState(null);

//     const logout = useCallback(() => {
//         setAuthToken(null);
//         setUser(null);
//         setToken(null);
//         setIsAuthenticated(false);
//         setAuthError(null);
//         setIsLoading(false);
//     }, []);

//     const loadUser = useCallback(async (currentToken) => {
//         if (!currentToken) {
//             setIsLoading(false);
//             return logout();
//         }
//         setAuthToken(currentToken);
//         setIsAuthenticated(true);
//         try {
//             const userData = await getMeApi();
//             setUser(userData);
//         } catch (error) {
//             console.error("Failed to load user:", error);
//             logout();
//         } finally {
//             setIsLoading(false);
//         }
//     }, [logout]);

//     useEffect(() => {
//         const storedToken = localStorage.getItem('authToken');
//         loadUser(storedToken);
//     }, [loadUser]);

//     const login = async (credentials) => {
//         setIsLoading(true);
//         setAuthError(null);
//         try {
//             const { data } = await loginUserApi(credentials);
//             setToken(data.token);
//             await loadUser(data.token);
//             return true;
//         } catch (error) {
//             setAuthError(error.response?.data?.msg || 'Login failed.');
//             logout();
//             // IMPORTANT: Re-throw the error so the LoginPage can catch it and handle redirection
//             throw error;
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const loginWithToken = async (newToken, userObject) => {
//         setIsLoading(true);
//         setAuthError(null);
//         try {
//             setAuthToken(newToken);
//             setToken(newToken);
//             setUser(userObject);
//             setIsAuthenticated(true);
//             return true;
//         } catch(e) {
//             setAuthError('Failed to process login token.');
//             logout();
//             return false;
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const googleLogin = async (credential) => {
//         setIsLoading(true);
//         setAuthError(null);
//         try {
//             const { data } = await googleAuthApi(credential);
//             return await loginWithToken(data.token, data.user);
//         } catch (error) {
//             setAuthError(error.response?.data?.msg || 'Google Sign-In failed.');
//             logout();
//             return false;
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // This is for traditional email/password registration, which now directs to OTP
//     const register = async (userData) => {
//         setIsLoading(true);
//         setAuthError(null);
//         try {
//             // Note: This flow is now handled by the registerAndSendEmailOtpApi directly from the RegisterPage
//             // This function can be kept for other potential registration methods or adapted.
//             // For now, the main logic is on the page itself.
//             return { success: true };
//         } catch (error) {
//             const errorMsg = error.response?.data?.msg || 'Registration failed.';
//             setAuthError(errorMsg);
//             return { success: false };
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const contextValue = {
//         user,
//         token,
//         isAuthenticated,
//         isLoading,
//         authError,
//         setAuthError,
//         login,
//         register,
//         logout,
//         loadUser,
//         googleLogin,
//         loginWithToken
//     };

//     return (
//         <AuthContext.Provider value={contextValue}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (context === undefined) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };


// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { loginUserApi, registerUserApi, getMeApi } from '../api/auth';

const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('authToken', token);
    } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('authToken');
    }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    const logout = useCallback(() => {
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
    }, []);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setAuthToken(token);
            try {
                const userData = await getMeApi();
                setUser(userData);
                setIsAuthenticated(true);
            } catch (error) {
                logout();
            }
        }
        setIsLoading(false);
    }, [logout]);

    useEffect(() => { loadUser(); }, [loadUser]);

    const login = async (credentials) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const data = await loginUserApi(credentials);
            setAuthToken(data.token);
            await loadUser();
            return true;
        } catch (error) {
            const errorMsg = error.response?.data?.errors?.[0]?.msg || 'Login failed.';
            setAuthError(errorMsg);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const data = await registerUserApi(userData);
            setAuthToken(data.token);
            await loadUser();
            return { success: true, isApproved: data.isApproved };
        } catch (error) {
            const errorMsg = error.response?.data?.errors?.[0]?.msg || 'Registration failed.';
            setAuthError(errorMsg);
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, authError, setAuthError, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);