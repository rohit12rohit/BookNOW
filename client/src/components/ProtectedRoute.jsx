// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * A wrapper component to protect routes based on authentication status and optionally user roles.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The component to render if authorized.
 * @param {string[]} [props.allowedRoles] - Optional array of roles allowed to access the route (e.g., ['admin', 'organizer']). If omitted, only checks if authenticated.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation(); // Get current location to redirect back after login

    console.log('[ProtectedRoute] Checking auth:', { isLoading, isAuthenticated, userRole: user?.role });

    // 1. Show loading indicator while auth state is being determined
    if (isLoading) {
        console.log('[ProtectedRoute] Auth state loading...');
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress color="error" />
            </Box>
        );
    }

    // 2. Redirect to login if not authenticated
    if (!isAuthenticated) {
        console.log('[ProtectedRoute] Not authenticated, redirecting to login.');
        // Pass the current location user tried to access in state
        // So login page can redirect back after successful login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Check roles if allowedRoles prop is provided
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user?.role; // Get role from user object in context
        if (!userRole || !allowedRoles.includes(userRole)) {
            // User is authenticated but doesn't have the required role
            console.log(`[ProtectedRoute] Role mismatch. User role: ${userRole}, Allowed: ${allowedRoles.join(',')}. Redirecting to home.`);
            // Redirect to home page or an 'Unauthorized' page
            // For simplicity, redirecting home for now
            return <Navigate to="/" replace />;
            // Alternatively, render an Unauthorized component:
            // return <UnauthorizedPage />;
        }
         console.log(`[ProtectedRoute] Role check passed. User role: ${userRole}`);
    }

    // 4. If authenticated (and role check passes, if applicable), render the child component
    console.log('[ProtectedRoute] Access granted.');
    return children;
};

export default ProtectedRoute;
