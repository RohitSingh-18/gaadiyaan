// Constants
const API_BASE_URL = 'https://gaadiyaan-api.onrender.com';
const FALLBACK_IMAGE = '/assets/media/content/b-goods/375x300/3.jpg';
const DEFAULT_THUMBNAIL = '/assets/media/content/b-goods/375x300/3.jpg';

// Loading state HTML for similar cars
const LOADING_CARDS_HTML = `
    <div class="loading-card" style="min-width: 300px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="width: 100%; height: 250px; background: #f0f0f0; animation: pulse 1.5s infinite;"></div>
        <div style="padding: 20px;">
            <div style="width: 70%; height: 20px; background: #f0f0f0; margin-bottom: 10px; animation: pulse 1.5s infinite;"></div>
            <div style="width: 40%; height: 24px; background: #f0f0f0; margin-bottom: 15px; animation: pulse 1.5s infinite;"></div>
            <div style="width: 60%; height: 40px; background: #f0f0f0; border-radius: 25px; animation: pulse 1.5s infinite;"></div>
        </div>
    </div>
`.repeat(3);

// Get vehicle ID from URL
const urlParams = new URLSearchParams(window.location.search);
const vehicleId = urlParams.get('id');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    if (!vehicleId) {
        showError('Vehicle Not Found', 'No vehicle ID was provided in the URL.');
        return;
    }

    // Show loading state for similar cars
    document.getElementById('cardsSlider').innerHTML = LOADING_CARDS_HTML;
    
    fetchVehicleDetails(vehicleId);
});

