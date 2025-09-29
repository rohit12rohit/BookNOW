// File: /client/src/pages/organizer/OrganizerVenueFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createVenueApi, getVenueByIdApi, updateVenueApi } from '../../api/venues';
import {
    Container, Typography, Box, Paper, TextField, Button, Grid, CircularProgress, Alert,
    FormGroup, FormControlLabel, Checkbox, IconButton, List, ListItem, ListItemText, Divider, Chip // Added Chip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

const initialVenueState = {
    name: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    facilities: [],
    screens: [],
    isActive: true,
};

const initialScreenState = { name: '', capacity: '', seatLayoutInput: '' };

const OrganizerVenueFormPage = ({ mode = 'create' }) => {
    const navigate = useNavigate();
    const { venueId } = useParams();
    const [venueData, setVenueData] = useState(initialVenueState);
    const [currentScreen, setCurrentScreen] = useState(initialScreenState);
    const [facilityInput, setFacilityInput] = useState(''); // State for the facility input field
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const [pageTitle, setPageTitle] = useState('Add New Venue');

    useEffect(() => {
        if (mode === 'edit' && venueId) {
            setPageTitle('Edit Venue');
            setIsLoading(true);
            getVenueByIdApi(venueId)
                .then(data => {
                    setVenueData({
                        ...initialVenueState,
                        ...data,
                        address: data.address || initialVenueState.address,
                        facilities: Array.isArray(data.facilities) ? data.facilities : [],
                        screens: Array.isArray(data.screens) ? data.screens.map(s => ({
                            ...s,
                            seatLayoutInput: s.seatLayout ? JSON.stringify(s.seatLayout, null, 2) : ''
                        })) : [],
                    });
                })
                .catch(err => setFormError(err.message || 'Failed to load venue data for editing.'))
                .finally(() => setIsLoading(false));
        } else {
            setPageTitle('Add New Venue');
            setVenueData(initialVenueState);
        }
    }, [mode, venueId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setVenueData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setVenueData(prev => ({
            ...prev,
            address: { ...prev.address, [name]: value }
        }));
    };

    // --- CORRECTED FACILITY HANDLING ---
    const handleFacilityInputChange = (e) => {
        setFacilityInput(e.target.value);
    };

    const handleFacilityAdd = () => {
        const newFacility = facilityInput.trim();
        if (newFacility && !venueData.facilities.includes(newFacility)) {
            setVenueData(prev => ({
                ...prev,
                facilities: [...prev.facilities, newFacility]
            }));
        }
        setFacilityInput(''); // Clear input field after adding
    };

    const handleFacilityRemove = (facilityToRemove) => {
        setVenueData(prev => ({
            ...prev,
            facilities: prev.facilities.filter(f => f !== facilityToRemove)
        }));
    };
    // --- END OF CORRECTED FACILITY HANDLING ---

    const handleScreenChange = (e) => {
        const { name, value } = e.target;
        setCurrentScreen(prev => ({ ...prev, [name]: value }));
    };

    const handleAddScreen = () => {
        if (!currentScreen.name.trim() || !currentScreen.capacity.trim()) {
            setFormError("Screen Name and Capacity are required.");
            return;
        }
        let parsedLayout;
        try {
            if (currentScreen.seatLayoutInput.trim() === '') {
                parsedLayout = { rows: [{ rowId: 'A', seats: Array.from({ length: 10 }, (_, i) => ({ seatNumber: (i + 1).toString(), type: 'Normal' })) }] };
            } else {
                parsedLayout = JSON.parse(currentScreen.seatLayoutInput);
                if (!parsedLayout.rows || !Array.isArray(parsedLayout.rows)) {
                    throw new Error("Seat layout must have a 'rows' array.");
                }
            }
            setVenueData(prev => ({
                ...prev,
                screens: [...prev.screens, { name: currentScreen.name.trim(), capacity: parseInt(currentScreen.capacity), seatLayout: parsedLayout }]
            }));
            setCurrentScreen(initialScreenState);
            setFormError(null);
        } catch (jsonError) {
            setFormError(`Invalid Seat Layout JSON: ${jsonError.message}. Please provide valid JSON or leave empty for default.`);
        }
    };

    const handleRemoveScreen = (indexToRemove) => {
        setVenueData(prev => ({
            ...prev,
            screens: prev.screens.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError(null);

        if (!venueData.name.trim() || !venueData.address.city.trim() || !venueData.address.state.trim() || !venueData.address.zipCode.trim() || !venueData.address.street.trim()) {
            setFormError("Venue Name and full Address fields are required.");
            setIsLoading(false);
            return;
        }
        if (venueData.screens.length === 0) {
            setFormError("At least one screen is required. Add a screen with default layout if unsure.");
            setIsLoading(false);
            return;
        }
        
        const payload = {
            ...venueData,
            screens: venueData.screens.map(s => ({
                name: s.name,
                capacity: parseInt(s.capacity, 10),
                seatLayout: s.seatLayout, // seatLayout is already an object
            }))
        };
        // No need to delete seatLayoutInput from payload as it's not part of venueData.screens objects being submitted

        try {
            if (mode === 'edit') {
                await updateVenueApi(venueId, payload);
            } else {
                await createVenueApi(payload);
            }
            navigate('/organizer?tab=venues');
        } catch (err) {
            const apiError = err.errors ? err.errors.map(er => er.msg).join(', ') : (err.msg || err.message || 'Operation failed.');
            setFormError(apiError);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && mode === 'edit' && !venueData.name) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                    {pageTitle}
                </Typography>
                {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Venue Name and Address Fields ... (remain the same as before) */}
                        <Grid item xs={12}>
                            <TextField name="name" label="Venue Name" value={venueData.name} onChange={handleChange} fullWidth required />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField name="street" label="Street Address" value={venueData.address.street} onChange={handleAddressChange} fullWidth required />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField name="city" label="City" value={venueData.address.city} onChange={handleAddressChange} fullWidth required />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField name="state" label="State" value={venueData.address.state} onChange={handleAddressChange} fullWidth required />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField name="zipCode" label="Zip Code" value={venueData.address.zipCode} onChange={handleAddressChange} fullWidth required />
                        </Grid>

                        {/* --- CORRECTED FACILITIES SECTION --- */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }}><Typography variant="overline">Facilities</Typography></Divider>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TextField
                                    label="Add Facility (e.g., Parking, F&B)"
                                    value={facilityInput}
                                    onChange={handleFacilityInputChange} // Use specific handler for facility input
                                    size="small"
                                    sx={{flexGrow: 1, mr: 1}}
                                    onKeyPress={(e) => { // Optional: Add facility on Enter key
                                        if (e.key === 'Enter') {
                                            e.preventDefault(); // Prevent form submission
                                            handleFacilityAdd();
                                        }
                                    }}
                                />
                                <Button variant="outlined" onClick={handleFacilityAdd} startIcon={<AddCircleOutlineIcon />}>Add</Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, p: 1, border: venueData.facilities.length > 0 ? '1px dashed grey' : 'none', borderRadius: 1, minHeight: venueData.facilities.length > 0 ? 'auto' : '0px' }}>
                                {venueData.facilities.map((facility, index) => ( // Added index for key just in case of duplicate facility names during input, though Set would prevent it
                                    <Chip 
                                        key={`${facility}-${index}`} 
                                        label={facility} 
                                        onDelete={() => handleFacilityRemove(facility)} 
                                        color="secondary"
                                        variant="outlined"
                                    />
                                ))}
                                {venueData.facilities.length === 0 && <Typography variant="caption" color="textSecondary">No facilities added yet.</Typography>}
                            </Box>
                        </Grid>
                        {/* --- END OF CORRECTED FACILITIES SECTION --- */}


                        {/* Screens Section ... (remains the same as before) ... */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }}><Typography variant="overline">Screens</Typography></Divider>
                            <Paper variant="outlined" sx={{p:2, mb:2}}>
                                <Grid container spacing={2} alignItems="flex-start">
                                    <Grid item xs={12} sm={4}>
                                        <TextField name="name" label="Screen Name (e.g., Audi 1)" value={currentScreen.name} onChange={handleScreenChange} fullWidth size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField name="capacity" label="Capacity" type="number" value={currentScreen.capacity} onChange={handleScreenChange} fullWidth size="small" inputProps={{ min: 1 }} />
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                         <TextField name="seatLayoutInput" label="Seat Layout (JSON or Empty for Default)" value={currentScreen.seatLayoutInput} onChange={handleScreenChange} fullWidth multiline rows={3} size="small" helperText='Example: {"rows":[{"rowId":"A","seats":[{"seatNumber":"1","type":"Normal"}]}]}'/>
                                    </Grid>
                                    <Grid item xs={12} sx={{textAlign: 'right'}}>
                                        <Button variant="contained" color="info" onClick={handleAddScreen} startIcon={<AddCircleOutlineIcon />} size="small">
                                            Add Screen
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                            {venueData.screens.length > 0 && (
                                <List dense>
                                    {venueData.screens.map((screen, index) => (
                                        <ListItem
                                            key={index}
                                            divider
                                            secondaryAction={
                                                <IconButton edge="end" aria-label="delete screen" onClick={() => handleRemoveScreen(index)}>
                                                    <DeleteIcon color="error" />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemText primary={`${screen.name} (Capacity: ${screen.capacity})`} secondary={`Layout: ${screen.seatLayoutInput ? 'Custom JSON' : (screen.seatLayout ? 'Defined' : 'Default if empty')}`} />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Grid>
                        
                        <Grid item xs={12}>
                             <FormControlLabel
                                control={<Checkbox checked={venueData.isActive} onChange={(e) => setVenueData(prev => ({...prev, isActive: e.target.checked}))} name="isActive" />}
                                label="Venue is Active (visible to public)"
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
                            <Button type="submit" variant="contained" color="success" size="large" disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : (mode === 'edit' ? 'Save Venue Changes' : 'Create Venue')}
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/organizer?tab=venues')} sx={{ ml: 2 }} disabled={isLoading}>
                                Cancel
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default OrganizerVenueFormPage;