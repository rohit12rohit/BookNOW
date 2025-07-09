// // client/src/components/Seat.jsx
// import React from 'react';
// import Button from '@mui/material/Button';
// import Tooltip from '@mui/material/Tooltip';
// import ChairIcon from '@mui/icons-material/Chair'; // Generic seat icon
// import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined'; // Available
// import EventSeatIcon from '@mui/icons-material/EventSeat'; // Selected
// import AccessibleIcon from '@mui/icons-material/Accessible'; // Wheelchair
// import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal'; // Recliner?
// import BlockIcon from '@mui/icons-material/Block'; // Unavailable/Booked

// const Seat = ({ seatData, isSelected, onSelect }) => {
//     const { identifier, type, isBooked } = seatData;

//     let seatIcon = <ChairOutlinedIcon />;
//     let seatColor = 'success'; // Green for available
//     let isDisabled = false;
//     let tooltipTitle = `Seat ${identifier} (${type})`;

//     if (isBooked) {
//         seatIcon = <BlockIcon />;
//         seatColor = 'disabled'; // Greyed out
//         isDisabled = true;
//         tooltipTitle = `Seat ${identifier} (Booked)`;
//     } else if (isSelected) {
//         seatIcon = <EventSeatIcon />;
//         seatColor = 'error'; // Red for selected
//         tooltipTitle = `Seat ${identifier} (Selected)`;
//     } else {
//         // Customize icon/color based on seat type (available seats)
//         switch (type?.toLowerCase()) {
//             case 'premium':
//             case 'vip':
//             case 'recliner':
//                 seatIcon = <AirlineSeatReclineNormalIcon />;
//                 seatColor = 'warning'; // Yellow/Orange for premium
//                 break;
//             case 'wheelchair':
//                 seatIcon = <AccessibleIcon />;
//                 seatColor = 'info'; // Blue for accessibility
//                 break;
//             case 'unavailable': // Explicitly marked unavailable in layout
//                  seatIcon = <ChairIcon sx={{ opacity: 0.3 }}/>; // Faded generic icon
//                  seatColor = 'disabled';
//                  isDisabled = true;
//                  tooltipTitle = `Seat ${identifier} (Unavailable)`;
//                  break;
//             default: // Normal available seat
//                 seatIcon = <ChairOutlinedIcon />;
//                 seatColor = 'success';
//                 break;
//         }
//     }

//     const handleClick = () => {
//         if (!isDisabled && onSelect) {
//             onSelect(identifier); // Pass seat identifier back on click
//         }
//     };

//     return (
//         <Tooltip title={tooltipTitle} placement="top" arrow>
//             {/* Span needed for tooltip when button is disabled */}
//             <span>
//                 <Button
//                     variant="text" // Use text variant for icon-like appearance
//                     color={seatColor}
//                     disabled={isDisabled}
//                     onClick={handleClick}
//                     sx={{
//                         minWidth: 'auto', // Remove default min width
//                         p: 0.5, // Minimal padding
//                         lineHeight: 1, // Adjust line height
//                         // Add transition for potential hover effects
//                         transition: 'transform 0.1s ease-in-out',
//                         '&:hover:not(:disabled)': {
//                            transform: 'scale(1.1)',
//                            bgcolor: 'action.hover' // Slight background on hover
//                         }
//                     }}
//                 >
//                     {seatIcon}
//                 </Button>
//             </span>
//         </Tooltip>
//     );
// };

// export default Seat;


// client/src/components/Seat.jsx
// Renders a single seat button based on its status and type.
import React from 'react';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
// Import specific icons
import ChairIcon from '@mui/icons-material/Chair'; // Generic/Unavailable
import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined'; // Available Normal
import EventSeatIcon from '@mui/icons-material/EventSeat'; // Selected
import AccessibleIcon from '@mui/icons-material/Accessible'; // Wheelchair
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal'; // Recliner/VIP/Premium
import BlockIcon from '@mui/icons-material/Block'; // Booked

const Seat = ({ seatData, isSelected, onSelect }) => {
    // Destructure with defaults
    const { identifier = 'N/A', type = 'Normal', isBooked = false } = seatData || {};

    let seatIcon = <ChairOutlinedIcon />; // Default to available icon
    let seatColor = 'success'; // Default to available color (green)
    let isDisabled = false;
    let tooltipTitle = `Seat ${identifier} (${type})`;

    if (isBooked) {
        seatIcon = <BlockIcon />;
        seatColor = 'disabled'; // Use theme's disabled color (grey)
        isDisabled = true;
        tooltipTitle = `Seat ${identifier} (Booked)`;
    } else if (isSelected) {
        seatIcon = <EventSeatIcon />;
        seatColor = 'error'; // Use theme's error color (red)
        tooltipTitle = `Seat ${identifier} (Selected)`;
    } else {
        // Customize icon/color for AVAILABLE seats based on type
        switch (type?.toLowerCase()) {
            case 'premium':
            case 'vip':
            case 'recliner':
                seatIcon = <AirlineSeatReclineNormalIcon />;
                seatColor = 'warning'; // Use theme's warning color (orange/yellow)
                tooltipTitle = `Seat ${identifier} (${type})`;
                break;
            case 'wheelchair':
                seatIcon = <AccessibleIcon />;
                seatColor = 'info'; // Use theme's info color (blue)
                tooltipTitle = `Seat ${identifier} (Wheelchair Accessible)`;
                break;
            case 'unavailable': // Explicitly marked unavailable in layout
                 seatIcon = <ChairIcon sx={{ opacity: 0.3 }}/>;
                 seatColor = 'disabled';
                 isDisabled = true;
                 tooltipTitle = `Seat ${identifier} (Unavailable)`;
                 break;
            default: // Normal available seat
                seatIcon = <ChairOutlinedIcon />;
                seatColor = 'success'; // Use theme's success color (green)
                break;
        }
    }

    const handleClick = () => {
        // Only call onSelect if the seat is not disabled (booked/unavailable)
        if (!isDisabled && onSelect) {
            onSelect(identifier); // Pass seat identifier back
        }
    };

    return (
        // Tooltip provides info on hover
        <Tooltip title={tooltipTitle} placement="top" arrow disableFocusListener={isDisabled} disableHoverListener={isDisabled} disableTouchListener={isDisabled}>
            {/* Span wrapper is necessary for Tooltip to work on disabled buttons */}
            <span>
                <Button
                    variant="text" // Looks more like an icon this way
                    color={seatColor} // Use MUI theme colors
                    disabled={isDisabled}
                    onClick={handleClick}
                    aria-label={tooltipTitle} // Accessibility
                    sx={{
                        minWidth: 'auto', // Fit content
                        p: 0.5, // Small padding
                        lineHeight: 1,
                        borderRadius: '4px', // Slightly rounded
                        // Hover effect for available/selected seats
                        transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                        '&:hover:not(:disabled)': {
                           transform: 'scale(1.15)', // Slightly larger zoom
                           bgcolor: 'action.hover' // Use theme's hover background
                        }
                    }}
                >
                    {/* Render the chosen icon */}
                    {seatIcon}
                </Button>
            </span>
        </Tooltip>
    );
};

export default Seat;
