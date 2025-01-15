const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// More permissive CORS configuration for testing
app.use(cors({
  origin: '*',  // Allow all origins temporarily
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: '*',  // Allow all headers
  credentials: true
}));

// Additional headers for CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files - adjusted for Vercel
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const vehicleRoutes = require('./routes/vehicle.routes');
app.use('/api/vehicles', vehicleRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Gaadiyaan API',
    env: process.env.NODE_ENV,
    database: process.env.DB_HOST ? 'configured' : 'not configured'
  });
});

// Error handling middleware with more details
app.use((err, req, res, next) => {
  console.error('Error details:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Export for Vercel
module.exports = app;

// Only listen if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}