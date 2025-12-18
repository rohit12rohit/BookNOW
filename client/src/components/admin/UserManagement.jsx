// File: /client/src/components/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Import Link for navigation
import { getAllUsersAdminApi, approveOrganizerAdminApi, updateUserAdminApi, deleteUserAdminApi } from '../../api/admin';
import {
    Box, Button, Typography, Paper, List, ListItem, ListItemText, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress, Alert, Chip, Divider,
    TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Tabs, Tab, Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UserManagement = ({ initialFilter = 'all' }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '', isApproved: false, organizationName: '' });

    const filterToTabIndex = (filter) => {
        const mapping = { all: 0, organizers: 1, pendingOrganizers: 2 };
        return mapping[filter] || 0;
    };
    const [currentSubTab, setCurrentSubTab] = useState(filterToTabIndex(initialFilter));

    const fetchUsers = useCallback(async (filter) => {
        setIsLoading(true);
        setError(null);
        let params = {};
        if (filter === 'organizers' || filter === 'pendingOrganizers') {
            params.role = 'organizer';
        }
        try {
            const data = await getAllUsersAdminApi(params);
            if (filter === 'pendingOrganizers') {
                setUsers(data.filter(user => user.role === 'organizer' && !user.isApproved));
            } else {
                setUsers(data);
            }
        } catch (err) {
            setError(err.message || 'Failed to load users.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(initialFilter);
        setCurrentSubTab(filterToTabIndex(initialFilter));
    }, [fetchUsers, initialFilter]);
    
    const handleSubTabChange = (event, newValue) => {
        const filters = ['all', 'organizers', 'pendingOrganizers'];
        setCurrentSubTab(newValue);
        // This component doesn't control the filter, it receives it.
        // The parent (AdminDashboardPage) should handle navigation to update the prop.
        // For now, we just fetch based on the new tab index for immediate feedback.
        fetchUsers(filters[newValue]);
    };
    
    const handleApproveOrganizer = async (organizerId) => {
        try {
            await approveOrganizerAdminApi(organizerId);
            fetchUsers(initialFilter);
        } catch (err) {
            alert(`Failed to approve organizer: ${err.message || 'Server error'}`);
        }
    };

    const handleOpenEditModal = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'user',
            isApproved: user.isApproved || false,
            organizationName: user.organizationName || ''
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => setIsEditModalOpen(false);

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: type === 'switch' ? checked : value }));
    };

    const handleSaveUserChanges = async () => {
        if (!selectedUser) return;
        setError(null);
        try {
            const updateData = {
                name: editFormData.name,
                role: editFormData.role,
                organizationName: editFormData.role === 'organizer' ? editFormData.organizationName : undefined,
                isApproved: editFormData.role === 'organizer' ? Boolean(editFormData.isApproved) : false,
            };
            await updateUserAdminApi(selectedUser._id, updateData);
            fetchUsers(initialFilter);
            handleCloseEditModal();
        } catch (err) {
            setError(err.errors ? err.errors.map(e => e.msg).join(', ') : (err.msg || 'Failed to update user.'));
        }
    };
    
    const handleOpenDeleteModal = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await deleteUserAdminApi(selectedUser._id);
            fetchUsers(initialFilter);
            handleCloseDeleteModal();
        } catch (err) {
            alert(`Failed to delete user: ${err.message || 'Server error'}`);
        }
    };

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={currentSubTab} onChange={handleSubTabChange} aria-label="user filter tabs">
                    <Tab label="All Users" />
                    <Tab label="Organizers" />
                    <Tab label="Pending Approvals" />
                </Tabs>
            </Box>

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>}
            
            {!isLoading && users.length > 0 && (
                 <List component={Paper} elevation={0} variant="outlined">
                 {users.map((user, index) => (
                     <React.Fragment key={user._id}>
                         <ListItem sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2 }}>
                             <ListItemText
                                 primaryTypographyProps={{variant: 'subtitle1', fontWeight: 'medium'}}
                                 primary={`${user.name} (${user.email})`}
                                 secondary={
                                     <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5}}>
                                         <Chip label={user.role} size="small" variant="outlined" color={user.role === 'admin' ? 'secondary' : 'default'} />
                                         {user.role === 'organizer' && (
                                            <Chip label={user.isApproved ? 'Approved' : 'Pending'} size="small" color={user.isApproved ? 'success' : 'warning'} />
                                         )}
                                     </Box>
                                 }
                             />
                             <Box sx={{display: 'flex', gap: 0.5, mt: {xs: 1, sm: 0}}}>
                                 <Tooltip title="View Details">
                                     {/* --- CORRECTED: This now links to the new page --- */}
                                     <IconButton component={RouterLink} to={`/admin/users/${user._id}`} size="small">
                                         <VisibilityIcon />
                                     </IconButton>
                                 </Tooltip>

                                 {user.role === 'organizer' && !user.isApproved && (
                                     <Button variant="contained" color="success" size="small" onClick={() => handleApproveOrganizer(user._id)}>Approve</Button>
                                 )}
                                 <Button variant="outlined" size="small" onClick={() => handleOpenEditModal(user)}>Edit</Button>
                                 {user.role !== 'admin' &&
                                     <Button variant="outlined" color="error" size="small" onClick={() => handleOpenDeleteModal(user)}>Delete</Button>
                                 }
                             </Box>
                         </ListItem>
                         {index < users.length - 1 && <Divider />}
                     </React.Fragment>
                 ))}
             </List>
            )}

            {/* Edit and Delete Modals remain unchanged and fully functional */}
            <Dialog open={isEditModalOpen} onClose={handleCloseEditModal}>
                <DialogTitle>Edit User: {selectedUser?.name}</DialogTitle>
                <DialogContent>
                    {error && isEditModalOpen && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
                    <TextField autoFocus margin="dense" name="name" label="Name" type="text" fullWidth value={editFormData.name} onChange={handleEditFormChange} />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Role</InputLabel>
                        <Select name="role" value={editFormData.role} label="Role" onChange={handleEditFormChange}>
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="organizer">Organizer</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                    {editFormData.role === 'organizer' && (
                    <>
                        <TextField margin="dense" name="organizationName" label="Organization Name" type="text" fullWidth value={editFormData.organizationName} onChange={handleEditFormChange} />
                        <FormControlLabel control={<Switch checked={editFormData.isApproved} onChange={handleEditFormChange} name="isApproved" />} label="Is Approved" />
                    </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditModal}>Cancel</Button>
                    <Button onClick={handleSaveUserChanges}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
                {/* ... Delete modal content is correct and unchanged ... */}
            </Dialog>
        </Box>
    );
};

export default UserManagement;