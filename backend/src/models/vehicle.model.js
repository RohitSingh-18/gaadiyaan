const db = require('../config/db.config');

const dropTableQuery = `DROP TABLE IF EXISTS vehicle_listings`;
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS vehicle_listings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dealer_id VARCHAR(10) NOT NULL,
    car_title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    year INT NOT NULL,
    description TEXT,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    registration_year INT NOT NULL,
    insurance VARCHAR(100) NOT NULL,
    fuel_type ENUM('petrol', 'diesel', 'cng', 'electric', 'hybrid') NOT NULL,
    seats INT NOT NULL,
    kms_driven INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    ownership VARCHAR(20) NOT NULL,
    engine_displacement INT NOT NULL,
    transmission ENUM('manual', 'automatic') NOT NULL,
    images JSON NULL DEFAULT NULL,
    specifications JSON NULL DEFAULT NULL,
    features JSON NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`;

// Initialize table
db.query(dropTableQuery)
  .then(() => db.query(createTableQuery))
  .then(() => console.log('Vehicle listings table initialized'))
  .catch(err => console.error('Error creating vehicle listings table:', err));

const VehicleModel = {
  generateDealerId: async () => {
    const year = new Date().getFullYear();
    const [result] = await db.query(
      'SELECT COALESCE(MAX(CAST(SUBSTRING(dealer_id, 7) AS UNSIGNED)), 0) + 1 as next_seq FROM vehicle_listings'
    );
    const sequence = result[0].next_seq;
    return `GD${year}${String(sequence).padStart(3, '0')}`;
  },

  create: async (vehicleData) => {
    try {
        console.log('\n--- Database Create Operation ---');
        const dealerId = await VehicleModel.generateDealerId();
        console.log('Generated dealer ID:', dealerId);
        
        // Convert camelCase to snake_case and ensure proper data types
        const formattedData = {
            dealer_id: dealerId,
            car_title: vehicleData.carTitle,
            price: parseFloat(vehicleData.price),
            year: parseInt(vehicleData.year),
            description: vehicleData.description || null,
            make: vehicleData.make,
            model: vehicleData.model,
            registration_year: parseInt(vehicleData.registrationYear),
            insurance: vehicleData.insurance,
            fuel_type: vehicleData.fuelType.toLowerCase(),
            seats: parseInt(vehicleData.seats),
            kms_driven: parseInt(vehicleData.kmsDriven),
            location: vehicleData.location,
            ownership: vehicleData.ownership,
            engine_displacement: parseInt(vehicleData.engineDisplacement),
            transmission: vehicleData.transmission.toLowerCase(),
            specifications: Array.isArray(vehicleData.specifications) ? JSON.stringify(vehicleData.specifications) : null,
            features: vehicleData.features && Object.keys(vehicleData.features).length > 0 ? JSON.stringify(vehicleData.features) : null,
            images: Array.isArray(vehicleData.images) ? JSON.stringify(vehicleData.images) : vehicleData.images
        };

        console.log('\nFormatted data for DB:', JSON.stringify(formattedData, null, 2));

        // Validate required fields
        const requiredFields = [
            'car_title', 'price', 'year', 'make', 'model', 'registration_year',
            'insurance', 'fuel_type', 'seats', 'kms_driven', 'location',
            'ownership', 'engine_displacement', 'transmission'
        ];

        const missingFields = requiredFields.filter(field => 
            formattedData[field] === null || 
            formattedData[field] === undefined || 
            formattedData[field] === ''
        );

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate numeric fields
        const numericFields = ['price', 'year', 'registration_year', 'seats', 'kms_driven', 'engine_displacement'];
        const invalidNumericFields = numericFields.filter(field => isNaN(formattedData[field]));

        if (invalidNumericFields.length > 0) {
            throw new Error(`Invalid numeric values for fields: ${invalidNumericFields.join(', ')}`);
        }

        // Log the SQL query that will be executed
        const sql = 'INSERT INTO vehicle_listings SET ?';
        console.log('\nExecuting SQL:', sql);
        console.log('With parameters:', formattedData);

        try {
            const [result] = await db.query(sql, [formattedData]);
            console.log('\nDatabase insert result:', result);
            return { ...result, dealer_id: dealerId };
        } catch (dbError) {
            console.error('\nDatabase Error:', {
                code: dbError.code,
                errno: dbError.errno,
                sqlMessage: dbError.sqlMessage,
                sqlState: dbError.sqlState,
                sql: dbError.sql
            });
            throw dbError;
        }
    } catch (error) {
        console.error('\nError in create operation:', error);
        throw error;
    }
  },

  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM vehicle_listings ORDER BY created_at DESC');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM vehicle_listings WHERE id = ?', [id]);
    return rows[0];
  },

  update: async (id, vehicleData) => {
    const [result] = await db.query('UPDATE vehicle_listings SET ? WHERE id = ?', [vehicleData, id]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query('DELETE FROM vehicle_listings WHERE id = ?', [id]);
    return result;
  }
};

module.exports = VehicleModel; 