// Fetch vehicle details from API
async function fetchVehicleDetails(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/vehicles/${id}`);
        if (!response.ok) {
            throw new Error('Vehicle not found');
        }
        const data = await response.json();
        
        if (!data.success || !data.data) {
            throw new Error('Invalid response from server');
        }

        displayVehicleDetails(data.data);
    } catch (error) {
        showError('Error', error.message);
    }
}

// Handle image loading errors
function handleImageError(img) {
    img.onerror = null; // Prevent infinite loop
    img.src = FALLBACK_IMAGE;
}

// Create thumbnail element
function createThumbnail(imgSrc, index, isActive = false) {
    return `
        <img src="${imgSrc}" 
             alt="Vehicle image ${index + 1}" 
             class="thumbnail ${isActive ? 'active' : ''}"
             onclick="updateMainImage(this, '${imgSrc}')"
             onerror="handleImageError(this)"
             loading="lazy">
    `;
}

// Create default thumbnails when no images are available
function createDefaultThumbnails(count = 3) {
    return Array(count).fill(null).map((_, index) => 
        createThumbnail(DEFAULT_THUMBNAIL, index, index === 0)
    ).join('');
}

// Display vehicle details
function displayVehicleDetails(vehicle) {
    // Parse JSON strings if needed
    let images = [];
    let features = {};
    let specifications = [];

    try {
        // Parse images
        images = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images || [];
        images = images.filter(img => img && typeof img === 'string');

        // Parse features
        features = typeof vehicle.features === 'string' ? JSON.parse(vehicle.features) : vehicle.features || {};
        // Ensure features is an object with arrays
        if (Array.isArray(features)) {
            features = { 'Features': features };
        }

        // Parse specifications
        console.log('Raw specifications:', vehicle.specifications);
        specifications = typeof vehicle.specifications === 'string' ? JSON.parse(vehicle.specifications) : vehicle.specifications || [];
        console.log('Parsed specifications:', specifications);
        
        // Handle array format where each item has name and value properties
        if (Array.isArray(specifications)) {
            specifications = specifications.map(spec => ({
                label: spec.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                value: spec.value
            }));
        } else {
            // Handle object format
            specifications = Object.entries(specifications || {}).map(([key, value]) => ({
                label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                value: value
            }));
        }
        console.log('Final specifications:', specifications);

        // Filter out any invalid specifications
        specifications = specifications.filter(spec => {
            const isValid = spec && spec.label && spec.value !== undefined && spec.value !== null && spec.value !== '';
            if (!isValid) {
                console.log('Filtered out invalid specification:', spec);
            }
            return isValid;
        });
        console.log('Filtered specifications:', specifications);

    } catch (error) {
        console.error('Error parsing vehicle data:', error);
        images = [];
        features = {};
        specifications = [];
    }

    // If no valid images, use default thumbnails
    const thumbnailsHtml = images.length > 0 
        ? images.map((img, index) => createThumbnail(img, index, index === 0)).join('')
        : createDefaultThumbnails();

    const content = `
        <div class="gallery-container">
            <div class="main-image-container">
                <img src="${images[0] || FALLBACK_IMAGE}" 
                     alt="${vehicle.car_title || 'Vehicle'}" 
                     class="main-image" 
                     id="mainImage"
                     onerror="handleImageError(this)">
            </div>
            <div class="thumbnail-container">
                ${thumbnailsHtml}
            </div>
        </div>

        <div class="contact-section">
            <h3>Interested in this car?</h3>
            <p>Contact us to schedule a test drive or get more information</p>
            <div class="contact-buttons">
                <button class="contact-btn btn-primary" onclick="bookAppointment()">
                    <i class="fas fa-calendar-alt"></i>
                    Book Appointment
                </button>
                <button class="wishlist-btn" onclick="toggleWishlist(this)">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>

        <div class="car-details">
            <div class="dealer-id">Dealer ID: ${vehicle.dealer_id || 'N/A'}</div>
            <h1 class="car-title">${vehicle.car_title || 'Vehicle Details'}</h1>
            <div class="price-badge">₹${formatPrice(vehicle.price || 0)}</div>

            ${vehicle.description ? `
                <div class="description">
                    ${vehicle.description}
                </div>
            ` : ''}

            <div class="car-tabs">
                <button class="tab-button active" onclick="openTab(event, 'overview')">Car Overview</button>
                <button class="tab-button" onclick="openTab(event, 'features')">Features</button>
                <button class="tab-button" onclick="openTab(event, 'specifications')">Specifications</button>
            </div>

            <div id="overview" class="tab-content active">
                <div class="overview-section">
                    <h2 class="overview-section-title">Car Overview</h2>
                    <ul class="overview-list">
                        <li class="overview-list-item">
                            <span class="overview-list-label">Make</span>
                            <span class="overview-list-value">${vehicle.make || 'N/A'}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Model</span>
                            <span class="overview-list-value">${vehicle.model || 'N/A'}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Year</span>
                            <span class="overview-list-value">${vehicle.year || 'N/A'}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Mileage</span>
                            <span class="overview-list-value">${vehicle.kms_driven ? vehicle.kms_driven.toLocaleString() + ' km' : 'N/A'}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Fuel Type</span>
                            <span class="overview-list-value">${capitalizeFirstLetter(vehicle.fuel_type || 'N/A')}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Transmission</span>
                            <span class="overview-list-value">${capitalizeFirstLetter(vehicle.transmission || 'N/A')}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Seats</span>
                            <span class="overview-list-value">${vehicle.seats || 'N/A'}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Location</span>
                            <span class="overview-list-value">${vehicle.location || 'N/A'}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Ownership</span>
                            <span class="overview-list-value">${vehicle.ownership || 'N/A'}</span>
                        </li>
                        <li class="overview-list-item">
                            <span class="overview-list-label">Insurance</span>
                            <span class="overview-list-value">${vehicle.insurance || 'N/A'}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div id="features" class="tab-content">
                <div class="overview-section">
                    <h2 class="overview-section-title">Features</h2>
                    ${Object.keys(features).length > 0 ? `
                        <ul class="overview-list">
                            ${Object.entries(features).map(([category, items]) => 
                                Array.isArray(items) ? items.map(feature => `
                                    <li class="overview-list-item">
                                        <span class="overview-list-label">${feature}</span>
                                        <span class="overview-list-value">
                                            <i class="fas fa-check" style="color: #28a745;"></i>
                                        </span>
                                    </li>
                                `).join('') : ''
                            ).join('')}
                        </ul>
                    ` : '<p class="overview-section-empty">No features available</p>'}
                </div>
            </div>

            <div id="specifications" class="tab-content">
                <div class="overview-section">
                    <h2 class="overview-section-title">Specifications</h2>
                    ${specifications.length > 0 ? `
                        <ul class="overview-list">
                            ${specifications.map(spec => `
                                <li class="overview-list-item">
                                    <span class="overview-list-label">${spec.label || ''}</span>
                                    <span class="overview-list-value">${spec.value || 'N/A'}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p class="overview-section-empty">No specifications available</p>'}
                </div>
            </div>
        </div>

        
    `;
    // <div class="similar-cars">
    //         <h2 class="section-title">Similar Cars</h2>
    //         <div class="similar-cars-grid" id="similarCars">
    //             <!-- Similar cars will be loaded here -->
    //         </div>
    //     </div>

    document.getElementById('vehicleDetails').innerHTML = content;
    document.getElementById('vehicleDetails').classList.remove('loading');

    // Show the actual title and hide loading state
    document.getElementById('similarCarsTitle').style.display = 'none';
    document.getElementById('similarCarsActualTitle').style.display = 'block';

    // Load similar cars
    loadSimilarCars(vehicle.make, vehicle.id);
}

// Update main image when clicking thumbnails
function updateMainImage(thumbnail, imgSrc) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = imgSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

// Load similar cars with fallback images
async function loadSimilarCars(make, currentVehicleId) {
    try {
        // Show loading state for cards
        document.getElementById('cardsSlider').innerHTML = LOADING_CARDS_HTML;
        
        const currentVehicle = document.querySelector('.car-details');
        const currentPrice = parseFloat(currentVehicle.querySelector('.price-badge').textContent.replace('₹', '').replace(/,/g, ''));
        const currentLocation = currentVehicle.querySelector('.overview-list-item:nth-child(8) .overview-list-value').textContent;

        // Calculate price range (±20% of current price)
        const minPrice = Math.floor(currentPrice * 0.8);
        const maxPrice = Math.ceil(currentPrice * 1.2);

        // Fetch cars with similar price range and location
        const response = await fetch(`${API_BASE_URL}/api/vehicles?location=${encodeURIComponent(currentLocation)}&minPrice=${minPrice}&maxPrice=${maxPrice}&exclude=${currentVehicleId}&limit=3`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch similar cars');
        }
        
        const data = await response.json();
        if (!data.success || !data.data) {
            throw new Error('Invalid response from server');
        }

        const similarCarsHtml = data.data.map(vehicle => {
            let imageUrl = FALLBACK_IMAGE;
            try {
                const images = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
                imageUrl = (images && images[0]) || FALLBACK_IMAGE;
            } catch (error) {
                console.error('Error parsing similar car images:', error);
            }

            return `
                <div style="min-width: 300px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.3s ease;">
                    <img src="${imageUrl}" alt="${vehicle.car_title}" 
                         style="width: 100%; height: 250px; object-fit: cover;"
                         onerror="this.src='assets/media/content/b-goods/375x300/3.jpg'">
                    <div style="padding: 20px;">
                        <h3 style="font-size: 18px; color: #333; margin-bottom: 10px;">${vehicle.car_title}</h3>
                        <p style="font-size: 20px; color: #d01818; font-weight: 600; margin-bottom: 15px;">₹${formatPrice(vehicle.price)}</p>
                        <a href="vehicle-details.html?id=${vehicle.id}" style="display: inline-block; padding: 10px 20px; border: 2px solid #d01818; border-radius: 25px; color: #d01818; text-decoration: none; font-weight: 500; transition: all 0.3s ease;">
                            View Details <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        // Update the slider content
        const slider = document.getElementById('cardsSlider');
        if (data.data.length === 0) {
            slider.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <p style="color: #666; margin-bottom: 10px;">No similar cars found in ${currentLocation}</p>
                    <p style="color: #666;">Price range: ₹${formatPrice(minPrice)} - ₹${formatPrice(maxPrice)}</p>
                </div>
            `;
        } else {
            slider.innerHTML = similarCarsHtml;
            // Initialize infinite slider after loading content
            initializeInfiniteSlider();
            // Initialize hover effects for new cards
            initializeCardHoverEffects();
        }
    } catch (error) {
        console.error('Error loading similar cars:', error);
        document.getElementById('cardsSlider').innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <p style="color: #666;">No similar cars found</p>
            </div>
        `;
    }
}

// Initialize hover effects
function initializeHoverEffects() {
    // Add hover effect for cards
    document.querySelectorAll('[style*="transition: transform"]').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // Add hover effect for buttons
    document.querySelectorAll('[style*="border: 2px solid #d01818"]').forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.background = '#d01818';
            button.style.color = '#fff';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = 'transparent';
            button.style.color = '#d01818';
        });
    });
}

// Show error message
function showError(title, message) {
    document.getElementById('vehicleDetails').innerHTML = `
        <div class="error-state">
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h2 class="error-message">${title}</h2>
            <p class="error-description">${message}</p>
            <a href="allcars.html" class="btn btn-primary">
                Back to All Cars
            </a>
        </div>
    `;
    document.getElementById('vehicleDetails').classList.remove('loading');
}

// Format price with Indian numbering system
function formatPrice(price) {
    return Number(price).toLocaleString('en-IN');
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Book appointment
function bookAppointment() {
    openModal('bookingModal');
}

// Toggle wishlist
function toggleWishlist(btn) {
    btn.classList.toggle('active');
    const icon = btn.querySelector('i');
    icon.classList.toggle('far');
    icon.classList.toggle('fas');
    // TODO: Add logic to save to wishlist in backend
} 