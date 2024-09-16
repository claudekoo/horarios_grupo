const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    code: { type: String, required: true }, // Group code
    name: { type: String, required: true }, // User name
    times: { type: Map, of: [String], required: true } // Map of days with an array of selected times
});

module.exports = mongoose.model('Availability', availabilitySchema);