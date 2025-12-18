// client/src/components/admin/EventManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getEventsApi, createEventApi, updateEventApi, deleteEventApi } from '../../api/events';
import {
    Box, Button, TextField, Typography, Paper, List, ListItem, ListItemText, IconButton,
    Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Alert, Grid, Tooltip, Divider, Chip,
    FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Collapse
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const initialEventData = {
    title: '',
    description: '',
    category: '',
    language: '',
    venue: '', // Will be ObjectId if linked
    address: { street: '', city: '', state: '', zipCode: '' },
    startDate: null,
    endDate: null,
    imageUrl: '',
    tags: [], // Array of strings
    organizerInfo: { name: '', contact: '' },
    status: 'Scheduled',
};

const eventCategories = ['Music', 'Sports', 'Theatre', 'Workshop', 'Comedy', 'Exhibition', 'Community', 'Business', 'Food & Drink', 'Other'];
const eventStatuses = ['Scheduled', 'Postponed', 'Cancelled', 'Completed'];

const EventManagement = ({ initialStatusFilter = '' }) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // For modal errors
    const [listError, setListError] = useState(null); // For list fetching errors
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(initialEventData);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [tagInput, setTagInput] = useState('');

    // Pagination & Filtering state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalEvents, setTotalEvents] = useState(0);
    const [filters, setFilters] = useState({
        category: '',
        city: '',
        status: initialStatusFilter, // Use prop for initial status
        date: null, // For startDate
    });
    const [showFilters, setShowFilters] = useState(false);
    // We'll need a list of venues if we want to link events to venues via a dropdown
    // const [venues, setVenues] = useState([]); 
    // useEffect(() => { /* fetch venues for dropdown */ }, []);


    const fetchEvents = useCallback(async (currentPage, currentRowsPerPage, currentFilters) => {
        setIsLoading(true);
        setListError(null);
        try {
            const params = {
                limit: currentRowsPerPage,
                page: currentPage + 1,
                sort: 'startDate_desc', // Show newest start dates first or upcoming
            };
            if (currentFilters.category) params.category = currentFilters.category;
            if (currentFilters.city) params.city = currentFilters.city; // Backend filters on address.city
            if (currentFilters.status) params.status = currentFilters.status;
            else params.status = 'all'; // Admin should see all by default if no filter
            
            if (currentFilters.date) params.date = dayjs(currentFilters.date).format('YYYY-MM-DD');

            const response = await getEventsApi(params);
            setEvents(response.data || []);
            setTotalEvents(response.total || 0);
        } catch (err) {
            setListError(err.message || 'Failed to load events.');
            setEvents([]);
            setTotalEvents(0);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        // Update filters if initial prop changes (e.g. from stats page link)
        setFilters(prev => ({...prev, status: initialStatusFilter || ''}));
    }, [initialStatusFilter]);

    useEffect(() => {
        fetchEvents(page, rowsPerPage, filters);
    }, [fetchEvents, page, rowsPerPage, filters]);

    const handleOpenModal = (event = null) => {
        setError(null);
        if (event) {
            setIsEditing(true);
            setCurrentEvent({
                ...initialEventData,
                ...event,
                startDate: event.startDate ? dayjs(event.startDate) : null,
                endDate: event.endDate ? dayjs(event.endDate) : null,
                tags: Array.isArray(event.tags) ? event.tags : [],
                address: event.address || initialEventData.address,
                organizerInfo: event.organizerInfo || initialEventData.organizerInfo,
                venue: event.venue?._id || event.venue || '', // Store only ID if venue is populated
            });
        } else {
            setIsEditing(false);
            setCurrentEvent(initialEventData);
        }
        setTagInput('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("address.")) {
            const addressField = name.split(".")[1];
            setCurrentEvent(prev => ({ ...prev, address: { ...prev.address, [addressField]: value } }));
        } else if (name.startsWith("organizerInfo.")) {
            const orgField = name.split(".")[1];
            setCurrentEvent(prev => ({ ...prev, organizerInfo: { ...prev.organizerInfo, [orgField]: value } }));
        } else {
            setCurrentEvent(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (name, date) => {
        setCurrentEvent(prev => ({ ...prev, [name]: date }));
    };

    const addTag = () => {
        if (tagInput.trim() && !currentEvent.tags.includes(tagInput.trim())) {
            setCurrentEvent(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
        }
        setTagInput('');
    };
    const removeTag = (tagToRemove) => {
        setCurrentEvent(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const eventDataToSubmit = {
            ...currentEvent,
            startDate: currentEvent.startDate ? currentEvent.startDate.toISOString() : null,
            endDate: currentEvent.endDate ? currentEvent.endDate.toISOString() : null,
            venue: currentEvent.venue || null, // Ensure it's null if empty string
        };
        // Basic client-side validation
        if (!eventDataToSubmit.title || !eventDataToSubmit.category || !eventDataToSubmit.startDate) {
            setError("Title, Category, and Start Date are required.");
            return;
        }

        try {
            if (isEditing) {
                await updateEventApi(currentEvent._id, eventDataToSubmit);
            } else {
                await createEventApi(eventDataToSubmit);
            }
            fetchEvents(page, rowsPerPage, filters);
            handleCloseModal();
        } catch (err) {
            setError(err.errors ? err.errors.map(er => er.msg).join(', ') : (err.msg || 'Operation failed.'));
        }
    };

    const handleDeleteClick = (event) => {
        setEventToDelete(event);
        setDeleteConfirmOpen(true);
    };
    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;
        try {
            await deleteEventApi(eventToDelete._id);
            fetchEvents(page, rowsPerPage, filters);
        } catch (err) {
            alert(`Failed to delete event: ${err.message}`);
        } finally {
            setDeleteConfirmOpen(false);
            setEventToDelete(null);
        }
    };
    
    // Filter Handlers
    const handleFilterInputChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    const handleFilterDateChange = (newDate) => {
        setFilters(prev => ({ ...prev, date: newDate }));
    };
    const handleApplyFilters = () => {
        setPage(0); // Reset to first page
        // fetchEvents will be called by useEffect due to filters state change
    };
     const handleClearFilters = () => {
        setFilters({ category: '', city: '', status: '', date: null });
        setPage(0);
    };


    if (isLoading && events.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (listError) return <Alert severity="error" sx={{ m: 2 }}>{listError}</Alert>;

    return (
        <Box sx={{p:1}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">Event Management</Typography>
                <Box>
                    <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)} sx={{mr:1}}>
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                    <Button variant="contained" color="primary" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenModal()}>
                        Add Event
                    </Button>
                </Box>
            </Box>
             <Collapse in={showFilters}>
                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField name="city" label="City (Address)" value={filters.city} onChange={handleFilterInputChange} fullWidth size="small"/>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Category</InputLabel>
                                <Select name="category" value={filters.category} label="Category" onChange={handleFilterInputChange}>
                                    <MenuItem value=""><em>Any</em></MenuItem>
                                    {eventCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                         <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select name="status" value={filters.status} label="Status" onChange={handleFilterInputChange}>
                                    <MenuItem value=""><em>Any (All for Admin)</em></MenuItem>
                                    {eventStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                     <MenuItem value="upcoming">Upcoming (Scheduled)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker label="Start Date" value={filters.date} onChange={handleFilterDateChange} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt:1 }}>
                            <Button onClick={handleClearFilters} variant="outlined" size="medium">Clear</Button>
                            <Button onClick={handleApplyFilters} variant="contained" size="medium">Apply</Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Collapse>


            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={30} color="error" /></Box>}
            {!isLoading && events.length === 0 && <Typography sx={{p:2, textAlign: 'center'}}>No events found matching criteria.</Typography>}
            
            {events.length > 0 && (
                 <Paper elevation={0} variant="outlined">
                    <TableContainer>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold'}}>Title</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Category</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Date & Time</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Location</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Status</TableCell>
                                    <TableCell sx={{fontWeight: 'bold', textAlign:'center'}}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {events.map((event) => (
                                    <TableRow hover key={event._id}>
                                        <TableCell sx={{maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                            <Tooltip title={event.title}><Typography variant="body2" fontWeight="medium">{event.title}</Typography></Tooltip>
                                        </TableCell>
                                        <TableCell>{event.category}</TableCell>
                                        <TableCell>{dayjs(event.startDate).format('DD MMM YY, HH:mm')}</TableCell>
                                        <TableCell>{event.address?.city || (event.venue?.name ? `${event.venue.name}, ${event.venue.address?.city}` : 'N/A')}</TableCell>
                                        <TableCell><Chip label={event.status} size="small" variant="outlined" color={event.status === 'Scheduled' ? 'info' : event.status === 'Completed' ? 'success' : event.status === 'Cancelled' ? 'error' : 'default'}/></TableCell>
                                        <TableCell sx={{textAlign:'center', whiteSpace: 'nowrap'}}>
                                            <Tooltip title="Edit Event">
                                                <IconButton onClick={() => handleOpenModal(event)} size="small"><EditIcon /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Event">
                                                <IconButton onClick={() => handleDeleteClick(event)} size="small" color="error"><DeleteIcon /></IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={totalEvents}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {setRowsPerPage(parseInt(e.target.value, 10)); setPage(0);}}
                    />
                </Paper>
            )}

            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}><TextField name="title" label="Event Title" value={currentEvent.title} onChange={handleChange} fullWidth required margin="dense"/></Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth margin="dense" required>
                                    <InputLabel>Category</InputLabel>
                                    <Select name="category" label="Category" value={currentEvent.category} onChange={handleChange}>
                                        {eventCategories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}><TextField name="description" label="Description" value={currentEvent.description} onChange={handleChange} fullWidth required multiline rows={3} margin="dense"/></Grid>
                            <Grid item xs={12} sm={6}><DatePicker label="Start Date & Time *" value={currentEvent.startDate} onChange={(date) => handleDateChange('startDate', date)} slotProps={{ textField: { fullWidth: true, margin:"dense", required: true } }} /></Grid>
                            <Grid item xs={12} sm={6}><DatePicker label="End Date & Time (Optional)" value={currentEvent.endDate} onChange={(date) => handleDateChange('endDate', date)} slotProps={{ textField: { fullWidth: true, margin:"dense" } }} minDate={currentEvent.startDate || undefined} /></Grid>
                            <Grid item xs={12} sm={6}><TextField name="language" label="Language (Optional)" value={currentEvent.language} onChange={handleChange} fullWidth margin="dense"/></Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth margin="dense" required>
                                    <InputLabel>Status</InputLabel>
                                    <Select name="status" label="Status" value={currentEvent.status} onChange={handleChange}>
                                        {eventStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}><Typography variant="subtitle2" sx={{mt:1, mb: -1}}>Location Address</Typography></Grid>
                            <Grid item xs={12} sm={6} md={3}><TextField name="address.street" label="Street (Optional)" value={currentEvent.address.street} onChange={handleChange} fullWidth margin="dense"/></Grid>
                            <Grid item xs={12} sm={6} md={3}><TextField name="address.city" label="City" value={currentEvent.address.city} onChange={handleChange} fullWidth required margin="dense"/></Grid>
                            <Grid item xs={12} sm={6} md={3}><TextField name="address.state" label="State" value={currentEvent.address.state} onChange={handleChange} fullWidth required margin="dense"/></Grid>
                            <Grid item xs={12} sm={6} md={3}><TextField name="address.zipCode" label="Zip Code (Optional)" value={currentEvent.address.zipCode} onChange={handleChange} fullWidth margin="dense"/></Grid>
                            
                            <Grid item xs={12}><TextField name="imageUrl" label="Image URL (Optional)" value={currentEvent.imageUrl} onChange={handleChange} fullWidth type="url" margin="dense"/></Grid>
                            
                            <Grid item xs={12}><Typography variant="subtitle2" sx={{mt:1, mb: -1}}>Tags (Optional)</Typography></Grid>
                            <Grid item xs={12} sm={9}><TextField value={tagInput} onChange={(e) => setTagInput(e.target.value)} label="Add Tag" fullWidth margin="dense" size="small" helperText="Type and press Add Tag"/></Grid>
                            <Grid item xs={12} sm={3} sx={{display:'flex', alignItems:'center'}}><Button onClick={addTag} variant="outlined" size="small" fullWidth sx={{height: '40px', mt:'8px'}}>Add Tag</Button></Grid>
                            <Grid item xs={12}>{currentEvent.tags.map(t => <Chip key={t} label={t} onDelete={() => removeTag(t)} sx={{mr:0.5, mb:0.5}}/>)}</Grid>

                            <Grid item xs={12}><Typography variant="subtitle2" sx={{mt:1, mb: -1}}>Organizer Info (Optional)</Typography></Grid>
                            <Grid item xs={12} sm={6}><TextField name="organizerInfo.name" label="Organizer Name" value={currentEvent.organizerInfo.name} onChange={handleChange} fullWidth margin="dense"/></Grid>
                            <Grid item xs={12} sm={6}><TextField name="organizerInfo.contact" label="Organizer Contact" value={currentEvent.organizerInfo.contact} onChange={handleChange} fullWidth margin="dense"/></Grid>
                            {/* TODO: Add Venue Link (Dropdown of existing venues) - More complex */}
                            {/* <Grid item xs={12}><TextField name="venue" label="Venue ID (Optional)" value={currentEvent.venue} onChange={handleChange} fullWidth margin="dense" helperText="Link to an existing Venue by ID"/></Grid> */}
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{px:3, pb:2}}>
                        <Button onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">{isEditing ? 'Save Changes' : 'Create Event'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete event "{eventToDelete?.title}"?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EventManagement;