// client/src/components/admin/PlatformStats.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { getPlatformStatsAdminApi } from '../../api/admin';
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert, Card, CardContent, Divider, Link as MuiLink,
    ListItemIcon // Added Link from MUI for consistent styling if needed
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import EventIcon from '@mui/icons-material/Event';
import TheatersIcon from '@mui/icons-material/Theaters';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
// import LocationCityIcon from '@mui/icons-material/LocationCity';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import HowToRegIcon from '@mui/icons-material/HowToReg';

// Updated StatCard to be clickable
const StatCard = ({ title, value, icon, color = "primary.main", linkTo, queryParams }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (linkTo) {
            const searchParams = new URLSearchParams(queryParams || {}).toString();
            navigate(`${linkTo}${searchParams ? `?${searchParams}` : ''}`);
        }
    };

    const cardContent = (
        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
            <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, color: color, fontSize: '2rem' }}>
                {icon}
            </ListItemIcon>
            <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {title}
                </Typography>
            </Box>
        </CardContent>
    );

    return (
        <Card 
            sx={{ 
                height: '100%', 
                boxShadow: 3, 
                cursor: linkTo ? 'pointer' : 'default',
                '&:hover': linkTo ? { boxShadow: 6, transform: 'translateY(-2px)' } : {} ,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
            }}
            onClick={linkTo ? handleClick : undefined}
            component={linkTo ? 'div' : Paper} // Make it a div if clickable for semantics
        >
            {cardContent}
        </Card>
    );
};


