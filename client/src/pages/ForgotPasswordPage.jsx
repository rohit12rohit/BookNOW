// client/src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { forgotPasswordApi } from '../api/auth';
// MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(''); // For success/info messages
    const [error, setError] = useState(''); // For error messages
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setError(''); // Clear error on change
        setMessage(''); // Clear message on change
        setEmail(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!email) {
            setError("Please enter your email address.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await forgotPasswordApi(email);
            // Backend always returns success for security, show the message it sends
            setMessage(response.data || 'Password reset instructions have been sent if the email is registered.');
            setEmail(''); // Clear input field on success
        } catch (err) {
            // Show specific error from API if available, otherwise generic
            setError(err?.response?.data?.msg || err.message || 'Failed to send reset request.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" gutterBottom>
                    Forgot Password
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                    Enter your email address and we'll send you a link to reset your password.
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
                    {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="error"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                    </Button>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/login" variant="body2" color="error">
                            {"Remembered? Back to Login"}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default ForgotPasswordPage;
