// client/src/pages/OtpPage.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { verifyOtpApi } from '../api/auth';
import { Container, Box, TextField, Button, Typography, Alert, CircularProgress, Paper } from '@mui/material';

const OtpPage = () => {
    const { state } = useLocation();
    const identifier = state?.identifier;
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithToken } = useAuth();
    const navigate = useNavigate();

    const handleVerify = async () => {
        if (!otp || otp.length !== 6) return setError('Please enter the 6-digit OTP.');
        setError(''); setIsLoading(true);
        try {
            const { data } = await verifyOtpApi({ identifier, otp });
            const success = await loginWithToken(data.token, data.user);
            if (success) {
                // Navigate to complete profile if needed, otherwise home
                navigate(data.user && !data.user.isVerified ? '/complete-profile' : '/');
            } else {
                setError('Login failed after OTP verification.');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid OTP.');
        } finally { setIsLoading(false); }
    };

    if (!identifier) {
        return <Container><Alert severity="error">Identifier missing. Please start login again.</Alert></Container>
    }

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Typography component="h1" variant="h5">Verify Your Identity</Typography>
                <Typography sx={{ my: 2 }}>An OTP has been sent to {identifier}.</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField margin="normal" required fullWidth label="6-Digit OTP" value={otp} onChange={e => setOtp(e.target.value)} />
                <Button fullWidth variant="contained" color="error" sx={{ mt: 2 }} disabled={isLoading} onClick={handleVerify}>
                    {isLoading ? <CircularProgress size={24} /> : 'Verify & Login'}
                </Button>
            </Paper>
        </Container>
    );
};

export default OtpPage;