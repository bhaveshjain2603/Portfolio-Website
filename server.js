const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: 'https://sbk-portfolio.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// MongoDB Connection
mongoose
.connect(process.env.MONGODB_URI)
.then(console.log('MongoDB connected successfully'));

// Contact Form Schema
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Contact Form Endpoint
app.post('/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        // Save to database
        const contact = new Contact({
            name,
            email,
            message
        });
        const savedContact = await contact.save();

        if (!savedContact) {
            throw new Error('Failed to save contact');
        }

        // Send email notification
        const mailOptions = {
            from: `"Bhavesh S Jain" <${process.env.EMAIL}>`, // Change this to use your email as sender
            to: process.env.EMAIL,
            replyTo: email,
            subject: 'New Portfolio Contact Form Submission',
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
