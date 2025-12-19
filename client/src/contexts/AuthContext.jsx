// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../api/auth'; // Optional: Use if you have specific API calls here

// EXPORT 1: Named export for the Context itself (Fixes your error)
export const AuthContext = createContext();

// EXPORT 2: Named export for the Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Configure axios default header whenever token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
            fetchUser();
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            // Using the /api/auth/me endpoint you defined in backend
            const res = await axios.get('http://localhost:5001/api/auth/me'); 
            setUser(res.data);
            setIsAuthenticated(true);
        } catch (err) {
            console.error('Error fetching user', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (newToken, role) => {
        setToken(newToken);
        setIsAuthenticated(true);
        // User data will be fetched by the useEffect
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout, 
            loading, 
            isAuthenticated 
        }}>
            {children}
        </AuthContext.Provider>
    );
};