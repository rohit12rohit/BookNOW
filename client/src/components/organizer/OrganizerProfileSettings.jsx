// client/src/components/organizer/OrganizerProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // To get current user data
import { updateMyOrganizerProfileApi } from '../../api/organizer';
import {
    Box, Button, Typography, Paper, TextField, Grid, CircularProgress, Alert, Snackbar
} from '@mui/material';

const OrganizerProfileSettings = () => {
    const { user, loadUser, token } = useAuth(); // loadUser can refresh user data in context after update
    const [formData, setFormData] = useState({
        name: '',
        email: '', // Typically not editable
        organizationName: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                organizationName: user.organizationName || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        const profileDataToUpdate = {
            name: formData.name,
            organizationName: formData.organizationName,
        };

        try {
            await updateMyOrganizerProfileApi(profileDataToUpdate);
            setSuccessMessage('Profile updated successfully!');
            setIsEditing(false); // Exit edit mode
            if (token) { // Check if token exists before calling loadUser
              await loadUser(token); // Refresh user data in AuthContext
            }
        } catch (err) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress color="error" />
                <Typography sx={{ml: 2}}>Loading user data...</Typography>
            </Box>
        );
    }

    return (
        <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                My Profile & Settings
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={!isEditing || isLoading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            disabled // Email is usually not editable
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Organization Name"
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleChange}
                            required
                            disabled={!isEditing || isLoading}
                        />
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        {isEditing ? (
                            <>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset form to original user data if changes were made
                                        if(user) setFormData({name: user.name, email: user.email, organizationName: user.organizationName});
                                        setError(null);
                                    }}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    color="primary" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                                </Button>
                            </>
                        ) : (
                            <Button 
                                variant="contained" 
                                color="secondary" 
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Box>
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage('')}
                message={successMessage}
            />
        </Paper>
    );
};

export default OrganizerProfileSettings;