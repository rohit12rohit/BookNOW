// client/src/pages/OrganizerDashboardPage.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// Import Icons
import TheatersIcon from '@mui/icons-material/Theaters';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

// Import components for each tab
import MyVenues from '../components/organizer/MyVenues';
import OrganizerShowtimeManagement from '../components/organizer/OrganizerShowtimeManagement';
import MyEventManagement from '../components/organizer/MyEventManagement'; // The new component
import MyVenueBookingsOrganizer from '../components/organizer/MyVenueBookingsOrganizer';
import OrganizerProfileSettings from '../components/organizer/OrganizerProfileSettings';

// TabPanel helper component
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`organizer-tabpanel-${index}`}
            aria-labelledby={`organizer-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3, pb: 3, px: {xs: 1, sm: 2} }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Accessibility props helper
function a11yProps(index) {
    return {
        id: `organizer-tab-${index}`,
        'aria-controls': `organizer-tabpanel-${index}`,
    };
}

const OrganizerDashboardPage = () => {
    const location = useLocation();
    
    // Logic to set the initial tab based on URL query param
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        const tabMap = { 'venues': 0, 'showtimes': 1, 'events': 2, 'bookings': 3, 'settings': 4 };
        return tabMap[tabParam] || 0;
    };
    
    const [currentTab, setCurrentTab] = useState(getInitialTab()); 

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Container maxWidth="lg" sx={{ py: {xs: 2, sm: 3} }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: {xs: 'center', sm:'left'}, mb: 3 }}>
                Organizer Dashboard
            </Typography>

            <Paper elevation={3} sx={{width: '100%'}}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                        value={currentTab} 
                        onChange={handleTabChange} 
                        aria-label="Organizer dashboard tabs"
                        indicatorColor="secondary"
                        textColor="secondary"
                        variant="scrollable"
                        scrollButtons="auto" 
                        allowScrollButtonsMobile
                    >
                        {/* --- CORRECTED TABS WITH PROPER INDEXING --- */}
                        <Tab icon={<TheatersIcon />} iconPosition="start" label="My Venues" {...a11yProps(0)} />
                        <Tab icon={<EventSeatIcon />} iconPosition="start" label="My Showtimes" {...a11yProps(1)} />
                        <Tab icon={<EventNoteIcon />} iconPosition="start" label="My Events" {...a11yProps(2)} />
                        <Tab icon={<AssessmentIcon />} iconPosition="start" label="Venue Bookings" {...a11yProps(3)} />
                        <Tab icon={<SettingsIcon />} iconPosition="start" label="Profile/Settings" {...a11yProps(4)} />
                    </Tabs>
                </Box>

                {/* --- CORRECTED TAB PANELS WITH PROPER INDEXING --- */}
                <TabPanel value={currentTab} index={0}> <MyVenues /> </TabPanel>
                <TabPanel value={currentTab} index={1}> <OrganizerShowtimeManagement /> </TabPanel>
                <TabPanel value={currentTab} index={2}> <MyEventManagement /> </TabPanel>
                <TabPanel value={currentTab} index={3}> <MyVenueBookingsOrganizer /> </TabPanel>
                <TabPanel value={currentTab} index={4}> <OrganizerProfileSettings /> </TabPanel>
            </Paper>
        </Container>
    );
};

export default OrganizerDashboardPage;