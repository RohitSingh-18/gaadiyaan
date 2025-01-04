const Callback = require('../models/callback.model');

// Create a new callback request
exports.createCallback = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone number are required' });
        }

        const callbackId = await Callback.create({ name, phone });

        res.status(201).json({ message: 'Callback request created successfully', callbackId });
    } catch (error) {
        console.error('Error creating callback:', error);
        res.status(500).json({ message: 'Error creating callback request', error: error.message });
    }
};

// Get all callback requests
exports.getCallbacks = async (req, res) => {
    try {
        const callbacks = await Callback.findAll();
        res.status(200).json(callbacks);
    } catch (error) {
        console.error('Error fetching callbacks:', error);
        res.status(500).json({ message: 'Error fetching callback requests', error: error.message });
    }
};
