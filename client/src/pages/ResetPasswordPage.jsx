// client/src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { resetPasswordApi } from '../api/auth';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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

const ResetPasswordPage = () => {
    const { resettoken } = useParams(); // Get token from URL parameter
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Optional: Verify token validity on load? (Backend does this on submit anyway)
    useEffect(() => {
        if (!resettoken) {
            setError("Invalid or missing password reset token.");
        }
    }, [resettoken]);

    const handleChange = (e) => {
        setError(''); // Clear errors on change
        setMessage('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!resettoken) {
            setError("Invalid or missing password reset token.");
            return;
        }
        if (!formData.password || !formData.confirmPassword) {
            setError("Please enter and confirm your new password.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (formData.password.length < 6) {
             setError("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await resetPasswordApi(resettoken, formData.password);
            setMessage(response.msg || 'Password reset successfully! You can now log in.');
            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 3000); // 3 second delay

        } catch (err) {
            setError(err?.response?.data?.msg || err.message || 'Failed to reset password. The link may be invalid or expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" gutterBottom>
                    Reset Password
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
                    {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="New Password"
                        type="password"
                        id="password"
                        inputProps={{ minLength: 6 }}
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading || !!message} // Disable if loading or success message shown
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm New Password"
                        type="password"
                        id="confirmPassword"
                        inputProps={{ minLength: 6 }}
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading || !!message}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="error"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={isLoading || !!message || !resettoken} // Disable if loading, success, or no token
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                    </Button>
                     {message && ( // Show login link only after success
                         <Box sx={{ textAlign: 'center' }}>
                           <Link component={RouterLink} to="/login" variant="body2" color="error">
                               Proceed to Login
                           </Link>
                         </Box>
                     )}
                </Box>
            </Paper>
        </Container>
    );
};

export default ResetPasswordPage;
