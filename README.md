# Gaadiyaan - Used Car Marketplace

## Overview
Gaadiyaan is a modern, full-stack web application for buying and selling used cars. The platform connects car dealers with potential buyers, providing a seamless experience for vehicle listings, searches, and inquiries. Built with scalability and performance in mind, it features real-time updates, advanced search capabilities, and a responsive design that works across all devices.

## Tech Stack
### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
  - Semantic HTML for better SEO
  - CSS Grid and Flexbox for layouts
  - Modern JavaScript features and async/await
- **Bootstrap 5**
  - Custom theme with brand colors
  - Responsive breakpoints configuration
  - Extended components
- **jQuery & Plugins**
  - AJAX for async operations
  - Form validation and handling
  - DOM manipulation optimizations
- **Custom Components**
  - Advanced filter system with real-time updates
  - Image gallery with zoom and swipe
  - Dynamic form validation
  - Custom select dropdowns
- **Performance Optimizations**
  - Lazy loading for images and components
  - Minified and bundled assets
  - Browser caching implementation
  - Optimized asset delivery

### Backend
- **Node.js with Express.js**
  - MVC architecture
  - Custom middleware stack
  - Error handling middleware
  - Rate limiting implementation
- **MySQL Database**
  - Optimized schema design
  - Indexed queries
  - Connection pooling
- **Authentication & Security**
  - JWT with refresh tokens
  - Role-based access control
  - Password hashing with bcrypt
  - XSS and CSRF protection
- **File Handling**
  - Multer for file uploads
  - Image optimization
  - Secure file storage
  - CDN integration ready
- **API Design**
  - RESTful principles
  - Versioned endpoints
  - Comprehensive documentation
  - Rate limiting per user

## Features
### For Buyers
#### Search & Discovery
- Advanced filtering system with multiple parameters
  - Price range with slider
  - Year of manufacture
  - Mileage range
  - Body type
  - Fuel type
  - Transmission type
- Location-based search with radius filter
- Save search preferences
- Recent search history

#### Vehicle Details
- High-resolution image galleries
- 360° virtual tours (where available)
- Detailed specifications
- Service history
- Ownership details
- Similar vehicles suggestions

#### User Features
- Favorite listings management
- Compare up to 4 vehicles
- Email alerts for price drops
- Share listings on social media
- Dealer contact forms
- Schedule test drives

### For Dealers
#### Dashboard
- Real-time analytics
  - Listing views
  - Inquiry statistics
  - Conversion rates
  - Popular listings
- Lead management system
- Inventory management
- Customer messaging center

#### Listing Management
- Bulk upload capability
- Image management with drag-and-drop
- Pricing suggestions based on market data
- Featured listing options
- Duplicate listing detection
- Auto-fill features using vehicle registration

#### Profile Management
- Dealership information
- Team member management
- Business hours
- Location mapping
- Social media integration
- Review management

## Project Structure
```
gaadiyaan/
├── frontend/
│   ├── assets/
│   │   ├── css/          # Stylesheets
│   │   │   ├── main.css  # Main styles
│   │   │   └── themes/   # Theme variations
│   │   ├── js/           # JavaScript files
│   │   │   ├── modules/  # JS modules
│   │   │   └── utils/    # Utility functions
│   │   └── images/       # Static images
│   ├── dashboard/
│   │   ├── pages/        # Dashboard pages
│   │   ├── components/   # Reusable components
│   │   └── js/          # Dashboard-specific JS
│   ├── variants/         # Vehicle variant pages
│   └── auth/            # Authentication pages
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js    # DB configuration
│   │   │   └── middleware.js  # Middleware setup
│   │   ├── controllers/
│   │   │   ├── auth.js        # Auth controllers
│   │   │   └── vehicles.js    # Vehicle controllers
│   │   ├── middleware/
│   │   │   ├── auth.js        # Auth middleware
│   │   │   └── validation.js  # Input validation
│   │   ├── models/
│   │   │   ├── user.js        # User model
│   │   │   └── vehicle.js     # Vehicle model
│   │   └── routes/
│   │       ├── auth.js        # Auth routes
│   │       └── vehicles.js    # Vehicle routes
│   └── uploads/              # File storage
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Git
- npm or yarn
- Image processing libraries (sharp, imagemagick)

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gaadiyaan.git
   cd gaadiyaan
   ```

