// client/src/components/admin/MovieManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getMoviesApi, createMovieApi, updateMovieApi, deleteMovieApi } from '../../api/movies';
import {
    Box, Button, TextField, Typography, Paper, List, ListItem, ListItemText, IconButton,
    Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Alert, Grid, Tooltip, Divider, Chip,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const initialMovieData = {
    title: '',
    description: '',
    releaseDate: null,
    duration: '',
    movieLanguage: '',
    genre: [],
    cast: [],
    crew: [],
    posterUrl: '',
    trailerUrl: '',
    censorRating: '',
    format: [],
};

const censorRatings = ['U', 'U/A', 'A', 'S', 'N/A'];
const movieFormats = ['2D', '3D', 'IMAX', '4DX', 'SCREENX'];

const MovieManagement = () => {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [listError, setListError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMovie, setCurrentMovie] = useState(initialMovieData);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [movieToDelete, setMovieToDelete] = useState(null);
    const [genreInput, setGenreInput] = useState('');
    const [castInput, setCastInput] = useState('');
    const [crewInput, setCrewInput] = useState('');

    const fetchMovies = useCallback(async () => {
        setIsLoading(true);
        setListError(null);
        try {
            const response = await getMoviesApi({ limit: 100, sort: 'releaseDate_desc' });
            setMovies(response.data || []);
        } catch (err) {
            setListError(err.message || 'Failed to load movies.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    const handleOpenModal = (movie = null) => {
        setError(null);
        if (movie) {
            setIsEditing(true);
            setCurrentMovie({
                ...initialMovieData,
                ...movie,
                releaseDate: movie.releaseDate ? dayjs(movie.releaseDate) : null,
                genre: Array.isArray(movie.genre) ? movie.genre : [],
                cast: Array.isArray(movie.cast) ? movie.cast : [],
                crew: Array.isArray(movie.crew) ? movie.crew : [],
                format: Array.isArray(movie.format) ? movie.format : [],
                duration: movie.duration || '',
            });
        } else {
            setIsEditing(false);
            setCurrentMovie(initialMovieData);
        }
        setGenreInput('');
        setCastInput('');
        setCrewInput('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentMovie(initialMovieData);
        setError(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentMovie(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setCurrentMovie(prev => ({ ...prev, releaseDate: date }));
    };

    const handleArrayInputChange = (setter) => (event) => {
        setter(event.target.value);
    };
    
    const addToArrayField = (field, value, setter) => {
        if (value.trim() === '') return;
        setCurrentMovie(prev => ({
            ...prev,
            [field]: [...new Set([...(prev[field] || []), value.trim()])]
        }));
        if(setter) setter('');
    };
    
    const removeFromArrayField = (field, itemToRemove) => {
        setCurrentMovie(prev => ({
            ...prev,
            [field]: (prev[field] || []).filter(item => item !== itemToRemove)
        }));
    };

    const handleFormatSelectChange = (event) => {
        const { target: { value } } = event;
        const newSelectedFormats = typeof value === 'string' ? value.split(',') : value;
        setCurrentMovie(prev => ({ ...prev, format: newSelectedFormats }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        const movieDataToSubmit = {
            ...currentMovie,
            releaseDate: currentMovie.releaseDate ? currentMovie.releaseDate.toISOString() : null,
            duration: Number(currentMovie.duration) || 0,
            genre: currentMovie.genre || [],
            cast: currentMovie.cast || [],
            crew: currentMovie.crew || [],
            format: currentMovie.format || [],
        };

        if (!movieDataToSubmit.title || !movieDataToSubmit.description || !movieDataToSubmit.releaseDate || !movieDataToSubmit.duration || !movieDataToSubmit.movieLanguage || movieDataToSubmit.genre.length === 0 ) {
            setError("Please fill in all required fields: Title, Description, Release Date, Duration, Language, and at least one Genre.");
            return;
        }

        try {
            if (isEditing) {
                await updateMovieApi(currentMovie._id, movieDataToSubmit);
            } else {
                await createMovieApi(movieDataToSubmit);
            }
            fetchMovies();
            handleCloseModal();
        } catch (err) {
            const apiError = err.errors ? err.errors.map(er => er.msg).join(', ') : (err.msg || err.message || 'Operation failed.');
            setError(apiError);
        }
    };

    const handleDeleteClick = (movie) => {
        setMovieToDelete(movie);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!movieToDelete) return;
        try {
            await deleteMovieApi(movieToDelete._id);
            fetchMovies();
        } catch (err) {
            alert(`Failed to delete movie: ${err.message || 'Server error'}`);
        } finally {
            setDeleteConfirmOpen(false);
            setMovieToDelete(null);
        }
    };

    if (isLoading && !isModalOpen) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (listError && !isModalOpen) return <Alert severity="error">{listError}</Alert>;

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Movies</Typography>
                <Button variant="contained" color="primary" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenModal()}>
                    Add Movie
                </Button>
            </Box>

            {!isLoading && movies.length === 0 && <Typography sx={{p:2, textAlign: 'center'}}>No movies found.</Typography>}
            
            <List component={Paper} elevation={0} variant="outlined">
                {movies.map((movie, index) => (
                    <React.Fragment key={movie._id}>
                        <ListItem
                            sx={{flexWrap: 'wrap'}}
                            secondaryAction={
                                <Box sx={{display: 'flex', gap: 0.5, mt: {xs:1, sm:0}}}>
                                    <Tooltip title="Edit">
                                        <IconButton edge="end" aria-label="edit" onClick={() => handleOpenModal(movie)} size="small">
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(movie)} size="small">
                                            <DeleteIcon color="error"/>
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={<Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>{movie.title}</Typography>}
                                secondary={
                                    <Box>
                                        Language: {movie.movieLanguage} | Duration: {movie.duration} min
                                        <Typography variant="caption" display="block">Release: {dayjs(movie.releaseDate).format('DD MMM YYYY')}</Typography>
                                        <Typography variant="caption" display="block">Formats: {(movie.format || []).join(', ') || 'N/A'}</Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                        {index < movies.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>

            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Movie' : 'Add New Movie'}</DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
                        <Grid container spacing={2}>
                            {/* Corrected TextFields */}
                            <Grid item xs={12} sm={8}><TextField name="title" label="Title" value={currentMovie.title} onChange={handleChange} fullWidth required margin="dense"/></Grid>
                            <Grid item xs={12} sm={4}><TextField name="movieLanguage" label="Language" value={currentMovie.movieLanguage} onChange={handleChange} fullWidth required margin="dense"/></Grid>
                            <Grid item xs={12}><TextField name="description" label="Description" value={currentMovie.description} onChange={handleChange} fullWidth required multiline rows={3} margin="dense"/></Grid>
                            <Grid item xs={12} sm={4}><DatePicker label="Release Date" value={currentMovie.releaseDate} onChange={handleDateChange} slotProps={{ textField: { fullWidth: true, required: true, margin:"dense" } }} /></Grid>
                            <Grid item xs={12} sm={4}><TextField name="duration" label="Duration (minutes)" type="number" value={currentMovie.duration} onChange={handleChange} fullWidth required inputProps={{min: 0}} margin="dense"/></Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth margin="dense" required>
                                    <InputLabel>Censor Rating</InputLabel>
                                    <Select name="censorRating" value={currentMovie.censorRating} label="Censor Rating" onChange={handleChange}>
                                        {censorRatings.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Corrected Format Multi-Select */}
                            <Grid item xs={12}>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel>Formats</InputLabel>
                                    <Select
                                        multiple
                                        name="format"
                                        value={currentMovie.format}
                                        onChange={handleFormatSelectChange}
                                        label="Formats"
                                        renderValue={(selected) => (selected || []).join(', ')}
                                    >
                                        {movieFormats.map(f => (
                                            <MenuItem key={f} value={f}>{f}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            {/* Other array fields */}
                            <Grid item xs={12}><Typography variant="subtitle2" sx={{mt:1}}>Genres *</Typography></Grid>
                            <Grid item xs={12} sm={9}><TextField value={genreInput} onChange={handleArrayInputChange(setGenreInput)} label="Add Genre" fullWidth margin="dense" size="small"/></Grid>
                            <Grid item xs={12} sm={3} sx={{display:'flex', alignItems:'center'}}><Button onClick={() => addToArrayField('genre', genreInput, setGenreInput)} variant="outlined" size="small" fullWidth>Add</Button></Grid>
                            <Grid item xs={12}>{(currentMovie.genre || []).map(g => <Chip key={g} label={g} onDelete={() => removeFromArrayField('genre', g)} sx={{mr:0.5, mb:0.5}}/>)}</Grid>

                            {/* Cast & Crew, Poster & Trailer URL fields remain the same */}
                            <Grid item xs={12}><Typography variant="subtitle2" sx={{mt:1}}>Cast</Typography></Grid>
                            <Grid item xs={12} sm={9}><TextField value={castInput} onChange={handleArrayInputChange(setCastInput)} label="Add Cast Member" fullWidth margin="dense" size="small"/></Grid>
                            <Grid item xs={12} sm={3} sx={{display:'flex', alignItems:'center'}}><Button onClick={() => addToArrayField('cast', castInput, setCastInput)} variant="outlined" size="small" fullWidth>Add</Button></Grid>
                            <Grid item xs={12}>{(currentMovie.cast || []).map(c => <Chip key={c} label={c} onDelete={() => removeFromArrayField('cast', c)} sx={{mr:0.5, mb:0.5}}/>)}</Grid>
                            
                            <Grid item xs={12}><Typography variant="subtitle2" sx={{mt:1}}>Crew</Typography></Grid>
                            <Grid item xs={12} sm={9}><TextField value={crewInput} onChange={handleArrayInputChange(setCrewInput)} label="Add Crew Member" fullWidth margin="dense" size="small"/></Grid>
                            <Grid item xs={12} sm={3} sx={{display:'flex', alignItems:'center'}}><Button onClick={() => addToArrayField('crew', crewInput, setCrewInput)} variant="outlined" size="small" fullWidth>Add</Button></Grid>
                            <Grid item xs={12}>{(currentMovie.crew || []).map(cr => <Chip key={cr} label={cr} onDelete={() => removeFromArrayField('crew', cr)} sx={{mr:0.5, mb:0.5}}/>)}</Grid>
                            
                            <Grid item xs={12} sm={6}><TextField name="posterUrl" label="Poster URL" value={currentMovie.posterUrl} onChange={handleChange} fullWidth margin="dense" type="url"/></Grid>
                            <Grid item xs={12} sm={6}><TextField name="trailerUrl" label="Trailer URL (Optional)" value={currentMovie.trailerUrl} onChange={handleChange} fullWidth margin="dense" type="url"/></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{px:3, pb:2}}>
                        <Button onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">{isEditing ? 'Save Changes' : 'Create Movie'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete movie "{movieToDelete?.title}"?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MovieManagement;