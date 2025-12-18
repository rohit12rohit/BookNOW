// client/src/components/ReviewForm.jsx
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Rating, CircularProgress, Alert } from '@mui/material';
import { createReviewApi } from '../api/reviews'; // Import the API function

const ReviewForm = ({ movieId, onSubmitSuccess }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a star rating before submitting.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Make the actual API call to create the review
            const newReview = await createReviewApi(movieId, { rating, comment });
            
            // Call the callback function passed from the parent to notify of success
            if (onSubmitSuccess) {
                onSubmitSuccess(newReview);
            }

            // Reset form on success
            setRating(0);
            setComment('');

        } catch (err) {
            // Display the error message from the API response
            setError(err.msg || err.message || 'Failed to submit review.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Write a Review</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography component="legend" sx={{ mr: 2 }}>Your Rating*:</Typography>
                <Rating
                    name="rating"
                    value={rating}
                    precision={0.5}
                    onChange={(event, newValue) => {
                        setRating(newValue || 0);
                        setError(null); // Clear error when rating is given
                    }}
                />
            </Box>
            
            <TextField
                label="Your Review (Optional)"
                multiline
                rows={4}
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                variant="outlined"
            />
            
            <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                disabled={isLoading || rating === 0}
            >
                {isLoading ? <CircularProgress size={24} /> : 'Submit Review'}
            </Button>
        </Box>
    );
};

export default ReviewForm;