2. Navigate to backend and install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Create and configure .env file:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=gaadiyaan_db
   DB_PORT=3306
   
   # JWT Configuration
   JWT_SECRET=your_very_long_and_secure_secret_key
   JWT_REFRESH_SECRET=another_very_long_and_secure_secret
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   
   # API Configuration
   BASE_URL=https://api.gaadiyaan.com
   PORT=3000
   NODE_ENV=development
   
   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=jpg,jpeg,png
   
   # Email Configuration (if using email services)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   ```

4. Set up the database:
   ```bash
   # Create database tables
   node setup.js
   
   # Run migrations (if using)
   npx sequelize-cli db:migrate
   
   # Seed initial data (if needed)
   npx sequelize-cli db:seed:all
   ```

5. Start the development server:
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup
1. Configure API endpoint:
   ```javascript
   // assets/js/config.js
   const config = {
     development: {
       API_BASE_URL: 'http://localhost:3000/api',
       ASSETS_URL: 'http://localhost:3000/uploads'
     },
     production: {
       API_BASE_URL: 'https://api.gaadiyaan.com/api',
       ASSETS_URL: 'https://cdn.gaadiyaan.com'
     }
   };
   ```

2. Install frontend dependencies:
   ```bash
   # If using npm for frontend
   npm install
   
   # If using specific packages
   npm install bootstrap@5.3.0 jquery@3.6.0 @popperjs/core
   ```

3. Serve the frontend:
   ```bash
   # Using VS Code Live Server
   # Install Live Server extension and click "Go Live"
   
   # Using http-server
   npx http-server . -p 8080
   ```

## API Documentation

### Authentication Endpoints
#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "dealer123",
  "email": "dealer@example.com",
  "password": "securePassword123",
  "role": "dealer",
  "dealership_name": "Example Motors"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "dealer@example.com",
  "password": "securePassword123"
}
```

### Vehicle Endpoints
#### List Vehicles with Filters
```http
GET /api/vehicles?make=Toyota&model=Camry&minPrice=500000&maxPrice=1000000&year=2020
```

#### Create Vehicle Listing
```http
POST /api/vehicles
Content-Type: multipart/form-data

{
  "dealer_id": "GD2024001",
  "car_title": "2022 Toyota Camry Hybrid",
  "price": 3500000,
  "year": 2022,
  ... (other fields as per data model)
}
```

## Data Models

### Vehicle Listing
```javascript
{
  // Basic Information
  dealer_id: {
    type: String,
    required: true,
    pattern: /^GD\d{7}$/
  },
  car_title: {
    type: String,
    required: true,
    maxLength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Vehicle Details
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear()
  },
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  
  // Technical Specifications
  engine_displacement: {
    type: Number,
    required: true
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic'],
    required: true
  },
  fuel_type: {
    type: String,
    enum: ['petrol', 'diesel', 'cng', 'electric', 'hybrid'],
    required: true
  },
  
  // Additional Details
  specifications: [{
    name: String,
    value: String
  }],
  features: {
    safety: [String],
    comfort: [String],
    entertainment: [String],
    exterior: [String]
  },
  
  // Media
  images: [{
    url: String,
    type: String,
    order: Number
  }],
  
  // Metadata
  created_at: Date,
  updated_at: Date,
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive']
  }
}
```

## Security Measures
- **JWT Authentication**
  - Access tokens (1 hour expiry)
  - Refresh tokens (7 days expiry)
  - Secure cookie storage
  
- **Password Security**
  - bcrypt hashing (10 rounds)
  - Password strength validation
  - Failed login attempt limiting
  
- **API Security**
  - Rate limiting (100 requests/15 minutes)
  - CORS configuration
  - Request size limiting
  - Input sanitization
  
- **File Upload Security**
  - File type validation
  - Size restrictions
  - Malware scanning
  - Secure file naming

## Best Practices
### Code Style
- ESLint configuration
- Prettier formatting
- JSDoc documentation
- Conventional commits

### Performance
- Image optimization
- Code splitting
- Lazy loading
- Caching strategies
- Database indexing

### Testing
- Unit tests (Jest)
- Integration tests
- E2E tests (Cypress)
- Load testing

## Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Coding Standards
- Follow ESLint rules
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