const PlatformStats = () => { // Removed navigateToTab prop, will use useNavigate directly
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getPlatformStatsAdminApi();
            if (response.success && response.stats) {
                setStats(response.stats);
            } else {
                throw new Error('Statistics data is missing or invalid.');
            }
        } catch (err) {
            setError(err.message || 'Failed to load platform statistics.');
            setStats(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    if (!stats) return <Typography sx={{p:2, textAlign: 'center'}}>No statistics data available.</Typography>;

    return (
        <Box sx={{p:1}}>
            <Typography variant="h6" gutterBottom sx={{mb: 3}}>Platform Overview</Typography>
            <Grid container spacing={3}>
                {/* Users Section */}
                <Grid item xs={12} sm={6} md={4} lg={3}> {/* Adjusted grid for more cards */}
                    <Paper elevation={2} sx={{p:2, height: '100%'}}>
                        <Typography variant="h6" gutterBottom component="div" sx={{display: 'flex', alignItems: 'center'}}>
                            <PeopleAltIcon sx={{mr:1, color: 'primary.main'}}/> User Statistics
                        </Typography>
                        <Divider sx={{mb:2}} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <StatCard title="Total Users" value={stats.users?.total || 0} icon={<PeopleAltIcon />} linkTo="/admin" queryParams={{ tab: 'users', userFilter: 'all' }} />
                            </Grid>
                            <Grid item xs={12}>
                                <StatCard title="Total Organizers" value={stats.users?.organizers || 0} icon={<SupervisorAccountIcon />} color="secondary.main" linkTo="/admin" queryParams={{ tab: 'users', userFilter: 'organizers' }} />
                            </Grid>
                            <Grid item xs={12}>
                                <StatCard title="Approved Organizers" value={stats.users?.approvedOrganizers || 0} icon={<HowToRegIcon />} color="success.main" linkTo="/admin" queryParams={{ tab: 'users', userFilter: 'organizers' }} /> {/* This filter would show all organizers; approved status is a column */}
                            </Grid>
                             <Grid item xs={12}>
                                <StatCard title="Pending Approval" value={(stats.users?.organizers || 0) - (stats.users?.approvedOrganizers || 0)} icon={<SupervisorAccountIcon color="warning"/>} color="warning.main" linkTo="/admin" queryParams={{ tab: 'users', userFilter: 'pendingOrganizers' }} />
                            </Grid>
                            <Grid item xs={12}>
                                <StatCard title="Regular Users" value={stats.users?.regularUsers || 0} icon={<PeopleAltIcon />} linkTo="/admin" queryParams={{ tab: 'users', userFilter: 'all' }} /> {/* Or a specific filter for 'user' role */}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Content Section */}
                 <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Paper elevation={2} sx={{p:2, height: '100%'}}>
                        <Typography variant="h6" gutterBottom component="div" sx={{display: 'flex', alignItems: 'center'}}>
                           <MovieFilterIcon sx={{mr:1, color: 'primary.main'}}/> Content Statistics
                        </Typography>
                        <Divider sx={{mb:2}} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}><StatCard title="Total Movies" value={stats.content?.movies || 0} icon={<MovieFilterIcon />} linkTo="/admin" queryParams={{ tab: 'movies' }} /></Grid>
                            <Grid item xs={12}><StatCard title="Active Venues" value={stats.content?.activeVenues || 0} icon={<TheatersIcon />} color="info.main" linkTo="/admin" queryParams={{ tab: 'venues' /*, venueFilter: 'active' */ }} /></Grid> {/* Venue filter to be added later */}
                            <Grid item xs={12}><StatCard title="Upcoming Events" value={stats.content?.upcomingEvents || 0} icon={<EventIcon />} color="warning.main" /* linkTo="/admin" queryParams={{ tab: 'events' }} */ /></Grid>
                            <Grid item xs={12}><StatCard title="Upcoming Showtimes" value={stats.content?.upcomingShowtimes || 0} icon={<TheatersIcon />} color="secondary.light" /* linkTo="/admin" queryParams={{ tab: 'showtimes' }} */ /></Grid>
                        </Grid>
                    </Paper>
                </Grid>
                
                {/* Bookings & Financials Section */}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                     <Paper elevation={2} sx={{p:2, height: '100%'}}>
                        <Typography variant="h6" gutterBottom component="div" sx={{display: 'flex', alignItems: 'center'}}>
                           <BookOnlineIcon sx={{mr:1, color: 'primary.main'}}/> Booking & Financials
                        </Typography>
                        <Divider sx={{mb:2}} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}><StatCard title="Total Bookings" value={stats.bookings?.total || 0} icon={<BookOnlineIcon />} linkTo="/admin" queryParams={{ tab: 'bookings' }} /></Grid>
                            <Grid item xs={12}><StatCard title="Confirmed Bookings" value={stats.bookings?.confirmed || 0} icon={<ConfirmationNumberIcon />} color="success.dark" linkTo="/admin" queryParams={{ tab: 'bookings', bookingStatus: 'Confirmed' }} /></Grid>
                            {stats.financials?.simulatedTotalRevenue !== undefined && (
                                <Grid item xs={12}><StatCard title="Simulated Total Revenue" value={`Rs. ${parseFloat(stats.financials.simulatedTotalRevenue).toLocaleString()}`} icon={<AttachMoneyIcon />} color="success.main" /></Grid>
                            )}
                        </Grid>
                    </Paper>
                </Grid>

                 <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Paper elevation={2} sx={{p:2, height: '100%'}}>
                        <Typography variant="h6" gutterBottom component="div" sx={{display: 'flex', alignItems: 'center'}}>
                           <ConfirmationNumberIcon sx={{mr:1, color: 'primary.main'}}/> Promotions
                        </Typography>
                        <Divider sx={{mb:2}} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}><StatCard title="Total Promo Codes" value={stats.promoCodes?.total || 0} icon={<ConfirmationNumberIcon />} linkTo="/admin" queryParams={{ tab: 'promocodes' }} /></Grid>
                            <Grid item xs={12}><StatCard title="Active Promo Codes" value={stats.promoCodes?.active || 0} icon={<ConfirmationNumberIcon />} color="info.dark" linkTo="/admin" queryParams={{ tab: 'promocodes' /*, promoFilter: 'active' */ }} /></Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PlatformStats;