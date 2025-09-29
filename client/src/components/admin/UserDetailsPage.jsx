// client/src/pages/admin/UserDetailsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getUserByIdAdminApi, getAllBookingsAdminApi } from '../../api/admin';
import {
    Container, Typography, Box, Paper, CircularProgress, Alert, Grid, Divider, Chip, Button,
    List, ListItem, ListItemText
} from '@mui/material';
import dayjs from 'dayjs';

const UserDetailsPage = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserDetails = useCallback(async () => {
        if (!userId) {
            setError("User ID is missing.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Fetch user details and their bookings in parallel
            const [userData, bookingsData] = await Promise.all([
                getUserByIdAdminApi(userId),
                getAllBookingsAdminApi({ userId: userId, limit: 100 }) // Fetch up to 100 bookings for this user
            ]);
            
            setUser(userData);
            setBookings(bookingsData.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load user details.');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!user) return <Container sx={{ py: 4 }}><Alert severity="warning">User not found.</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button component={RouterLink} to="/admin?tab=users" sx={{ mb: 2 }}>
                &larr; Back to User Management
            </Button>
            <Paper sx={{ p: { xs: 2, md: 4 } }}>
                <Typography variant="h4" component="h1" gutterBottom>{user.name}</Typography>
                <Chip label={user.role} color={user.role === 'admin' ? 'secondary' : 'default'} sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                    {/* User Details Section */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Profile Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={1}>
                            <Grid item xs={4}><Typography color="text.secondary">Email:</Typography></Grid>
                            <Grid item xs={8}><Typography>{user.email}</Typography></Grid>
                            <Grid item xs={4}><Typography color="text.secondary">Joined:</Typography></Grid>
                            <Grid item xs={8}><Typography>{dayjs(user.createdAt).format('DD MMM YYYY, h:mm A')}</Typography></Grid>
                            {user.role === 'organizer' && (
                                <>
                                    <Grid item xs={4}><Typography color="text.secondary">Organization:</Typography></Grid>
                                    <Grid item xs={8}><Typography>{user.organizationName || 'N/A'}</Typography></Grid>
                                    <Grid item xs={4}><Typography color="text.secondary">Status:</Typography></Grid>
                                    <Grid item xs={8}><Chip label={user.isApproved ? 'Approved' : 'Pending'} size="small" color={user.isApproved ? 'success' : 'warning'} /></Grid>
                                </>
                            )}
                        </Grid>
                    </Grid>

                    {/* Booking History Section */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Recent Bookings ({bookings.length})</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {bookings.length > 0 ? (
                            <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {bookings.map(booking => (
                                    <ListItem key={booking._id} disablePadding>
                                        <ListItemText
                                            primary={`Ref: ${booking.bookingRefId || booking._id.slice(-6)} - ${booking.showtime?.movie?.title || 'Event'}`}
                                            secondary={`On ${dayjs(booking.bookingTime).format('DD MMM YYYY')} - Status: ${booking.status}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography color="text.secondary">No booking history found for this user.</Typography>
                        )}
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default UserDetailsPage;