// File: /client/src/components/admin/ReportedReviewsManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getReportedReviewsAdminApi, resolveReportAdminApi } from '../../api/admin';
import {
    Box, Button, Typography, Paper, List, ListItem, ListItemText,
    CircularProgress, Alert, Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';

const ReportedReviewsManagement = () => {
    const [reportedReviews, setReportedReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReportedReviews = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getReportedReviewsAdminApi();
            setReportedReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Failed to load reported reviews.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReportedReviews();
    }, [fetchReportedReviews]);

    const handleResolve = async (reviewId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this review/report?`)) {
            return;
        }
        try {
            await resolveReportAdminApi(reviewId, action);
            // Refresh the list after action
            fetchReportedReviews();
        } catch (err) {
            alert(`Action failed: ${err.message || 'Server error'}`);
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="h6" gutterBottom>Reported Reviews Management</Typography>
            
            {reportedReviews.length === 0 ? (
                <Typography sx={{ p: 2, textAlign: 'center' }}>No pending reported reviews found.</Typography>
            ) : (
                <Paper elevation={0} variant="outlined">
                    <List disablePadding>
                        {reportedReviews.map((review, index) => (
                            <React.Fragment key={review._id}>
                                <ListItem sx={{ display: 'block', py: 2 }}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                                Review for "{review.movie?.title}" by {review.user?.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 1 }}>
                                                "{review.comment}"
                                            </Typography>
                                        }
                                    />
                                    <Accordion sx={{ mt: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="body2">
                                                View {review.reports.filter(r => r.status === 'pending').length} Pending Report(s)
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <List dense>
                                                {review.reports.filter(r => r.status === 'pending').map((report, rIndex) => (
                                                    <ListItem key={rIndex} divider>
                                                        <ListItemText
                                                            primary={<Typography variant="body2">Reason: {report.reason}</Typography>}
                                                            secondary={`Reported by: ${report.user?.name || 'N/A'} on ${dayjs(report.reportedAt).format('DD MMM YYYY')}`}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </AccordionDetails>
                                    </Accordion>
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button size="small" variant="outlined" color="success" onClick={() => handleResolve(review._id, 'dismiss')}>
                                            Dismiss Reports
                                        </Button>
                                        <Button size="small" variant="contained" color="error" onClick={() => handleResolve(review._id, 'delete')}>
                                            Delete Review
                                        </Button>
                                    </Box>
                                </ListItem>
                                {index < reportedReviews.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default ReportedReviewsManagement;