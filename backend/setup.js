require('dotenv').config();
const mysql = require('mysql2/promise');

async function setup() {
    // First connection without database to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`Database ${process.env.DB_NAME} created or already exists`);

        // Use the database
        await connection.query(`USE ${process.env.DB_NAME}`);

        // Create vehicle_listings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS vehicle_listings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                car_title VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                year INT NOT NULL,
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
                images JSON,
                specifications JSON,
                features JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Vehicle listings table created or already exists');

        console.log('Database setup completed successfully!');
    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        await connection.end();
    }
}

setup(); 