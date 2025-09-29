// client/src/components/admin/VenueManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllVenuesAdminApi, updateVenueAdminApi } from '../../api/admin'; // Using admin-specific API for clarity
import {
    Box, Button, Typography, Paper, List, ListItem, ListItemText, IconButton,
    CircularProgress, Alert, Grid, Tooltip, Divider, Chip, Switch, FormControlLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit'; // Placeholder for future edit functionality
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const VenueManagement = () => {
    const [venues, setVenues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalVenues, setTotalVenues] = useState(0);

    const fetchVenues = useCallback(async (currentPage, currentRowsPerPage) => {
        setIsLoading(true);
        setError(null);
        try {
            // Params for pagination for the admin API call
            const params = { 
                limit: currentRowsPerPage, 
                page: currentPage + 1, 
                status: 'all' // Fetch all statuses for admin
            };
            const response = await getAllVenuesAdminApi(params);
            setVenues(response.data || []);
            setTotalVenues(response.total || 0);
        } catch (err) {
            setError(err.message || 'Failed to load venues.');
            setVenues([]);
            setTotalVenues(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVenues(page, rowsPerPage);
    }, [fetchVenues, page, rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleToggleActiveStatus = async (venueId, currentStatus) => {
        try {
            await updateVenueAdminApi(venueId, { isActive: !currentStatus });
            // Refresh data for the current page
            fetchVenues(page, rowsPerPage);
        } catch (err) {
            alert(`Failed to update venue status: ${err.message || 'Server error'}`);
        }
    };

    if (isLoading && venues.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box sx={{p:1}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Venue Management</Typography>
                {/* Add Venue button can be added later if admins can create venues directly */}
                {/* <Button variant="contained" color="primary">Add Venue</Button> */}
            </Box>

            {venues.length === 0 && !isLoading && <Typography sx={{p:2, textAlign: 'center'}}>No venues found.</Typography>}
            
            {venues.length > 0 && (
                <Paper elevation={0} variant="outlined">
                    <TableContainer>
                        <Table stickyHeader aria-label="venue table">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold'}}>Name</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>City</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Organizer</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Screens</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Status</TableCell>
                                    <TableCell sx={{fontWeight: 'bold', textAlign:'center'}}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {venues.map((venue) => (
                                    <TableRow hover key={venue._id}>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="medium">{venue.name}</Typography>
                                        </TableCell>
                                        <TableCell>{venue.address?.city || 'N/A'}</TableCell>
                                        <TableCell>{venue.organizer?.organizationName || venue.organizer?.name || 'N/A'}</TableCell>
                                        <TableCell>{venue.screens?.length || 0}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={venue.isActive ? "Active" : "Inactive"} 
                                                size="small" 
                                                color={venue.isActive ? "success" : "default"}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell sx={{textAlign:'center'}}>
                                            <Tooltip title={venue.isActive ? "Deactivate Venue" : "Activate Venue"}>
                                                <IconButton 
                                                    onClick={() => handleToggleActiveStatus(venue._id, venue.isActive)}
                                                    size="small"
                                                    color={venue.isActive ? "default" : "success"}
                                                >
                                                    {venue.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </Tooltip>
                                            {/* Placeholder for future edit button */}
                                            {/* <Tooltip title="Edit Venue">
                                                <IconButton size="small" sx={{ml:1}}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip> */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={totalVenues}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}
        </Box>
    );
};

export default VenueManagement;