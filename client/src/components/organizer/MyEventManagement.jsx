// client/src/components/organizer/MyEventManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyEventsApi } from '../../api/organizer';
import { deleteEventApi } from '../../api/events';
import {
    Box, Button, Typography, Paper, List, ListItem, ListItemText, IconButton,
    CircularProgress, Alert, Chip, Tooltip, Divider,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';

const MyEventManagement = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchMyEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getMyEventsApi();
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Failed to load your events.');
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyEvents();
    }, [fetchMyEvents]);

    const handleAddNewEvent = () => {
        // Navigate to a dedicated form page for creating events
        navigate('/organizer/events/new');
    };

    const handleEditEvent = (eventId) => {
        navigate(`/organizer/events/edit/${eventId}`);
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            try {
                await deleteEventApi(eventId);
                fetchMyEvents(); // Refresh list after deletion
            } catch (err) {
                alert(`Failed to delete event: ${err.message || 'Server error'}`);
            }
        }
    };

    const getStatusChipColor = (status) => {
        const statusMap = { 'Scheduled': 'info', 'Completed': 'success', 'Cancelled': 'error', 'Postponed': 'warning' };
        return statusMap[status] || 'default';
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">My Events</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={handleAddNewEvent}
                >
                    Add New Event
                </Button>
            </Box>

            {events.length === 0 ? (
                 <Paper elevation={1} sx={{p:3, textAlign: 'center'}}>
                    <Typography color="text.secondary">You haven't created any events yet.</Typography>
                </Paper>
            ) : (
                 <Paper elevation={0} variant="outlined">
                    <List disablePadding>
                        {events.map((event, index) => (
                            <React.Fragment key={event._id}>
                                <ListItem
                                    secondaryAction={
                                        <Box sx={{display: 'flex', gap: 0.5}}>
                                            <Tooltip title="Edit Event">
                                                <IconButton size="small" onClick={() => handleEditEvent(event._id)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Event">
                                                <IconButton size="small" onClick={() => handleDeleteEvent(event._id)}>
                                                    <DeleteIcon color="error"/>
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                >
                                   <ListItemText
                                        primary={<Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>{event.title}</Typography>}
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.secondary">
                                                    {event.address?.city || 'Location TBD'} | Starts: {dayjs(event.startDate).format('DD MMM YYYY, h:mm A')}
                                                </Typography>
                                                Status: <Chip label={event.status} size="small" variant="outlined" color={getStatusChipColor(event.status)}/>
                                            </>
                                        }
                                    />
                                </ListItem>
                                {index < events.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default MyEventManagement;