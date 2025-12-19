// server/utils/sendEmail.js
// Purpose: Reusable function to send emails using Nodemailer (Brevo SMTP).

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter using environment variables (Set to Brevo credentials)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const message = {
        from: `BookNOW <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: options.to,
        subject: options.subject,
        text: options.text, // Fallback
        html: options.html  // HTML version
    };

    try {
        const info = await transporter.sendMail(message);
        console.log(`Email sent to ${options.to}. Message ID: ${info.messageId}`);
        return { success: true, info };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email could not be sent.');
    }
};

module.exports = sendEmail;