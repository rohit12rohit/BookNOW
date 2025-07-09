// client/src/components/organizer/ReportedReviewsOrganizer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Import Link
import { getReportedReviewsOrganizerApi } from '../../api/organizer';
import { deleteReviewApi } from '../../api/reviews';
import { 
    Box, Typography, Paper, CircularProgress, Alert, Tooltip, IconButton, List, ListItem, ListItemText, 
    Divider, Rating, Chip, Collapse, Link as MuiLink 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const ReportedReviewsOrganizer = () => {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedReview, setExpandedReview] = useState(null);

    const fetchReportedReviews = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getReportedReviewsOrganizerApi();
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Failed to load reported reviews.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReportedReviews();
    }, [fetchReportedReviews]);

    const handleToggleExpand = (reviewId) => {
        setExpandedReview(expandedReview === reviewId ? null : reviewId);
    };
    
    const handleDeleteReview = async (reviewId) => {
        if (window.confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) {
            try {
                await deleteReviewApi(reviewId);
                fetchReportedReviews(); // Refresh the list
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Reported Reviews for My Movies</Typography>
            {reviews.length === 0 ? (
                <Typography>No reported reviews for your movies at this time.</Typography>
            ) : (
                <Paper variant="outlined">
                    <List>
                        {reviews.map((review, index) => (
                            <React.Fragment key={review._id}>
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Typography>
                                                Movie: <MuiLink component={RouterLink} to={`/movies/${review.movie?._id}`}>{review.movie?.title || 'N/A'}</MuiLink>
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="text.primary">"{review.comment}"</Typography>
                                                <Typography component="span" variant="caption" display="block">- by {review.user?.name || 'Anonymous'}</Typography>
                                            </>
                                        }
                                    />
                                    <Box>
                                        <Chip label={`${review.reports.length} Report(s)`} color="warning" size="small" />
                                        <Tooltip title="Delete Review"><IconButton onClick={() => handleDeleteReview(review._id)} color="error"><DeleteIcon /></IconButton></Tooltip>
                                        <Tooltip title="Show Reports"><IconButton onClick={() => handleToggleExpand(review._id)}><ExpandMoreIcon sx={{ transform: expandedReview === review._id ? 'rotate(180deg)' : 'rotate(0deg)' }} /></IconButton></Tooltip>
                                    </Box>
                                </ListItem>
                                <Collapse in={expandedReview === review._id} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding sx={{ pl: 4, bgcolor: 'action.hover' }}>
                                        {review.reports.map(report => (
                                            <ListItem key={report._id}>
                                                <ListItemText 
                                                    primary={`Reason: "${report.reason}"`} 
                                                    // Organizers might not have permission to view user details, so we don't link the name here.
                                                    // For admins, this is a link. For organizers, it's just text.
                                                    secondary={`Reported by: ${report.user?.name || 'Unknown User'}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                                {index < reviews.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default ReportedReviewsOrganizer;