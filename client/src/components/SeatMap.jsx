// client/src/components/SeatMap.jsx (Accept seatLayoutRows Prop)
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Seat from './Seat';
import Divider from '@mui/material/Divider';
// Import icons used in Legend
import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import BlockIcon from '@mui/icons-material/Block';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';

// Expect 'seatLayoutRows' prop which should be the array of rows
const SeatMap = ({ seatLayoutRows, selectedSeats, onSeatSelect }) => {
    console.log('[SeatMap Component] Received props:', { seatLayoutRows, selectedSeats });

    // Check if seatLayoutRows is a valid array
    const isValidLayout = Array.isArray(seatLayoutRows) && seatLayoutRows.length > 0;
    console.log('[SeatMap Component] Is layout valid?', isValidLayout);

    if (!isValidLayout) {
        return <Typography color="text.secondary" align="center" sx={{p: 3}}>Seat layout data is missing or invalid.</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: 'auto', bgcolor: 'grey.100' }}>
             {/* Screen Indicator */}
             <Box sx={{ width: '80%', maxWidth: '400px', height: '6px', bgcolor: 'grey.700', mb: 3, borderRadius: '3px' }} />
             <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary' }}>SCREEN THIS WAY</Typography>

            {/* Rows - Map over seatLayoutRows directly */}
            {seatLayoutRows.map((row) => (
                (row && row.rowId && Array.isArray(row.seats)) ? (
                    <Box key={row.rowId} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Typography variant="caption" sx={{ width: '25px', textAlign: 'center', fontWeight: 'medium', color: 'text.secondary' }}>
                            {row.rowId}
                        </Typography>
                        {row.seats.map((seat) => (
                            (seat && seat.seatNumber) ? (
                                <Seat
                                    key={`${row.rowId}${seat.seatNumber}`}
                                    seatData={{ ...seat, identifier: `${row.rowId}${seat.seatNumber}` }}
                                    isSelected={selectedSeats.includes(`${row.rowId}${seat.seatNumber}`)}
                                    onSelect={onSeatSelect}
                                />
                            ) : null
                        ))}
                         <Typography variant="caption" sx={{ width: '25px', textAlign: 'center', fontWeight: 'medium', color: 'text.secondary' }}>
                            {row.rowId}
                        </Typography>
                    </Box>
                ) : null
            ))}

             {/* Legend */}
            <Divider sx={{ width: '90%', my: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1, sm: 2 }, fontSize: '0.75rem', color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><ChairOutlinedIcon color="success" sx={{ mr: 0.5, fontSize: '1rem' }} /> Available</Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><EventSeatIcon color="error" sx={{ mr: 0.5, fontSize: '1rem' }} /> Selected</Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><BlockIcon color="disabled" sx={{ mr: 0.5, fontSize: '1rem' }} /> Booked</Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><AirlineSeatReclineNormalIcon color="warning" sx={{ mr: 0.5, fontSize: '1rem' }} /> Premium</Box>
            </Box>
        </Box>
    );
};

export default SeatMap;

