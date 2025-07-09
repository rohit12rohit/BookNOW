// client/pages/MovieDetailsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMovieByIdApi } from '../api/movies';
import { getShowtimesApi } from '../api/showtimes';
import { getReviewsForMovieApi, createReviewApi, deleteReviewApi } from '../api/reviews';
import {
    Container, Grid, Box, Typography, Chip, CircularProgress, Alert, Rating, Divider, Paper, List, ListItem, ListItemText,
    Avatar, ListItemAvatar, Button, Modal, TextField, IconButton, Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
// Icons

import AccessTimeIcon from '@mui/icons-material/AccessTime'; 
import LanguageIcon from '@mui/icons-material/Language';   
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';

const modalStyle = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '90%', sm: 400 }, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 };

const MovieDetailsPage = () => {
    const { movieId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const [movie, setMovie] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
    const [reviewError, setReviewError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [movieData, reviewsData] = await Promise.all([
                getMovieByIdApi(movieId),
                getReviewsForMovieApi(movieId)
            ]);
            setMovie(movieData);
            setReviews(reviewsData);
        } catch (err) {
            setError(err.message || 'Failed to load movie details.');
        } finally {
            setLoading(false);
        }
    }, [movieId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (!movieId) return;
        const fetchShowtimes = async () => {
            const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
            const response = await getShowtimesApi({ movieId, date: formattedDate });
            setShowtimes(response?.data || []);
        };
        fetchShowtimes();
    }, [movieId, selectedDate]);

    const handleDelete = async (reviewId) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            await deleteReviewApi(reviewId);
            fetchData();
        }
    };

    const handleReviewSubmit = async () => {
        if (newReview.rating === 0) return setReviewError("A star rating is required.");
        setReviewError("");
        try {
            await createReviewApi(movieId, newReview);
            setIsReviewModalOpen(false);
            setNewReview({ rating: 0, comment: '' });
            fetchData();
        } catch (err) {
            setReviewError(err.response?.data?.msg || "Failed to submit review.");
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!movie) return <Container sx={{ py: 4 }}><Alert severity="warning">Movie details not found.</Alert></Container>;

    const showtimesByVenue = showtimes.reduce((acc, show) => {
        const venueName = show.venue?.name || 'Unknown Venue';
        if (!acc[venueName]) acc[venueName] = [];
        acc[venueName].push(show);
        return acc;
    }, {});

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
                {/* Movie Details Grid... (No Changes Here) */}
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Box component="img" sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }} src={movie.posterUrl || "https://placehold.co/300x450"} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>{movie.title}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                            <Rating value={movie.averageRating || 0} precision={0.5} readOnly />
                            <Typography variant="body1" sx={{ ml: 1 }}>({movie.averageRating?.toFixed(1)}/5) - {movie.numberOfReviews || 0} Reviews</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip icon={<AccessTimeIcon />} label={`${movie.duration || 'N/A'} min`} />
                            <Chip icon={<LanguageIcon />} label={movie.movieLanguage || 'N/A'} />
                            <Chip label={`Rated ${movie.censorRating || 'N/A'}`} />
                        </Box>
                        <Typography variant="body1" paragraph>{movie.description}</Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* Showtimes Section... (No Changes Here) */}
                <Box component="section">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" component="h2">Showtimes</Typography>
                        <DatePicker label="Select Date" value={selectedDate} onChange={(d) => setSelectedDate(d)} />
                    </Box>
                    {Object.keys(showtimesByVenue).length > 0 ? Object.entries(showtimesByVenue).map(([venue, shows]) => (
                        <Box key={venue} sx={{ mb: 2 }}>
                            <Typography variant="h6">{venue}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {shows.map(s => <Button key={s._id} variant="outlined" component={RouterLink} to={`/book/${s._id}`}>{dayjs(s.startTime).format('h:mm A')}</Button>)}
                            </Box>
                        </Box>
                    )) : <Typography>No showtimes available for this date.</Typography>}
                </Box>
                
                <Divider sx={{ my: 4 }} />

                {/* Reviews Section with Correction */}
                <Box component="section">
                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" component="h2">User Reviews ({reviews.length})</Typography>
                        <Button variant="contained" color="error" onClick={() => setIsReviewModalOpen(true)} disabled={!isAuthenticated}>Write a Review</Button>
                     </Box>
                     <List>
                        {reviews.map((review) => (
                             <React.Fragment key={review._id}>
                                 <ListItem alignItems="flex-start">
                                     <ListItemAvatar>
                                        <Avatar>{review.user?.name?.charAt(0) || 'A'}</Avatar>
                                     </ListItemAvatar>
                                     <ListItemText
                                         primary={
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {/* --- THIS IS THE FIX --- */}
                                                <Typography sx={{ fontWeight: 'medium' }}>{review.user?.name || 'Anonymous'}</Typography>
                                                <Rating value={review.rating} readOnly size="small" />
                                             </Box>
                                         }
                                         secondary={<Typography sx={{ mt: 1 }}>{review.comment}</Typography>}
                                     />
                                     <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" color="text.secondary">{dayjs(review.createdAt).format('DD MMM, YYYY')}</Typography>
                                        {(user?.role === 'admin' || user?.role === 'organizer' || user?._id === review.user?._id) && (
                                            <Tooltip title="Delete Review">
                                                <IconButton size="small" onClick={() => handleDelete(review._id)} sx={{ display: 'block', ml: 'auto' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                     </Box>
                                 </ListItem>
                                 <Divider variant="inset" component="li" />
                             </React.Fragment>
                         ))}
                     </List>
                 </Box>
            </Paper>
            
            {/* Review Modal... (No Changes Here) */}
            <Modal open={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2">Write Your Review</Typography>
                    {reviewError && <Alert severity="error" sx={{mt: 2}}>{reviewError}</Alert>}
                    <Rating name="rating" value={newReview.rating} onChange={(e, newValue) => setNewReview(prev => ({...prev, rating: newValue}))} sx={{my: 2}}/>
                    <TextField label="Your Comment (Optional)" fullWidth multiline rows={4} value={newReview.comment} onChange={(e) => setNewReview(prev => ({...prev, comment: e.target.value}))}/>
                    <Box sx={{mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                        <Button onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleReviewSubmit}>Submit</Button>
                    </Box>
                </Box>
            </Modal>
        </Container>
    );
};

export default MovieDetailsPage;