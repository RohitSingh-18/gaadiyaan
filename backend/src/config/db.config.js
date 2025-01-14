const mysql = require('mysql2');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Hostinger specific settings
    ssl: false,
    port: 3306
};

console.log('Attempting database connection with:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
});

const pool = mysql.createPool(dbConfig);

// Test and maintain the connection
function testConnection() {
    pool.getConnection((err, conn) => {
        if (err) {
            console.error('Database Connection Error:', err);
            console.error('Error Code:', err.code);
            console.error('Error Number:', err.errno);
            // Attempt reconnection after 5 seconds
            setTimeout(testConnection, 5000);
            return;
        }
        console.log('Successfully connected to database');
        conn.release();
    });
}

// Initial connection test
testConnection();

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        testConnection();
    }
});

module.exports = pool.promise(); 