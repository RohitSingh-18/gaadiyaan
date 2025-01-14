// Configuration for different environments
const config = {
    development: {
        API_BASE_URL: 'http://localhost:3000/api'
    },
    production: {
        API_BASE_URL: 'https://gaadiyaan.vercel.app/api'  // Updated to match your deployed frontend
    }
};

// Determine environment based on hostname
const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

// Export the configuration based on environment
const currentConfig = isProduction ? config.production : config.development;

export default currentConfig; 