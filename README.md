# Gaadiyaan - Car Dealership Platform

## Overview
Gaadiyaan is a comprehensive car dealership platform that connects car dealers with potential buyers. The platform features separate dashboards for administrators, dealers, and clients, with robust functionality for vehicle listings management.

## System Architecture

### 1. User Roles
- **Administrators**: Complete platform management and dealer oversight
- **Dealers**: Vehicle listing management and profile administration
- **Clients**: Vehicle browsing and interaction with dealers

### 2. Core Features

#### For Dealers
- **Listing Management**
  - Create, edit, and delete vehicle listings
  - Mark listings as sold
  - Upload multiple vehicle images
  - Manage vehicle specifications and features
  ```html:dashboard/dealer/pages/listings.html
  startLine: 37
  endLine: 98
  ```

- **Profile Management**
  - Update dealership information
  - Manage contact details
  - Upload dealership logo/avatar
  ```html:dashboard/dealer/pages/profile.html
  startLine: 275
  endLine: 298
  ```

#### For Administrators
- **Dealer Management**
  - View and manage dealer accounts
  - Monitor dealer listings
  - Suspend/terminate dealer accounts
  ```html:dashboard/admin/pages/dealers.html
  startLine: 13
  endLine: 68
  ```

- **Content Moderation**
  - Review and approve listings
  - Monitor platform content
  - Manage user reports
  ```html:dashboard/admin/pages/content.html
  startLine: 77
  endLine: 118
  ```

### 3. Technical Implementation

#### Authentication System
- Role-based access control
- Secure session management
- Protected routes for different user types

#### Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interfaces

### 4. Security Features
- Email verification for new accounts
- Secure password policies
- Protected API endpoints


### 5. Legal Framework
- Privacy Policy
- Terms of Service
- User agreements for both dealers and clients


## Development Guidelines

### Code Structure
- Modular component architecture
- Consistent naming conventions
- Separation of concerns between UI and business logic

### Styling Conventions
- CSS custom properties for theming
- Mobile-first media queries
- BEM naming methodology

### JavaScript Best Practices
- Event delegation for dynamic content
- Async/await for API calls
- Error handling and logging

## Setup Instructions

1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Set up database connections
5. Run development server

## API Documentation

### Endpoints
- `/api/auth/*` - Authentication endpoints
- `/api/listings/*` - Listing management
- `/api/dealers/*` - Dealer management
- `/api/admin/*` - Administrative functions

### Response Formats
All API responses follow the structure:
```json
{
  "status": "success" | "error",
  "message": "Response message",
  "data": {...}
}
```


## Support and Contact
For technical support or inquiries:
- Email: support@gaadiyaan.com
- WhatsApp: Available through in-app support.


## License
Copyright © 2024 Gaadiyaan. All rights reserved.
