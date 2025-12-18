// File: /client/src/pages/WriteReviewPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { getMovieByIdApi, checkReviewEligibilityApi } from '../api/movies';
import { createReviewApi } from '../api/reviews';
import { useAuth } from '../contexts/AuthContext';
import { Container, Paper, Box, Typography, CircularProgress, Alert, Button, Rating, TextField } from '@mui/material';

const WriteReviewPage = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [movie, setMovie] = useState(null);
    const [eligibility, setEligibility] = useState({ checked: false, isEligible: false, reason: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const checkEligibility = useCallback(async () => {
        if (!isAuthenticated) {
            setEligibility({ checked: true, isEligible: false, reason: 'You must be logged in to write a review.' });
            return;
        }
        try {
            const data = await checkReviewEligibilityApi(movieId);
            let reasonMessage = '';
            if (!data.isEligible) {
                switch(data.reason) {
                    case 'already_reviewed':
                        reasonMessage = "You have already submitted a review for this movie.";
                        break;
                    case 'no_booking':
                        reasonMessage = "You can only review movies for which you have a confirmed booking. Your ticket must be for a showtime that has already passed.";
                        break;
                    default:
                        reasonMessage = "You are not eligible to review this movie at this time.";
                }
            }
            setEligibility({ checked: true, isEligible: data.isEligible, reason: reasonMessage });
        } catch (err) {
            setError(err.message || "Could not verify review eligibility.");
            setEligibility({ checked: true, isEligible: false, reason: 'An error occurred.' });
        }
    }, [movieId, isAuthenticated]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const movieData = await getMovieByIdApi(movieId);
                setMovie(movieData);
                await checkEligibility();
            } catch (err) {
                setError(err.message || 'Failed to load movie details.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [movieId, checkEligibility]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setSubmitError('Please provide a star rating.');
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await createReviewApi(movieId, { rating, comment });
            // On success, navigate back to the movie details page
            navigate(`/movies/${movieId}`);
        } catch (err) {
            setSubmitError(err.msg || err.message || 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!movie) return <Container sx={{ py: 4 }}><Alert severity="warning">Movie not found.</Alert></Container>;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>Write a Review for</Typography>
                <Typography variant="h5" component="h2" color="primary" sx={{ mb: 3 }}>{movie.title}</Typography>

                {!eligibility.checked ? (
                    <CircularProgress />
                ) : eligibility.isEligible ? (
                    <Box component="form" onSubmit={handleSubmit}>
                        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography component="legend" sx={{ mr: 2 }}>Your Rating*:</Typography>
                            <Rating
                                name="rating"
                                value={rating}
                                precision={0.5}
                                size="large"
                                onChange={(event, newValue) => {
                                    setRating(newValue);
                                    setSubmitError(null);
                                }}
                            />
                        </Box>
                        <TextField
                            label="Your Review (Optional)"
                            multiline
                            rows={6}
                            fullWidth
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            variant="outlined"
                        />
                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting || rating === 0}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : 'Submit Review'}
                            </Button>
                            <Button variant="outlined" onClick={() => navigate(`/movies/${movieId}`)}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Alert severity="warning">
                        <Typography>{eligibility.reason}</Typography>
                        <Button component={RouterLink} to={`/movies/${movieId}`} sx={{ mt: 1 }}>
                            Back to Movie Details
                        </Button>
                    </Alert>
                )}
            </Paper>
        </Container>
    );
};

export default WriteReviewPage;