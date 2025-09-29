// client/src/components/admin/CityManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllCitiesAdminApi, createCityAdminApi, updateCityAdminApi, deleteCityAdminApi } from '../../api/admin';
import {
    Box, Button, TextField, Typography, Paper, List, ListItem, ListItemText, IconButton, Switch, FormControlLabel,
    Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Alert, Tooltip, Divider, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const initialCityData = { name: '', state: '', isActive: true };

const CityManagement = () => {
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCity, setCurrentCity] = useState(initialCityData);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [cityToDelete, setCityToDelete] = useState(null);

    const fetchCities = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllCitiesAdminApi();
            setCities(data);
        } catch (err) {
            setError(err.message || 'Failed to load cities.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCities();
    }, [fetchCities]);

    const handleOpenModal = (city = null) => {
        if (city) {
            setIsEditing(true);
            setCurrentCity(city);
        } else {
            setIsEditing(false);
            setCurrentCity(initialCityData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setError(null); // Clear modal error
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentCity(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const { _id, createdAt, __v, ...payload } = currentCity; // Exclude non-payload fields

        try {
            if (isEditing) {
                await updateCityAdminApi(currentCity._id, payload);
            } else {
                await createCityAdminApi(payload);
            }
            fetchCities();
            handleCloseModal();
        } catch (err) {
            const apiError = err.errors ? err.errors.map(e => e.msg).join(', ') : (err.msg || err.message || 'Operation failed.');
            setError(apiError);
        }
    };

    const handleDeleteClick = (city) => {
        setCityToDelete(city);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!cityToDelete) return;
        try {
            await deleteCityAdminApi(cityToDelete._id);
            fetchCities();
            setDeleteConfirmOpen(false);
            setCityToDelete(null);
        } catch (err) {
            alert(`Failed to delete city: ${err.message || 'Server error'}`);
            setDeleteConfirmOpen(false);
        }
    };

    if (isLoading && !isModalOpen) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (error && !isModalOpen) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{p:1}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Cities</Typography>
                <Button variant="contained" color="primary" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenModal()}>
                    Add City
                </Button>
            </Box>

            {cities.length === 0 && !isLoading && <Typography sx={{p:2, textAlign: 'center'}}>No cities found.</Typography>}
            
            <List component={Paper} elevation={1}>
                {cities.map((city, index) => (
                    <React.Fragment key={city._id}>
                        <ListItem
                            secondaryAction={
                                <Box>
                                    <Tooltip title="Edit">
                                        <IconButton edge="end" aria-label="edit" onClick={() => handleOpenModal(city)} sx={{mr: 0.5}}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(city)}>
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={<Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>{city.name}</Typography>}
                                secondary={
                                    <>
                                        State: {city.state} | Status: <Chip label={city.isActive ? "Active" : "Inactive"} size="small" color={city.isActive ? "success" : "default"}/>
                                    </>
                                }
                            />
                        </ListItem>
                        {index < cities.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>

            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth>
                <DialogTitle>{isEditing ? 'Edit City' : 'Add New City'}</DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
                        <TextField name="name" label="City Name" value={currentCity.name} onChange={handleChange} fullWidth required margin="dense"/>
                        <TextField name="state" label="State" value={currentCity.state} onChange={handleChange} fullWidth required margin="dense"/>
                        <FormControlLabel control={<Switch checked={currentCity.isActive} onChange={handleChange} name="isActive" />} label="Is Active" sx={{mt:1}}/>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">{isEditing ? 'Save Changes' : 'Create City'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete city "{cityToDelete?.name}"?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CityManagement;