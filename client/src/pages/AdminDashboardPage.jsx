// File: /client/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import PeopleIcon from '@mui/icons-material/People';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MovieIcon from '@mui/icons-material/Movie';
import TheatersIcon from '@mui/icons-material/Theaters';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import BarChartIcon from '@mui/icons-material/BarChart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // New Icon

// Import the management components
import UserManagement from '../components/admin/UserManagement';
import PromoCodeManagement from '../components/admin/PromoCodeManagement';
import CityManagement from '../components/admin/CityManagement';
import MovieManagement from '../components/admin/MovieManagement';
import VenueManagement from '../components/admin/VenueManagement';
import EventManagement from '../components/admin/EventManagement'; 
import BookingManagement from '../components/admin/BookingManagement';
import PlatformStats from '../components/admin/PlatformStats';
import ReportedReviewsManagement from '../components/admin/ReportedReviewsManagement'; // New Component

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`admin-tabpanel-${index}`}
            aria-labelledby={`admin-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3, pb: 3, px: { xs: 1, sm: 2 } }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `admin-tab-${index}`,
        'aria-controls': `admin-tabpanel-${index}`,
    };
}

const tabNameToIndex = {
    users: 0,
    promocodes: 1,
    cities: 2,
    movies: 3,
    venues: 4,
    events: 5,
    bookings: 6,
    reports: 7, // New Tab
    statistics: 8, // Index shifted
};

const AdminDashboardPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [currentTab, setCurrentTab] = useState(0);
    const [initialUserFilter, setInitialUserFilter] = useState('all');
    
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        const userFilterParam = params.get('userFilter');
        
        if (tabParam && tabNameToIndex.hasOwnProperty(tabParam)) {
            setCurrentTab(tabNameToIndex[tabParam]);
        }
        
        if (userFilterParam) {
            setInitialUserFilter(userFilterParam);
        } else {
            setInitialUserFilter('all');
        }
    }, [location.search]);


    const handleTabChange = (event, newValue) => {
        const tabKey = Object.keys(tabNameToIndex).find(key => tabNameToIndex[key] === newValue);
        if (tabKey) {
            navigate(`/admin?tab=${tabKey}`, { replace: true });
        } else {
            navigate('/admin', { replace: true });
        }
    };
    
    return (
        <Container maxWidth="xl" sx={{ py: {xs: 2, sm: 3} }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: {xs: 'center', sm:'left'}, mb: 3 }}>
                Admin Dashboard
            </Typography>

            <Paper elevation={3} sx={{width: '100%'}}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                        value={currentTab} 
                        onChange={handleTabChange} 
                        aria-label="Admin dashboard tabs"
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto" 
                        allowScrollButtonsMobile
                    >
                        <Tab icon={<PeopleIcon />} iconPosition="start" label="Users" {...a11yProps(0)} />
                        <Tab icon={<ConfirmationNumberIcon />} iconPosition="start" label="Promo Codes" {...a11yProps(1)} />
                        <Tab icon={<LocationCityIcon />} iconPosition="start" label="Cities" {...a11yProps(2)} />
                        <Tab icon={<MovieIcon />} iconPosition="start" label="Movies" {...a11yProps(3)} />
                        <Tab icon={<TheatersIcon />} iconPosition="start" label="Venues" {...a11yProps(4)} />
                        <Tab icon={<EventNoteIcon />} iconPosition="start" label="Events" {...a11yProps(5)} />
                        <Tab icon={<BookOnlineIcon />} iconPosition="start" label="Bookings" {...a11yProps(6)} />
                        <Tab icon={<ReportProblemIcon />} iconPosition="start" label="Reports" {...a11yProps(7)} />
                        <Tab icon={<BarChartIcon />} iconPosition="start" label="Statistics" {...a11yProps(8)} />
                    </Tabs>
                </Box>

                <TabPanel value={currentTab} index={0}> <UserManagement key={initialUserFilter} initialFilter={initialUserFilter} /> </TabPanel>
                <TabPanel value={currentTab} index={1}> <PromoCodeManagement /> </TabPanel>
                <TabPanel value={currentTab} index={2}> <CityManagement /> </TabPanel>
                <TabPanel value={currentTab} index={3}> <MovieManagement /> </TabPanel>
                <TabPanel value={currentTab} index={4}> <VenueManagement /> </TabPanel>
                <TabPanel value={currentTab} index={5}> <EventManagement /> </TabPanel>
                <TabPanel value={currentTab} index={6}> <BookingManagement /> </TabPanel>
                <TabPanel value={currentTab} index={7}> <ReportedReviewsManagement /> </TabPanel>
                <TabPanel value={currentTab} index={8}> <PlatformStats /> </TabPanel>
            </Paper>
        </Container>
    );
};

export default AdminDashboardPage;