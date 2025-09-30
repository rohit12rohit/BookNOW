// client/src/components/user/ProfileSection.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, Paper, Grid, Divider, Button, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const ProfileSection = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress color="error" />
            </Box>
        );
    }

    if (!user) {
        return <Typography>Could not load user profile.</Typography>;
    }

    return (
        <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
                Profile Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <Typography color="text.secondary">Full Name:</Typography>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <Typography>{user.name}</Typography>
                </Grid>

                <Grid item xs={12} sm={3}>
                    <Typography color="text.secondary">Email:</Typography>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <Typography>{user.email}</Typography>
                </Grid>

                <Grid item xs={12} sm={3}>
                    <Typography color="text.secondary">Account Type:</Typography>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <Typography sx={{ textTransform: 'capitalize' }}>{user.role}</Typography>
                </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button component={RouterLink} to="/profile/edit" variant="contained">
                    Edit Profile
                </Button>
            </Box>
        </Paper>
    );
};

export default ProfileSection;