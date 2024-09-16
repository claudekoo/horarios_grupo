require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the model
const Availability = require('./models/Availability');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const dbPassword = process.env.DB_PASSWORD;
const mongoURI = `mongodb+srv://admin:${dbPassword}@availability.v13pi.mongodb.net/availabilityApp?retryWrites=true&w=majority`;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Route to get group availability for a code
app.get('/get-availability/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const availabilityEntries = await Availability.find({ code });
        if (availabilityEntries.length > 0) {
            res.status(200).json(availabilityEntries);
        } else {
            res.status(404).json({ message: 'No availability found for this code' });
        }
    } catch (error) {
        console.error('Error retrieving availability:', error);
        res.status(500).json({ message: 'Error retrieving availability', error });
    }
});

// Define the /submit-availability endpoint
app.post('/submit-availability', async (req, res) => {
    const { code, name, times } = req.body;
    try {
        const updatedAvailability = await Availability.findOneAndUpdate(
            { code, name },
            { times },
            { new: true, upsert: true }
        );
        res.status(201).json({ message: 'Availability submitted successfully', data: updatedAvailability });
    } catch (error) {
        console.error('Error submitting availability:', error);
        res.status(500).json({ message: 'Error submitting availability', error });
    }
});

app.head('/ping', (req, res) => {
    const currentDateTime = new Date().toISOString();
    console.log(`pong - ${currentDateTime}`);
    res.status(200).json({ message: 'pong' });
});

// Define the /clear-database endpoint
app.delete('/clear-database', async (req, res) => {
    const password = req.headers['x-password'];
    const correctPassword = process.env.CLEAR_DB_PASSWORD;

    if (password !== correctPassword) {
      return res.status(403).json({ message: 'Forbidden: Incorrect password' });
    }
  
    try {
      await Availability.deleteMany({});
      res.status(200).json({ message: 'Database cleared successfully' });
    } catch (error) {
      console.error('Error clearing database:', error);
      res.status(500).json({ message: 'Error clearing database', error });
    }
  });

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});