// client/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import hooks
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
import ReportIcon from '@mui/icons-material/Report';

// Import the management components
import UserManagement from '../components/admin/UserManagement';
import PromoCodeManagement from '../components/admin/PromoCodeManagement';
import CityManagement from '../components/admin/CityManagement';
import MovieManagement from '../components/admin/MovieManagement';
import VenueManagement from '../components/admin/VenueManagement';
import EventManagement from '../components/admin/EventManagement'; 
import BookingManagement from '../components/admin/BookingManagement';
import PlatformStats from '../components/admin/PlatformStats';
import ReportedReviewsManagement from '../components/admin/ReportedReviewsManagement';

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
  statistics: 7,
  reported: 8
};


const AdminDashboardPage = () => {
    const location = useLocation(); // Get location object
    const navigate = useNavigate(); // For updating URL without full reload if needed

    const [currentTab, setCurrentTab] = useState(0);
    // State to hold filters that might be passed via URL for specific tabs
    const [initialUserFilter, setInitialUserFilter] = useState('all');
    // Add more initial filter states for other tabs as needed
    // e.g., const [initialBookingStatus, setInitialBookingStatus] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        const userFilterParam = params.get('userFilter');
        // Add other filter params here:
        // const bookingStatusParam = params.get('bookingStatus');

        if (tabParam && tabNameToIndex.hasOwnProperty(tabParam)) {
            setCurrentTab(tabNameToIndex[tabParam]);
        } else {
            // Default to the first tab if no valid tab param
            // Or, if currentTab is already 0, this won't cause a re-render if not needed.
            if (currentTab !== 0 && !location.search) { // Avoid setting if already default and no params
                 // setCurrentTab(0); // This might cause an extra render if default is 0 anyway
            }
        }

        if (userFilterParam) {
            setInitialUserFilter(userFilterParam);
        } else {
            setInitialUserFilter('all'); // Default if no specific filter
        }

        // Set other initial filters based on params
        // if (bookingStatusParam) setInitialBookingStatus(bookingStatusParam);


        // Optional: Clear query params after processing to keep URL clean
        // if (location.search) {
        //     navigate(location.pathname, { replace: true });
        // }

    }, [location.search, location.pathname, navigate, currentTab]); // Rerun when query params change


    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
        // When manually changing tabs, clear specific filters or reset them
        setInitialUserFilter('all'); // Reset user filter when changing main tabs
        // Reset other filters too
        // navigate(location.pathname); // Clear query params when tab is manually changed
        
        // Update URL to reflect the current tab without filters
        const tabKey = Object.keys(tabNameToIndex).find(key => tabNameToIndex[key] === newValue);
        if (tabKey) {
            navigate(`${location.pathname}?tab=${tabKey}`, { replace: true });
        } else {
            navigate(location.pathname, { replace: true });
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
                        <Tab icon={<BarChartIcon />} iconPosition="start" label="Statistics" {...a11yProps(7)} />
                        <Tab icon={<ReportIcon />} iconPosition="start" label="Reported Reviews" {...a11yProps(8)} />
                    </Tabs>
                </Box>

                <TabPanel value={currentTab} index={0}> <UserManagement key={initialUserFilter} initialFilter={initialUserFilter} /> </TabPanel>
                <TabPanel value={currentTab} index={1}> <PromoCodeManagement /> </TabPanel>
                <TabPanel value={currentTab} index={2}> <CityManagement /> </TabPanel>
                <TabPanel value={currentTab} index={3}> <MovieManagement /> </TabPanel>
                <TabPanel value={currentTab} index={4}> <VenueManagement /> </TabPanel>
                <TabPanel value={currentTab} index={5}> <EventManagement /> </TabPanel>
                <TabPanel value={currentTab} index={6}> <BookingManagement /> </TabPanel> {/* Update this if it needs initial filters */}
                <TabPanel value={currentTab} index={7}> <PlatformStats navigateToTab={setCurrentTab} /> </TabPanel>
                <TabPanel value={currentTab} index={8}> <ReportedReviewsManagement /> </TabPanel> {/* NEW PANEL */}
            </Paper>
        </Container>
    );
};

export default AdminDashboardPage;