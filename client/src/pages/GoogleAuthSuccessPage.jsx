// client/src/pages/GoogleAuthSuccessPage.jsx
import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const GoogleAuthSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Decode token to get role (optional, or just pass generic role until profile fetch)
            // For simplicity, we just save token. AuthContext usually fetches profile after.
            login(token, 'user'); // Defaulting role, Context will update on fetchMe
            
            // Redirect after short delay to show the "Success" screen
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } else {
            navigate('/login');
        }
    }, [searchParams, login, navigate]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Google Login Successful!</h2>
            <p>Redirecting you to the dashboard...</p>
            <div className="spinner"></div> 
        </div>
    );
};

export default GoogleAuthSuccessPage;