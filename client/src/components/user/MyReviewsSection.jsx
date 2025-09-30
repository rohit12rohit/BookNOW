// client/src/components/user/MyReviewsSection.jsx
import React, { useState, useEffect } from 'react';
import { getMyReviewsApi } from '../../api/reviews';
import dayjs from 'dayjs';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Paper, List, ListItem, ListItemText, Divider,
    CircularProgress, Alert, Rating, Avatar, ListItemAvatar
} from '@mui/material';

const MyReviewsSection = () => {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getMyReviewsApi();
                setReviews(data);
            } catch (err) {
                setError(err.message || "Failed to load your reviews.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    }
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>My Reviews</Typography>
            {reviews.length === 0 ? (
                <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">You haven't written any reviews yet.</Typography>
                </Paper>
            ) : (
                <Paper elevation={0} variant="outlined">
                    <List disablePadding>
                        {reviews.map((review, index) => (
                            <React.Fragment key={review._id}>
                                <ListItem
                                    button
                                    component={RouterLink}
                                    to={`/movies/${review.movie?._id}`}
                                    alignItems="flex-start"
                                >
                                    <ListItemAvatar>
                                        <Avatar variant="rounded" src={review.movie?.posterUrl} alt={review.movie?.title}>
                                            M
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={review.movie?.title || 'Movie not found'}
                                        secondary={
                                            <Box component="span">
                                                <Rating value={review.rating} precision={0.5} size="small" readOnly sx={{ display: 'block', my: 0.5 }} />
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    {review.comment}
                                                </Typography>
                                                <Typography variant="caption" display="block" sx={{mt: 1}}>
                                                    Reviewed on {dayjs(review.createdAt).format('DD MMM YYYY')}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < reviews.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default MyReviewsSection;