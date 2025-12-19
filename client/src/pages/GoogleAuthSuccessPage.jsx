// client/src/pages/GoogleAuthSuccessPage.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const GoogleAuthSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const { loadUser } = useAuth(); // We use loadUser to fetch profile immediately
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // 1. Save token
            localStorage.setItem('authToken', token);
            
            // 2. Trigger user load
            loadUser(token);

            // 3. Redirect to home or dashboard after a brief delay
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } else {
            // No token found, go back to login
            navigate('/login');
        }
    }, [searchParams, loadUser, navigate]);

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 2 
        }}>
            <CircularProgress size={60} color="primary" />
            <Typography variant="h5">Logging you in...</Typography>
            <Typography variant="body2" color="text.secondary">
                Please wait while we verify your Google account.
            </Typography>
        </Box>
    );
};

export default GoogleAuthSuccessPage;