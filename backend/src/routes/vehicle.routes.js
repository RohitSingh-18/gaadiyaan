const express = require('express');
const router = express.Router();
const VehicleModel = require('../models/vehicle.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db.config');

// Get base URL from environment variable or use Render.com URL
const BASE_URL = process.env.BASE_URL || 'https://gaadiyaan-api-x18f.onrender.com';

// Use Render's persistent disk storage path
const uploadDir = process.env.RENDER_DISK_PATH ? 
    path.join(process.env.RENDER_DISK_PATH, 'uploads/vehicles') : 
    path.join(__dirname, '../../../uploads/vehicles');

// Ensure uploads directory exists with absolute path
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Error handling middleware for Multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
        });
    }
    next(err);
};

// Get all vehicle listings with filters, sorting and pagination
router.get('/', async (req, res) => {
    try {
        const {
            minPrice,
            maxPrice,
            year,
            fuelType,
            transmission,
            search,
            sortBy,
            page = 1,
            limit = 10,
            dealer_id
        } = req.query;

        // Build WHERE clause
        let whereClause = [];
        let params = [];

        if (dealer_id) {
            whereClause.push('dealer_id = ?');
            params.push(dealer_id);
        }

        if (minPrice) {
            whereClause.push('price >= ?');
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            whereClause.push('price <= ?');
            params.push(parseFloat(maxPrice));
        }
        if (year) {
            whereClause.push('year = ?');
            params.push(parseInt(year));
        }
        if (fuelType) {
            whereClause.push('fuel_type = ?');
            params.push(fuelType.toLowerCase());
        }
        if (transmission) {
            whereClause.push('transmission = ?');
            params.push(transmission.toLowerCase());
        }
        if (search) {
            whereClause.push('(car_title LIKE ? OR make LIKE ? OR model LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Build ORDER BY clause
        let orderClause = 'created_at DESC'; // default sorting
        if (sortBy) {
            switch(sortBy) {
                case 'price_low':
                    orderClause = 'price ASC';
                    break;
                case 'price_high':
                    orderClause = 'price DESC';
                    break;
                case 'oldest':
                    orderClause = 'created_at ASC';
                    break;
                case 'newest':
                    orderClause = 'created_at DESC';
                    break;
            }
        }

        // Calculate pagination
        const offset = (page - 1) * limit;
        
        // Build final query
        let query = 'SELECT * FROM vehicle_listings';
        if (whereClause.length > 0) {
            query += ' WHERE ' + whereClause.join(' AND ');
        }
        query += ` ORDER BY ${orderClause} LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM vehicle_listings';
        if (whereClause.length > 0) {
            countQuery += ' WHERE ' + whereClause.join(' AND ');
        }

        // Execute queries
        const [listings] = await db.query(query, params);
        const [countResult] = await db.query(countQuery, params.slice(0, -2));
        
        // Ensure we have valid results
        if (!Array.isArray(listings)) {
            throw new Error('Invalid listings data received');
        }
        
        const total = countResult && countResult[0] ? countResult[0].total : 0;

        // Parse images for each listing
        const processedListings = listings.map(listing => {
            try {
                return {
                    ...listing,
                    images: listing.images ? (
                        typeof listing.images === 'string' ? 
                        JSON.parse(listing.images) : 
                        listing.images
                    ) : []
                };
            } catch (error) {
                console.error('Error processing listing:', error);
                return {
                    ...listing,
                    images: []
                };
            }
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        res.json({
            success: true,
            data: processedListings,
            pagination: {
                total,
                totalPages,
                currentPage: parseInt(page),
                hasMore,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicle listings',
            error: error.message
        });
    }
});

// Get single vehicle listing
router.get('/:id', async (req, res) => {
    try {
        const listing = await VehicleModel.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle listing not found'
            });
        }
        res.json({
            success: true,
            data: listing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicle listing',
            error: error.message
        });
    }
});

// Create new vehicle listing with image upload
router.post('/', upload.array('vehicleImages', 10), handleMulterError, async (req, res) => {
    try {
        console.log('\n--- New Vehicle Listing Request ---');
        console.log('Headers:', req.headers);
        console.log('Body fields:', req.body);
        console.log('Files:', req.files);
        
        // Process uploaded files and ensure we have the full URLs
        const imageUrls = req.files && req.files.length > 0 
            ? req.files.map(file => `${BASE_URL}/uploads/vehicles/${file.filename}`)
            : [];
        
        console.log('Generated image URLs:', imageUrls);
        
        // Get dealer_id from request body
        if (!req.body.dealer_id) {
            throw new Error('dealer_id is required');
        }
        
        // Parse numeric values
        const vehicleData = {
            dealer_id: req.body.dealer_id,
            carTitle: req.body.carTitle,
            price: parseFloat(req.body.price),
            year: parseInt(req.body.year),
            description: req.body.description,
            make: req.body.make,
            model: req.body.model,
            registrationYear: parseInt(req.body.registrationYear),
            insurance: req.body.insurance,
            fuelType: req.body.fuelType,
            seats: parseInt(req.body.seats),
            kmsDriven: parseInt(req.body.kmsDriven),
            location: req.body.location,
            ownership: req.body.ownership,
            engineDisplacement: parseInt(req.body.engineDisplacement),
            transmission: req.body.transmission,
            specifications: req.body.specifications ? JSON.parse(req.body.specifications) : [],
            features: req.body.features ? JSON.parse(req.body.features) : {},
            images: imageUrls // Pass as array, let the model handle stringification
        };
        
        console.log('\nProcessed vehicle data:', JSON.stringify(vehicleData, null, 2));

        const result = await VehicleModel.create(vehicleData);
        console.log('\nDatabase result:', result);
        
        res.status(201).json({
            success: true,
            message: 'Vehicle listing created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error details:', error);
        
        // Clean up uploaded files if database operation fails
        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join(uploadDir, file.filename);
                fs.unlink(filePath, err => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating vehicle listing',
            error: error.message
        });
    }
});

// Update vehicle listing
router.put('/:id', async (req, res) => {
    try {
        const result = await VehicleModel.update(req.params.id, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle listing not found'
            });
        }
        res.json({
            success: true,
            message: 'Vehicle listing updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating vehicle listing',
            error: error.message
        });
    }
});

// Delete vehicle listing
router.delete('/:id', async (req, res) => {
    try {
        const result = await VehicleModel.delete(req.params.id);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle listing not found'
            });
        }
        res.json({
            success: true,
            message: 'Vehicle listing deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting vehicle listing',
            error: error.message
        });
    }
});

// Temporary route to clean up database (DELETE THIS IN PRODUCTION)
router.delete('/cleanup/all', async (req, res) => {
    try {
        await db.query('TRUNCATE TABLE vehicle_listings');
        res.json({
            success: true,
            message: 'All listings deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cleaning up listings',
            error: error.message
        });
    }
});

// Test route for direct database insertion
router.post('/test', async (req, res) => {
    try {
        const testData = {
            carTitle: "Test Vehicle",
            price: 1000000,
            year: 2020,
            make: "Test Make",
            model: "Test Model",
            registrationYear: 2020,
            insurance: "Comprehensive",
            fuelType: "petrol",
            seats: 5,
            kmsDriven: 10000,
            location: "Test Location",
            ownership: "First",
            engineDisplacement: 1500,
            transmission: "manual",
            specifications: [],
            features: {},
            images: JSON.stringify([
                `${BASE_URL}/uploads/vehicles/test1.jpg`,
                `${BASE_URL}/uploads/vehicles/test2.jpg`
            ])
        };

        const result = await VehicleModel.create(testData);
        res.status(201).json({
            success: true,
            message: 'Test vehicle listing created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in test route:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating test vehicle listing',
            error: error.message
        });
    }
});

module.exports = router; 
