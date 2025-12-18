// client/src/pages/UserProfileEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateMyProfileApi } from '../api/user';
import {
    Container, Paper, Box, Typography, TextField, Button, CircularProgress, Alert, Grid, Snackbar
} from '@mui/material';

const UserProfileEditPage = () => {
    const navigate = useNavigate();
    const { user, loadUser, token } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await updateMyProfileApi({ name: formData.name });
            setSuccess('Profile updated successfully!');
            await loadUser(token); // Refresh user data in context
            setTimeout(() => {
                navigate('/dashboard?tab=profile');
            }, 1500); // Redirect after a short delay
        } catch (err) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <CircularProgress />;
    }

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Edit Profile
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                id="name"
                                name="name"
                                label="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email Address"
                                value={formData.email}
                                disabled // Email is not editable
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/dashboard?tab=profile')}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                message={success}
            />
        </Container>
    );
};

export default UserProfileEditPage;