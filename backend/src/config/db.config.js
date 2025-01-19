const mysql = require('mysql2');

console.log('Attempting database connection with:', {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'gaadiyaan',
});

const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'gaadiyaan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
connection.getConnection((err, conn) => {
    if (err) {
        console.error('Database Connection Error:', err);
        return;
    }
    console.log('Successfully connected to database');
    conn.release();
});

module.exports = connection.promise(); 