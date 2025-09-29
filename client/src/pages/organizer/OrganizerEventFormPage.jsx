// client/src/pages/organizer/OrganizerEventFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEventApi, getEventByIdApi, updateEventApi } from '../../api/events';
import {
    Container, Typography, Box, Paper, TextField, Button, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const initialEventState = {
    title: '', description: '', category: '', eventLanguage: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    startDate: null, endDate: null, imageUrl: '', tags: [],
    status: 'Scheduled',
};

const eventCategories = ['Music', 'Sports', 'Theatre', 'Workshop', 'Comedy', 'Exhibition', 'Community', 'Business', 'Other'];
const eventStatuses = ['Scheduled', 'Postponed', 'Cancelled', 'Completed'];

const OrganizerEventFormPage = ({ mode = 'create' }) => {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const [eventData, setEventData] = useState(initialEventState);
    const [tagInput, setTagInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const pageTitle = mode === 'edit' ? 'Edit Event' : 'Add New Event';

    useEffect(() => {
        if (mode === 'edit' && eventId) {
            setIsLoading(true);
            getEventByIdApi(eventId)
                .then(data => {
                    setEventData({
                        ...initialEventState, ...data,
                        startDate: data.startDate ? dayjs(data.startDate) : null,
                        endDate: data.endDate ? dayjs(data.endDate) : null,
                    });
                })
                .catch(err => setFormError(err.message || 'Failed to load event data.'))
                .finally(() => setIsLoading(false));
        }
    }, [mode, eventId]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setEventData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setEventData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleDateChange = (name, date) => setEventData(prev => ({ ...prev, [name]: date }));
    
    const handleAddTag = () => {
        if (tagInput && !eventData.tags.includes(tagInput)) {
            setEventData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
        }
        setTagInput('');
    };
    
    const handleRemoveTag = (tagToRemove) => {
        setEventData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError(null);
        
        const payload = {
            ...eventData,
            startDate: eventData.startDate ? eventData.startDate.toISOString() : null,
            endDate: eventData.endDate ? eventData.endDate.toISOString() : null,
        };

        try {
            if (mode === 'edit') {
                await updateEventApi(eventId, payload);
            } else {
                await createEventApi(payload);
            }
            navigate('/organizer?tab=events');
        } catch (err) {
            setFormError(err.errors ? err.errors.map(e => e.msg).join(', ') : (err.msg || 'Operation failed.'));
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && mode === 'edit' && !eventData.title) return <CircularProgress />;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>{pageTitle}</Typography>
                {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><TextField name="title" label="Event Title" value={eventData.title} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12}><TextField name="description" label="Description" value={eventData.description} onChange={handleChange} fullWidth required multiline rows={4} /></Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Category</InputLabel>
                                <Select name="category" label="Category" value={eventData.category} onChange={handleChange}>
                                    {eventCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}><TextField name="language" label="Language (Optional)" value={eventData.language} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={6}><DatePicker label="Start Date & Time" value={eventData.startDate} onChange={(d) => handleDateChange('startDate', d)} slotProps={{ textField: { fullWidth: true, required: true } }} /></Grid>
                        <Grid item xs={12} sm={6}><DatePicker label="End Date & Time (Optional)" value={eventData.endDate} onChange={(d) => handleDateChange('endDate', d)} slotProps={{ textField: { fullWidth: true } }} /></Grid>
                        <Grid item xs={12}><TextField name="address.city" label="City" value={eventData.address.city} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12}><TextField name="address.state" label="State" value={eventData.address.state} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12}><TextField name="imageUrl" label="Image URL (Optional)" value={eventData.imageUrl} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={9}><TextField label="Add Tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} fullWidth /></Grid>
                        <Grid item xs={12} sm={3}><Button variant="outlined" onClick={handleAddTag} fullWidth sx={{height: '100%'}}>Add Tag</Button></Grid>
                        <Grid item xs={12}>{eventData.tags.map(tag => <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} sx={{ mr: 1 }} />)}</Grid>
                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} /> : (mode === 'edit' ? 'Save Changes' : 'Create Event')}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default OrganizerEventFormPage;