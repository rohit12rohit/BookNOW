// client/src/components/TicketDocument.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import dayjs from 'dayjs';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#333',
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
    padding: 15,
    border: '1px solid #eaeaea',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
    borderBottom: '1px solid #D32F2F',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    width: '70%',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  qrCode: {
    width: 150,
    height: 150,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 9,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#D32F2F',
  }
});

const TicketDocument = ({ booking, qrCodeDataURL }) => {
  if (!booking) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>Booking data is not available.</Text>
        </Page>
      </Document>
    );
  }

  const show = booking.showtime;
  const itemTitle = show?.movie?.title || show?.event?.title || 'Event/Movie';
  const displayBookingRefId = booking.bookingRefId || 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>BookNOW E-Ticket</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Booking Ref:</Text>
            <Text style={[styles.value, styles.highlight]}>{displayBookingRefId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Booked For:</Text>
            <Text style={styles.value}>{booking.user?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Booked On:</Text>
            <Text style={styles.value}>{dayjs(booking.bookingTime).format('DD MMM YYYY, h:mm A')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{itemTitle}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Venue:</Text>
            <Text style={styles.value}>{show?.venue?.name}</Text>
          </View>
           <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{`${show?.venue?.address?.street || ''}, ${show?.venue?.address?.city || ''}, ${show?.venue?.address?.state || ''}`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Screen:</Text>
            <Text style={styles.value}>{show?.screenName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date & Time:</Text>
            <Text style={styles.value}>{dayjs(show?.startTime).format('dddd, DD MMM YYYY, h:mm A')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Seats:</Text>
            <Text style={[styles.value, styles.highlight]}>{booking.seats?.join(', ')}</Text>
          </View>
        </View>

        {qrCodeDataURL && (
          <View style={styles.qrCodeContainer}>
            <Image style={styles.qrCode} src={qrCodeDataURL} />
            <Text>Scan this at the venue entrance</Text>
          </View>
        )}
        
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Original Amount:</Text>
                <Text style={styles.value}>Rs. {booking.originalAmount?.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Discount:</Text>
                <Text style={styles.value}>- Rs. {booking.discountAmount?.toFixed(2)}</Text>
            </View>
             <View style={styles.row}>
                <Text style={styles.label}>Total Paid:</Text>
                <Text style={[styles.value, styles.highlight]}>Rs. {booking.totalAmount?.toFixed(2)}</Text>
            </View>
        </View>

        <Text style={styles.footer}>
            Thank you for booking with BookNOW. This is a computer-generated ticket.
        </Text>
      </Page>
    </Document>
  );
};

export default TicketDocument;