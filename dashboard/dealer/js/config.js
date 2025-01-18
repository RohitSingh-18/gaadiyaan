// Configuration for different environments
const config = {
    development: {
        API_BASE_URL: 'http://localhost:3000/api'
    },
    production: {
        API_BASE_URL: 'https://gaadiyaan-api.onrender.com/api'
    }
};

// Export the configuration based on environment
const currentConfig = config[process.env.NODE_ENV || 'production'];
export default currentConfig; 