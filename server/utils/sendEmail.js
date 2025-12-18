// server/utils/sendEmail.js
// Purpose: Reusable function to send emails using Nodemailer.

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter object using SMTP transport
    //    Get credentials from environment variables
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        // port: process.env.EMAIL_PORT,
        port: parseInt(process.env.EMAIL_PORT),
        secure: false,
        // secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        // Optional: Add TLS options if needed, e.g., for self-signed certs in dev
        // tls: {
        //     rejectUnauthorized: false // Use only for local testing if needed
        // }
    });

    // 2. Define email options
    const message = {
        from: process.env.EMAIL_FROM_ADDRESS, // Sender address
        to: options.to,                     // List of receivers (string or array)
        subject: options.subject,             // Subject line
        text: options.text,                 // Plain text body (optional)
        html: options.html                  // HTML body (optional, often preferred)
    };

    // 3. Send the email
    try {
        const info = await transporter.sendMail(message);
        console.log('Email sent successfully. Message ID:', info.messageId);
        // For Mailtrap, you can often get a preview URL:
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return { success: true, info };
    } catch (error) {
        console.error('Error sending email:', error);
        // Rethrow or handle error as needed
        throw new Error(`Email could not be sent: ${error.message}`);
        // return { success: false, error };
    }
};

module.exports = sendEmail;