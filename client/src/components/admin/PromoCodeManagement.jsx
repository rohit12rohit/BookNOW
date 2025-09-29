// client/src/components/admin/PromoCodeManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllPromoCodesAdminApi, createPromoCodeAdminApi, updatePromoCodeAdminApi, deletePromoCodeAdminApi } from '../../api/admin';
import {
    Box, Button, TextField, Typography, Paper, List, ListItem, ListItemText, IconButton, Switch, FormControlLabel,
    Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Alert, Grid, Tooltip, Divider, Chip,
    MenuItem 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const initialPromoData = {
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    description: '',
    minPurchaseAmount: 0,
    maxDiscountAmount: null,
    validFrom: null,
    validUntil: null,
    maxUses: null,
    isActive: true,
};

const PromoCodeManagement = () => {
    const [promoCodes, setPromoCodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPromo, setCurrentPromo] = useState(initialPromoData);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState(null);

    const fetchPromoCodes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllPromoCodesAdminApi();
            setPromoCodes(data);
        } catch (err) {
            setError(err.message || 'Failed to load promo codes.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPromoCodes();
    }, [fetchPromoCodes]);

    const handleOpenModal = (promo = null) => {
        if (promo) {
            setIsEditing(true);
            setCurrentPromo({
                ...promo,
                validFrom: promo.validFrom ? dayjs(promo.validFrom) : null,
                validUntil: promo.validUntil ? dayjs(promo.validUntil) : null,
                maxDiscountAmount: promo.maxDiscountAmount === undefined ? null : promo.maxDiscountAmount,
                maxUses: promo.maxUses === undefined ? null : promo.maxUses,
            });
        } else {
            setIsEditing(false);
            setCurrentPromo(initialPromoData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentPromo(initialPromoData);
        setError(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentPromo(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? null : Number(value)) : value)
        }));
    };
    
    const handleDateChange = (name, date) => {
        setCurrentPromo(prev => ({ ...prev, [name]: date }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const promoDataToSubmit = {
            ...currentPromo,
            code: currentPromo.code.toUpperCase(),
            validFrom: currentPromo.validFrom ? currentPromo.validFrom.toISOString() : null,
            validUntil: currentPromo.validUntil ? currentPromo.validUntil.toISOString() : null,
            maxDiscountAmount: currentPromo.maxDiscountAmount === '' ? null : Number(currentPromo.maxDiscountAmount) || null,
            maxUses: currentPromo.maxUses === '' ? null : Number(currentPromo.maxUses) || null,
        };
        
        const { _id, uses, createdAt, __v, ...payload } = promoDataToSubmit;

        try {
            if (isEditing) {
                await updatePromoCodeAdminApi(currentPromo._id, payload);
            } else {
                await createPromoCodeAdminApi(payload);
            }
            fetchPromoCodes();
            handleCloseModal();
        } catch (err) {
             const apiError = err.errors ? err.errors.map(er => er.msg).join(', ') : (err.msg || err.message || 'Operation failed.');
            setError(apiError);
        }
    };

    const handleDeleteClick = (promo) => {
        setPromoToDelete(promo);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!promoToDelete) return;
        try {
            await deletePromoCodeAdminApi(promoToDelete._id);
            fetchPromoCodes();
        } catch (err) {
            alert(`Failed to delete promo code: ${err.message || 'Server error'}`);
        } finally {
            setDeleteConfirmOpen(false);
            setPromoToDelete(null);
        }
    };

    if (isLoading && !isModalOpen) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (error && !isModalOpen) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{p:1}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Promo Codes</Typography>
                <Button variant="contained" color="primary" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenModal()}>
                    Add Promo Code
                </Button>
            </Box>

            {promoCodes.length === 0 && !isLoading && <Typography sx={{p:2, textAlign: 'center'}}>No promo codes found.</Typography>}
            
            <List component={Paper} elevation={1}>
                {promoCodes.map((promo, index) => (
                    <React.Fragment key={promo._id}>
                        <ListItem
                            secondaryAction={
                                <Box>
                                    <Tooltip title="Edit">
                                        <IconButton edge="end" aria-label="edit" onClick={() => handleOpenModal(promo)} sx={{mr: 0.5}}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(promo)}>
                                            <DeleteIcon color="error"/>
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={<Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>{promo.code}</Typography>}
                                secondary={
                                    <>
                                        Type: {promo.discountType} ({promo.discountValue}{promo.discountType === 'percentage' ? '%' : ' Fixed'}) | Uses: {promo.uses || 0}/{promo.maxUses || '∞'}
                                        <br/>
                                        Status: <Chip label={promo.isActive ? 'Active' : 'Inactive'} size="small" color={promo.isActive ? 'success' : 'default'} sx={{mr:0.5}}/>
                                        Valid: {promo.validFrom ? dayjs(promo.validFrom).format('DD MMM YY') : 'Always'} - {promo.validUntil ? dayjs(promo.validUntil).format('DD MMM YY') : 'Never Expires'}
                                        {promo.description && <Typography variant="caption" display="block">Desc: {promo.description}</Typography>}
                                    </>
                                }
                            />
                        </ListItem>
                        {index < promoCodes.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>

            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Promo Code' : 'Add New Promo Code'}</DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField name="code" label="Promo Code" value={currentPromo.code} onChange={handleChange} fullWidth required disabled={isEditing} helperText={isEditing ? "Code cannot be changed" : "E.g., SUMMER25"} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel control={<Switch checked={currentPromo.isActive} onChange={handleChange} name="isActive" />} label="Is Active" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select name="discountType" label="Discount Type" value={currentPromo.discountType} onChange={handleChange} fullWidth required>
                                    <MenuItem value="percentage">Percentage</MenuItem>
                                    <MenuItem value="fixed">Fixed Amount</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField name="discountValue" label="Discount Value" type="number" value={currentPromo.discountValue} onChange={handleChange} fullWidth required inputProps={{ min: 0 }} />
                            </Grid>
                             <Grid item xs={12}>
                                <TextField name="description" label="Description (Optional)" value={currentPromo.description} onChange={handleChange} fullWidth multiline rows={2}/>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DatePicker label="Valid From (Optional)" name="validFrom" value={currentPromo.validFrom} onChange={(date) => handleDateChange('validFrom', date)} slotProps={{ textField: { fullWidth: true, helperText: "Leave empty if no start date" } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DatePicker label="Valid Until (Optional)" name="validUntil" value={currentPromo.validUntil} onChange={(date) => handleDateChange('validUntil', date)} slotProps={{ textField: { fullWidth: true, helperText: "Leave empty if no expiry" } }} minDate={currentPromo.validFrom || undefined} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField name="minPurchaseAmount" label="Min Purchase (Optional)" type="number" value={currentPromo.minPurchaseAmount} onChange={handleChange} fullWidth inputProps={{ min: 0 }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField name="maxDiscountAmount" label="Max Discount (Optional)" type="number" value={currentPromo.maxDiscountAmount || ''} onChange={handleChange} fullWidth inputProps={{ min: 0 }} helperText="For percentage type" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField name="maxUses" label="Max Uses (Optional)" type="number" value={currentPromo.maxUses || ''} onChange={handleChange} fullWidth inputProps={{ min: 1 }} helperText="Total times code can be used"/>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">{isEditing ? 'Save Changes' : 'Create Promo Code'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete promo code "{promoToDelete?.code}"?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PromoCodeManagement;