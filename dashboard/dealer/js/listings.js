// Global configuration
window.API_BASE_URL = 'https://gaadiyaan-api-x18f.onrender.com/api';
window.ASSETS_BASE_URL = 'https://gaadiyaan-api-x18f.onrender.com';

// Module variables
let currentView = 'grid';
let currentPage = 1;
let currentFilters = {};

// Function to make API calls with proper CORS handling
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(`${window.API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
}

// Initialize listings page
async function initializeListings() {
    setupEventListeners();
    await loadListings();
    populateYearFilter();
}

// Setup all event listeners
function setupEventListeners() {
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            toggleView(view);
        });
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = searchInput.value;
            loadListings();
        }, 500);
    });

    // Filters
    document.getElementById('applyFilters').addEventListener('click', () => {
        currentFilters = {
            minPrice: document.getElementById('minPrice').value,
            maxPrice: document.getElementById('maxPrice').value,
            year: document.getElementById('yearFilter').value,
            fuelType: document.getElementById('fuelTypeFilter').value,
            transmission: document.getElementById('transmissionFilter').value
        };
        loadListings();
    });

    // Reset filters
    document.getElementById('resetFilters').addEventListener('click', () => {
        document.querySelectorAll('.filter-group input, .filter-group select').forEach(el => {
            el.value = '';
        });
        currentFilters = {};
        loadListings();
    });

    // Sorting
    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentFilters.sortBy = e.target.value;
        loadListings();
    });
}

// Toggle between grid and list view
function toggleView(view) {
    const container = document.getElementById('listingsContainer');
    const buttons = document.querySelectorAll('.view-btn');
    
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    container.className = `listings-${view}`;
    currentView = view;
}

// Load listings with filters and pagination
async function loadListings() {
    const container = document.getElementById('listingsContainer');
    const totalListings = document.getElementById('totalListings');
    
    try {
        container.innerHTML = '<div class="loading">Loading...</div>';
        
        // Get dealer ID from localStorage
        const userProfileStr = localStorage.getItem('userProfile');
        if (!userProfileStr) {
            throw new Error('User profile not found. Please login again.');
        }

        const userProfile = JSON.parse(userProfileStr);
        console.log('User Profile:', userProfile); // Debug log
        
        const dealer_id = userProfile.dealer_id;
        if (!dealer_id) {
            throw new Error('Dealer ID not found. Please set up your dealer profile first.');
        }

        console.log('Using dealer_id:', dealer_id); // Debug log

        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 12,
            dealer_id,
            ...currentFilters
        });
        
        console.log('API Request URL:', `/vehicles?${params}`); // Debug log
        const data = await apiCall(`/vehicles?${params}`);
        console.log('API Response:', data); // Debug log

        if (!data.success) {
            throw new Error(data.message || 'Failed to load listings');
        }
        
        // Update total count
        totalListings.textContent = data.pagination.total;
        
        // Render listings
        if (data.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-car"></i>
                    <h3>No Listings Found</h3>
                    <p>Try adjusting your filters or add a new listing</p>
                    <button class="btn-primary" onclick="loadPage('add-listing')">
                        Add New Listing
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = data.data.map(listing => createListingCard(listing)).join('');
        
        // Setup pagination
        setupPagination(data.pagination);
        
    } catch (error) {
        console.error('Error loading listings:', error);
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Listings</h3>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="loadListings()">Try Again</button>
            </div>
        `;
    }
}

// Create HTML for a listing card
function createListingCard(listing) {
    if (!listing) {
        console.error('Invalid listing data received');
        return '';
    }

    // Handle images - check if it's already parsed or needs parsing
    let images = [];
    try {
        images = listing.images ? (
            typeof listing.images === 'string' ? 
            JSON.parse(listing.images) : 
            listing.images
        ) : [];
    } catch (error) {
        console.error('Error parsing images:', error);
        images = [];
    }
    
    const defaultImage = `${window.ASSETS_BASE_URL}/assets/images/no-image.jpg`;
    const hasMultipleImages = images.length > 1;
    
    return `
        <div class="listing-card" data-id="${listing.id || ''}">
            <div class="listing-image">
                <div class="image-slider" data-current-index="0">
                    <img src="${images[0] || defaultImage}" alt="${listing.car_title || 'Vehicle'}" 
                         onerror="this.src='${defaultImage}'" class="slider-image">
                    ${hasMultipleImages ? `
                        <button class="slider-btn prev" onclick="slideImage(${listing.id}, 'prev')">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="slider-btn next" onclick="slideImage(${listing.id}, 'next')">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="image-counter">${1}/${images.length}</div>
                    ` : ''}
                    <div class="image-data" style="display: none;">${JSON.stringify(images)}</div>
                </div>
            </div>
            <div class="listing-content">
                <h3 class="listing-title">${listing.car_title || 'Untitled Vehicle'}</h3>
                <div class="listing-price">₹${(listing.price || 0).toLocaleString('en-IN')}</div>
                <div class="listing-details">
                    <span class="year">${listing.year || 'N/A'}</span>
                    <span class="mileage">${(listing.kms_driven || 0).toLocaleString('en-IN')} km</span>
                    <span class="fuel-type">${listing.fuel_type || 'N/A'}</span>
                    <span class="transmission">${listing.transmission || 'N/A'}</span>
                </div>
                <div class="listing-description">
                    <p>${listing.description || 'No description available'}</p>
                </div>
                <div class="listing-actions">
                    <button class="btn-edit" onclick="editListing(${listing.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteListing(${listing.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Add image slider functionality
function slideImage(listingId, direction) {
    const card = document.querySelector(`.listing-card[data-id="${listingId}"]`);
    const slider = card.querySelector('.image-slider');
    const img = slider.querySelector('.slider-image');
    const counter = slider.querySelector('.image-counter');
    const imagesData = JSON.parse(slider.querySelector('.image-data').textContent);
    
    let currentIndex = parseInt(slider.dataset.currentIndex);
    
    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % imagesData.length;
    } else {
        currentIndex = (currentIndex - 1 + imagesData.length) % imagesData.length;
    }
    
    slider.dataset.currentIndex = currentIndex;
    img.src = imagesData[currentIndex] || `${window.ASSETS_BASE_URL}/assets/images/no-image.jpg`;
    counter.textContent = `${currentIndex + 1}/${imagesData.length}`;
}

// Setup pagination controls
function setupPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    const { currentPage, totalPages } = pagination;
    
    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <button class="page-btn" 
                onclick="changePage(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}"
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span class="page-dots">...</span>';
        }
    }

    // Next button
    paginationHTML += `
        <button class="page-btn" 
                onclick="changePage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadListings();
    window.scrollTo(0, 0);
}

// Populate year filter
function populateYearFilter() {
    const yearFilter = document.getElementById('yearFilter');
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }
}

// Edit listing
function editListing(id) {
    // Store the ID in sessionStorage
    sessionStorage.setItem('editListingId', id);
    // Navigate to edit page
    loadPage('edit-listing');
}

// Delete listing
function deleteListing(id) {
    if (confirm('Are you sure you want to delete this listing?')) {
        fetch(`${window.API_BASE_URL}/vehicles/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadListings();
            } else {
                alert('Error deleting listing: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting listing');
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeListings); 