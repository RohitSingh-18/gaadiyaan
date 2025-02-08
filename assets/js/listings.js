// Configuration
const API_BASE_URL = 'https://gaadiyaan-api.onrender.com';
const ITEMS_PER_PAGE = 12;

// State management
let currentPage = 1;
let currentFilters = {
    make: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    year: '',
    fuelType: [],
    transmission: '',
    seats: '',
    kmsRange: '',
    locations: []
};
let isLoading = false;
let totalPages = 0;
let currentSort = 'newest';
let isMobile = window.innerWidth <= 576;
let isLoadingMore = false;
let hasMoreItems = true;
let makes = [];
let models = {};
let selectedLocationsList = new Set();
let availableLocations = [];

// DOM Elements
const listingsContainer = document.getElementById('listingsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResultsMessage = document.getElementById('noResultsMessage');
const resultsInfo = document.getElementById('resultsInfo');
const pagination = document.getElementById('pagination');
const sortSelect = document.querySelector('.b-filter-goods__select select');

// Add this after the DOM Elements section
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.innerHTML = `
    <div class="text-center p-3">
        <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Loading...</span>
        </div>
    </div>
`;

// Add this at the top level of the file
window.handlePageChange = async function(newPage) {
    if (!isNaN(newPage) && newPage !== currentPage) {
        currentPage = newPage;
        await initListings();
        window.scrollTo({
            top: listingsContainer.offsetTop - 100,
            behavior: 'smooth'
        });
    }
    return false;
};

// Add this function to sort listings based on selected make and model
function sortListingsByMakeModel(listings, selectedMake, selectedModel) {
    return listings.sort((a, b) => {
        const aMake = (a.make || '').toLowerCase().trim();
        const bMake = (b.make || '').toLowerCase().trim();
        const aModel = (a.model || '').toLowerCase().trim();
        const bModel = (b.model || '').toLowerCase().trim();
        const selectedMakeLower = (selectedMake || '').toLowerCase().trim();
        const selectedModelLower = (selectedModel || '').toLowerCase().trim();

        // Calculate match scores
        const aScore = getMatchScore(aMake, aModel, selectedMakeLower, selectedModelLower);
        const bScore = getMatchScore(bMake, bModel, selectedMakeLower, selectedModelLower);

        // Sort by score (higher scores first)
        return bScore - aScore;
    });
}

// Add a helper function to calculate match scores
function getMatchScore(make, model, selectedMake, selectedModel) {
    let score = 0;
    
    // Exact make match gets highest priority
    if (make === selectedMake) {
        score += 100;
    } 
    // Partial make match gets lower priority
    else if (selectedMake && make.includes(selectedMake)) {
        score += 50;
    }

    // If make matches and model matches exactly, highest priority
    if (score > 0 && model === selectedModel) {
        score += 100;
    }
    // If make matches and model matches partially, medium priority
    else if (score > 0 && selectedModel && model.includes(selectedModel)) {
        score += 50;
    }

    return score;
}

// Update fetchListings to use the same approach for both mobile and desktop
async function fetchListings(page = 1, filters = {}, sort = currentSort) {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: '1000', // Get all results for both mobile and desktop
            sort: sort
        });

        // Add filters to query
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value) && value.length > 0) {
                    queryParams.append(key, value.join(','));
                } else if (typeof value === 'string' && value.trim() !== '') {
                    queryParams.append(key, value.trim());
                }
            }
        });

        const response = await fetch(`${API_BASE_URL}/api/vehicles?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch listings');
        
        const data = await response.json();
        
        // Apply flexible filtering for both mobile and desktop
        let filteredData = data.data || [];
        filteredData = applyFlexibleFilters(filteredData, filters);

        return {
            success: true,
            data: filteredData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(filteredData.length / ITEMS_PER_PAGE),
                totalItems: filteredData.length
            }
        };
    } catch (error) {
        console.error('Error in fetchListings:', error);
        return null;
    }
}

// Update initializeFilterHandlers to handle all filters the same way
function initializeFilterHandlers() {
    const filterInputs = document.querySelectorAll('.filter-group select, .filter-group input');
    
    filterInputs.forEach(input => {
        input.addEventListener('change', async function() {
            // Update currentFilters based on the changed input
            if (this.type === 'checkbox') {
                const filterName = this.name;
                if (!currentFilters[filterName]) currentFilters[filterName] = [];
                
                if (this.checked) {
                    currentFilters[filterName].push(this.value);
                } else {
                    currentFilters[filterName] = currentFilters[filterName]
                        .filter(value => value !== this.value);
                }
            } else {
                currentFilters[this.name] = this.value;
            }

            // Reset pagination when filters change
            currentPage = 1;
            
            // Immediately fetch and display new results
            await initListings(true);
        });
    });
}

// Update applyFlexibleFilters to be more inclusive
function applyFlexibleFilters(listings, filters) {
    return listings.map(listing => {
        let score = 0;
        const price = parseInt(listing.price) || 0;
        const make = (listing.make || '').toLowerCase().trim();
        const model = (listing.model || '').toLowerCase().trim();
        const fuelType = (listing.fuelType || '').toLowerCase().trim();
        const transmission = (listing.transmission || '').toLowerCase().trim();
        const seats = listing.seats?.toString() || '';
        const kmsRange = listing.kmsRange || '';
        const location = (listing.location || '').toLowerCase().trim();

        // Calculate match scores
        if (filters.make && make === filters.make.toLowerCase()) score += 100;
        if (filters.model && model === filters.model.toLowerCase()) score += 100;
        if (filters.fuelType && filters.fuelType.includes(fuelType)) score += 50;
        if (filters.transmission && transmission === filters.transmission.toLowerCase()) score += 50;
        if (filters.seats && seats === filters.seats) score += 50;
        if (filters.kmsRange && kmsRange === filters.kmsRange) score += 50;
        if (filters.locations?.length && filters.locations.some(loc => location.includes(loc.toLowerCase()))) score += 50;

        // Price range check
        const minPrice = parseInt(filters.minPrice) || 0;
        const maxPrice = parseInt(filters.maxPrice) || Infinity;
        if (price >= minPrice && price <= maxPrice) score += 50;

        // Include if matches ANY criteria or no filters are set
        const hasMatchingCriteria = (
            (!filters.make || make.includes(filters.make.toLowerCase())) ||
            (!filters.model || model.includes(filters.model.toLowerCase())) ||
            (!filters.fuelType?.length || filters.fuelType.includes(fuelType)) ||
            (!filters.transmission || transmission === filters.transmission.toLowerCase()) ||
            (!filters.seats || seats === filters.seats) ||
            (!filters.kmsRange || kmsRange === filters.kmsRange) ||
            (!filters.locations?.length || filters.locations.some(loc => location.includes(loc.toLowerCase()))) ||
            (price >= minPrice && price <= maxPrice)
        );

        return {
            ...listing,
            score,
            shouldInclude: hasMatchingCriteria
        };
    }).filter(item => item.shouldInclude)
      .sort((a, b) => b.score - a.score);
}

// Create HTML for a single listing card
function createListingCard(listing) {
    const mainImage = listing.images && listing.images.length > 0 ? listing.images[0] : 'assets/media/content/b-goods/375x300/1.jpg';
    
    return `
        <div class="col-xl-4 col-md-6 mb-4">
            <div class="b-goods-f b-goods-f_mod-a card-hover-shadow" style="height: 380px; background: white;">
                <div class="b-goods-f__media" style="height: 200px; overflow: hidden; margin: 0;">
                    <a href="vehicle-details.html?id=${listing.id}" style="display: block; height: 100%;">
                        <img class="b-goods-f__img img-scale" src="${mainImage}" alt="${listing.car_title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                        ${listing.condition === 'New' ? '<div class="b-goods-f__label bg-primary">New</div>' : ''}
                    </a>
                </div>
                <div class="b-goods-f__main" style="padding: 15px; margin-top: 0; background: white;">
                    <div class="b-goods-f__descrip">
                        <div class="b-goods-f__title" style="min-height: 60px; max-height: 60px; overflow: hidden; margin-bottom: 15px;">
                            <a href="vehicle-details.html?id=${listing.id}" class="text-dark" style="font-size: 1rem; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                                ${listing.car_title}
                            </a>
                        </div>
                        <div class="b-goods-f__info d-flex align-items-center flex-wrap" style="margin-bottom: 15px; gap: 2px;">
                            <span class="badge bg-light text-dark" style="font-size: 0.7rem; padding: 4px 8px;">${listing.location}</span>
                            <span class="badge bg-light text-dark" style="font-size: 0.7rem; padding: 4px 8px;">${listing.transmission}</span>
                            <span class="badge bg-light text-dark" style="font-size: 0.7rem; padding: 4px 8px;">${listing.fuel_type}</span>
                        </div>
                        <div class="text-center" style="margin-top: 15px;">
                            <span class="h4 mb-0" style="color: #dc3545; font-weight: 600;">₹${formatPrice(listing.price)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Format price with commas
function formatPrice(price) {
    return price.toLocaleString('en-IN');
}

// Update the listings container with new data
function updateListings(listings, append = false) {
    if (!listings || listings.length === 0) {
        listingsContainer.innerHTML = '<div class="col-12 text-center py-5">No vehicles found matching your criteria.</div>';
        return;
    }

    if (append) {
        appendListings(listings);
    } else {
        const cardsHTML = listings.map(listing => createListingCard(listing)).join('');
        listingsContainer.innerHTML = cardsHTML;
    }

    // Setup infinite scroll for mobile
    if (isMobile) {
        setupInfiniteScroll();
    }
}

// Update loading state
function updateLoadingState() {
    if (loadingSpinner && !isMobile) {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
    if (listingsContainer) {
        listingsContainer.style.opacity = isLoading ? '0.5' : '1';
    }

    // Handle mobile loading indicator
    const existingIndicator = document.querySelector('.loading-indicator');
    if (isMobile && (isLoading || isLoadingMore)) {
        if (!existingIndicator && listingsContainer) {
            listingsContainer.insertAdjacentElement('afterend', loadingIndicator);
        }
    } else if (existingIndicator) {
        existingIndicator.remove();
    }
}

// Show error message
function showError(message) {
    if (noResultsMessage) {
        noResultsMessage.textContent = message;
        noResultsMessage.style.display = 'block';
    }
}

// Add these styles to the page
const cardStyles = `
<style>
    .card-hover-shadow {
        transition: all 0.3s ease;
        border: 1px solid #eee;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
    }
    
    .card-hover-shadow:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    
    .b-goods-f__media {
        position: relative;
        overflow: hidden;
        border-radius: 8px 8px 0 0;
    }
    
    .b-goods-f__img {
        height: 220px;
        object-fit: cover;
        width: 100%;
        transition: transform 0.3s ease;
    }
    
    .b-goods-f:hover .b-goods-f__img {
        transform: scale(1.05);
    }
    
    .b-goods-f__label {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        font-weight: 600;
        z-index: 1;
    }
    
    .b-goods-f__main {
        padding: 20px;
    }
    
    .b-goods-f__title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 10px;
        line-height: 1.4;
    }
    
    .b-goods-f__title a {
        text-decoration: none;
    }
    
    .b-goods-f__info {
        font-size: 14px;
        color: #666;
    }
    
    .badge {
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: 500;
        margin-right: 8px;
    }
    
    .b-goods-f__list {
        margin: 15px 0;
    }
    
    .b-goods-f__list-item {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
        font-size: 14px;
    }
    
    .b-goods-f__list-item:last-child {
        border-bottom: none;
    }
    
    .b-goods-f__list-title {
        color: #666;
    }
    
    .b-goods-f__price-group {
        display: block;
        margin-bottom: 15px;
        text-align: center;
    }
    
    .b-goods-f__price {
        font-size: 24px;
        font-weight: 700;
        color: #d01818;
    }
    
    .b-goods-f__btn {
        width: 100%;
        padding: 10px;
        text-align: center;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .b-goods-f__btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 10px rgba(208,24,24,0.2);
    }
    
    .mr-2 {
        margin-right: 8px;
    }
    
    .mb-3 {
        margin-bottom: 15px;
    }
    
    .bg-light {
        background-color: #f8f9fa !important;
    }
    
    .text-dark {
        color: #343a40 !important;
    }
    
    .text-muted {
        color: #6c757d !important;
    }

    /* Pagination Styles */
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px;
        margin: 20px 0;
        padding: 0 10px;
        user-select: none;
    }

    .page-item {
        margin: 0 2px;
        -webkit-tap-highlight-color: transparent;
    }

    .page-link {
        min-width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 10px;
        border-radius: 4px !important;
        border: 1px solid #dee2e6;
        color: #333;
        background-color: #fff;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        cursor: pointer;
        text-decoration: none !important;
    }

    .page-item.active .page-link {
        background-color: #d01818;
        border-color: #d01818;
        color: #fff !important;
        pointer-events: none;
    }

    .page-item.disabled .page-link {
        background-color: #f8f9fa;
        border-color: #dee2e6;
        color: #6c757d !important;
        cursor: not-allowed;
        pointer-events: none;
    }

    .page-link:hover:not(.disabled) {
        background-color: #e9ecef;
        border-color: #dee2e6;
        color: #d01818;
    }

    /* Mobile Pagination Styles */
    @media (max-width: 576px) {
        .pagination {
            gap: 3px;
        }

        .page-link {
            min-width: 35px;
            height: 35px;
            padding: 0 8px;
            font-size: 13px;
        }

        .page-item.mobile-hide {
            display: none;
        }

        .page-item {
            margin: 0;
            padding: 5px;
        }

        .page-link {
            position: relative;
            z-index: 1;
        }
    }
</style>
`;

// Add styles to the page
document.head.insertAdjacentHTML('beforeend', cardStyles);

// Add these styles to your existing CSS
const paginationStyles = `
    .pagination {
        margin: 2rem 0;
        display: flex;
        justify-content: center;
        gap: 5px;
    }

    .pagination .page-link {
        color: #333;
        border: 1px solid #ddd;
        padding: 8px 12px;
        min-width: 40px;
        text-align: center;
        transition: all 0.3s ease;
    }

    .pagination .page-item.active .page-link {
        background-color: #d01818;
        border-color: #d01818;
        color: white;
    }

    .pagination .page-item.disabled .page-link {
        color: #999;
        pointer-events: none;
    }

    .pagination .page-link:hover:not(.disabled) {
        background-color: #f8f9fa;
        color: #d01818;
        border-color: #d01818;
    }
`;

// Add the styles to the document
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = paginationStyles;
    document.head.appendChild(style);
});

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing locations...');
        await fetchLocations();
        await fetchMakes();
        await initListings();
        initializeFilterHandlers();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Add this new function for price input initialization
function initializePriceInputs(minInput, maxInput) {
    const formatPrice = (input) => {
        let value = input.value.replace(/[^0-9]/g, '');
        if (value) {
            value = parseInt(value);
            input.value = '₹ ' + value.toLocaleString('en-IN');
        }
    };

    [minInput, maxInput].forEach(input => {
        input.addEventListener('input', () => formatPrice(input));
        
        input.addEventListener('blur', () => {
            if (!input.value.startsWith('₹')) {
                input.value = input.value ? '₹ ' + parseInt(input.value).toLocaleString('en-IN') : '';
            }
        });
    });

    // Validate price range
    maxInput.addEventListener('change', () => {
        const minPrice = parseInt(minInput.value.replace(/[^0-9]/g, '')) || 0;
        const maxPrice = parseInt(maxInput.value.replace(/[^0-9]/g, '')) || 0;
        
        if (maxPrice && maxPrice < minPrice) {
            maxInput.value = minInput.value;
        }
    });
}

// Update the updatePagination function to handle pagination UI
function updatePagination(paginationData) {
    if (!pagination) return;
    
    const { currentPage, totalPages, totalItems } = paginationData;
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    let paginationHTML = `
        <ul class="pagination justify-content-center">
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="return handlePageChange(${currentPage - 1})" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Show first page
    if (currentPage > 3) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="return handlePageChange(1)">1</a>
            </li>
            ${currentPage > 4 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
        `;
    }

    // Show pages around current page
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="return handlePageChange(${i})">${i}</a>
                </li>
            `;
    }

    // Show last page
    if (currentPage < totalPages - 2) {
            paginationHTML += `
            ${currentPage < totalPages - 3 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
            <li class="page-item">
                <a class="page-link" href="#" onclick="return handlePageChange(${totalPages})">${totalPages}</a>
                </li>
            `;
    }

    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="return handlePageChange(${currentPage + 1})" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    </ul>`;

    pagination.innerHTML = paginationHTML;
    pagination.style.display = 'block';
}

// Add resize listener to update pagination on screen size change
window.addEventListener('resize', () => {
    if (currentPage) {
        updatePagination({ currentPage, totalPages });
    }
});

// Update the initListings function
async function initListings(resetPage = false) {
    try {
        if (resetPage) {
            currentPage = 1;
            hasMoreItems = true;
            if (listingsContainer) {
                listingsContainer.innerHTML = '';
            }
        }

        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (listingsContainer) listingsContainer.style.opacity = '0.5';

        const response = await fetchListings(currentPage, currentFilters, currentSort);
        
        if (!response || !response.success) {
            throw new Error('Failed to fetch listings');
        }

        // Update listings container
        if (listingsContainer) {
            if (response.data.length === 0) {
                listingsContainer.innerHTML = `
                    <div class="no-results">
                        <h3>No vehicles found</h3>
                        <p>Try adjusting your filters to see more results</p>
                    </div>
                `;
                hasMoreItems = false;
            } else {
                const listings = response.data.map(listing => createListingCard(listing)).join('');
                listingsContainer.innerHTML = listings;
                
                // Update hasMoreItems flag
                hasMoreItems = currentPage < response.pagination.totalPages;
            }
            listingsContainer.style.opacity = '1';
        }

        // Update results info
        if (resultsInfo && response.pagination) {
            const total = response.pagination.totalItems;
            const currentlyShowing = Math.min(currentPage * ITEMS_PER_PAGE, total);
            resultsInfo.innerHTML = `Showing <strong>1-${currentlyShowing}</strong> of <strong>${total}</strong> vehicles`;
        }

        updateLoadMoreButton();

    } catch (error) {
        console.error('Error initializing listings:', error);
        if (listingsContainer) {
            listingsContainer.innerHTML = '<div class="error">Error loading listings. Please try again.</div>';
        }
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// Add this function to debug filter results
function debugFilterResults(listings, filters) {
    console.log('=== Filter Debug ===');
    console.log('Applied Filters:', filters);
    console.log('Total Results:', listings.length);
    
    if (filters.make) {
        const makeMatches = listings.filter(item => 
            item.make?.toLowerCase() === filters.make.toLowerCase()
        );
        console.log(`Make "${filters.make}" matches:`, makeMatches.length);
    }
    
    if (filters.model) {
        const modelMatches = listings.filter(item => 
            item.model?.toLowerCase() === filters.model.toLowerCase()
        );
        console.log(`Model "${filters.model}" matches:`, modelMatches.length);
    }
    
    // Log first 3 results for inspection
    console.log('Sample Results:', listings.slice(0, 3));
    console.log('==================');
}

// Update the handleFilterSubmit function
function handleFilterSubmit(event) {
    if (event) event.preventDefault();
    
    const form = document.querySelector('.b-filter');
    const formData = new FormData(form);
    
    // Get selected price range
    const priceRange = formData.get('price_range');
    let [minPrice, maxPrice] = getPriceRangeValues(priceRange);

    // Get selected location
    const selectedLocation = formData.get('location') || '';

    // Update currentFilters with proper values
    currentFilters = {
        ...currentFilters,
        minPrice: minPrice.toString(),
        maxPrice: maxPrice === Infinity ? '' : maxPrice.toString(),
        make: formData.get('make') || '',
        model: formData.get('model') || '',
        year: formData.get('year') || '',
        fuelType: formData.getAll('fuelType'),
        transmission: formData.get('transmission') || '',
        seats: formData.get('seats') || '',
        kmsRange: formData.get('kmsRange') || '',
        location: selectedLocation
    };

    // Reset to first page and refresh listings
    currentPage = 1;
    hasMoreItems = true;
    initListings(true);
}

// Reset all filters
async function resetFilters() {
    // Reset all form elements
    document.querySelectorAll('.b-filter').forEach(form => {
        form.reset();
        
        // Reset Bootstrap select elements if they exist
        if (typeof $.fn.selectpicker !== 'undefined') {
            $(form).find('select').selectpicker('refresh');
        }
    });

    // Clear selected locations
    const selectedLocationsDesktop = document.getElementById('selectedLocationsDesktop');
    const selectedLocationsMobile = document.getElementById('selectedLocations');
    if (selectedLocationsDesktop) selectedLocationsDesktop.innerHTML = '';
    if (selectedLocationsMobile) selectedLocationsMobile.innerHTML = '';
    
    currentFilters = {
        make: '',
        model: '',
        minPrice: '',
        maxPrice: '',
        year: '',
        fuelType: [],
        transmission: '',
        seats: '',
        kmsRange: '',
        locations: []
    };

    await initListings(true);
}

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 576;

    if (wasMobile !== isMobile) {
        initListings(true);
    }
});

// Add infinite scroll for mobile
function setupInfiniteScroll() {
    if (!isMobile) return;

    const observer = new IntersectionObserver(
        async (entries) => {
            const target = entries[0];
            if (target.isIntersecting && !isLoadingMore && currentPage < totalPages) {
                isLoadingMore = true;
                currentPage++;
                const data = await fetchListings(currentPage, currentFilters, currentSort);
                if (data && data.data.length > 0) {
                    appendListings(data.data);
                }
                isLoadingMore = false;
            }
        },
        {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        }
    );

    // Observe the last item
    const observeLastItem = () => {
        const items = listingsContainer.children;
        if (items.length > 0) {
            observer.observe(items[items.length - 1]);
        }
    };

    // Initial observation
    observeLastItem();

    // Return the observer and callback for cleanup
    return { observer, observeLastItem };
}

// Append new listings for infinite scroll
function appendListings(listings) {
    const newListingsHTML = listings.map(listing => createListingCard(listing)).join('');
    listingsContainer.insertAdjacentHTML('beforeend', newListingsHTML);
}

// Update results info
function updateResultsInfo(paginationData) {
    if (!resultsInfo) return;

    const { total, currentPage, limit } = paginationData;
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    resultsInfo.innerHTML = `Showing results <strong>${start} to ${end}</strong> of total <strong>${total}</strong>`;
} 

// Update the fetchMakesAndModels function
async function fetchMakesAndModels() {
    try {
        // Add a large limit to get all vehicles
        const response = await fetch(`${API_BASE_URL}/api/vehicles?limit=1000`);
        if (!response.ok) {
            throw new Error('Failed to fetch vehicles');
        }
        const data = await response.json();
        console.log('Total vehicles fetched:', data.data?.length); // Debug log

        if (data.success && Array.isArray(data.data)) {
            const uniqueMakes = new Set();
            const modelsByMake = {};

            data.data.forEach(vehicle => {
                if (vehicle.make) {
                    const normalizedMake = vehicle.make.trim();
                    uniqueMakes.add(normalizedMake);

                    if (!modelsByMake[normalizedMake]) {
                        modelsByMake[normalizedMake] = new Set();
                    }

                    if (vehicle.model) {
                        modelsByMake[normalizedMake].add(vehicle.model.trim());
                    }
                }
            });

            // Convert Sets to sorted arrays
            makes = Array.from(uniqueMakes).sort();
            models = Object.fromEntries(
                Object.entries(modelsByMake).map(([make, modelSet]) => [
                    make,
                    Array.from(modelSet).sort()
                ])
            );

            console.log('Total unique makes:', makes.length); // Debug log
            populateMakeDropdown();
        }
    } catch (error) {
        console.error('Error fetching makes and models:', error);
    }
}

// Update the fetchMakes function
async function fetchMakes() {
    try {
        // Use the vehicles endpoint with a large limit to get all vehicles
        const response = await fetch(`${API_BASE_URL}/api/vehicles?limit=1000`);
        if (!response.ok) {
            throw new Error('Failed to fetch vehicles');
        }
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            // Extract unique makes from all vehicles
            const uniqueMakes = new Set(
                data.data
                    .map(vehicle => vehicle.make?.trim())
                    .filter(make => make) // Remove null/undefined/empty
            );
            
            // Convert to sorted array
            makes = Array.from(uniqueMakes).sort();
            console.log('Total unique makes found:', makes.length); // Debug log
            populateMakeDropdown();
        }
    } catch (error) {
        console.error('Error fetching makes:', error);
    }
}

// Update the populateMakeDropdown function to handle multiple instances
function populateMakeDropdown() {
    const makeSelects = document.querySelectorAll('select[name="make"]');
    if (!makeSelects.length) return;

    const makeOptions = `
        <option value="">Select Make</option>
        ${makes.map(make => `<option value="${make}">${make}</option>`).join('')}
    `;

    makeSelects.forEach(select => {
        select.innerHTML = makeOptions;
        // Refresh Bootstrap select if available
        if (typeof $.fn.selectpicker !== 'undefined') {
            $(select).selectpicker('refresh');
        }
    });
    
    console.log('Populated makes:', makes.length); // Debug log
}

// Update the populateModelDropdown function to handle multiple instances
function populateModelDropdown(selectedMake) {
    // Get all model select elements
    const modelSelects = document.querySelectorAll('select[name="model"]');
    if (!modelSelects.length) return;

    const availableModels = models[selectedMake] || [];
    const modelOptions = `
        <option value="">Select Model</option>
        ${availableModels.map(model => `<option value="${model}">${model}</option>`).join('')}
    `;

    modelSelects.forEach(select => {
        select.innerHTML = modelOptions;
        // Refresh Bootstrap select if available
        if (typeof $.fn.selectpicker !== 'undefined') {
            $(select).selectpicker('refresh');
        }
    });
}

// Update the initializeFormSubmission function to handle locations properly
function initializeFormSubmission() {
    const filterForms = document.querySelectorAll('.b-filter');
    
    filterForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            // Handle price range selection
            const selectedPriceRange = formData.get('price_range');
            let minPrice = '';
            let maxPrice = '';
            
            if (selectedPriceRange) {
                const [min, max] = getPriceRangeValues(selectedPriceRange);
                minPrice = min;
                maxPrice = max === Infinity ? '' : max;
            }
            
            // Update currentFilters with form values including price
            currentFilters = {
                make: formData.get('make') || '',
                model: formData.get('model') || '',
                minPrice: minPrice,
                maxPrice: maxPrice,
                year: formData.get('year') || '',
                fuelType: formData.getAll('fuelType') || [],
                transmission: formData.get('transmission') || '',
                seats: formData.get('seats') || '',
                kmsRange: formData.get('kmsRange') || '',
                locations: Array.from(selectedLocationsList)
            };

            // Reset to first page when applying new filters
        currentPage = 1;
            
            // Fetch and display filtered results
            await initListings(true);
        });
    });
}

// Add this function to initialize location handling
function initializeLocationHandling() {
    const locations = [
        "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
        "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda",
        "Angul", "Balangir", "Jeypore", "Barbil", "Kendujhar",
        "Dhenkanal", "Paradip", "Jajpur", "Rayagada", "Koraput"
    ];

    // Initialize location search for both mobile and desktop
    ['', 'Desktop'].forEach(suffix => {
        const locationSearch = document.getElementById(`locationSearch${suffix}`);
        const locationResults = document.getElementById(`locationResults${suffix}`);
        const selectedLocations = document.getElementById(`selectedLocations${suffix}`);

        if (locationSearch && locationResults && selectedLocations) {
            function showResults(searchText) {
                locationResults.innerHTML = '';
                if (!searchText) {
                    locationResults.style.display = 'none';
                    return;
                }

                const filteredLocations = locations.filter(location => 
                    location.toLowerCase().includes(searchText.toLowerCase()) &&
                    !selectedLocationsList.has(location)
                );

                if (filteredLocations.length === 0) {
                    locationResults.style.display = 'none';
                    return;
                }

                filteredLocations.forEach(location => {
                    const div = document.createElement('div');
                    div.className = `location-item${suffix}`;
                    div.textContent = location;
                    div.onclick = () => addLocation(location, suffix);
                    locationResults.appendChild(div);
                });

                locationResults.style.display = 'block';
            }

            function addLocation(location, suffix) {
                if (selectedLocationsList.has(location)) return;
                
                selectedLocationsList.add(location);
                const locationElement = document.createElement('span');
                locationElement.className = `selected-location${suffix}`;
                locationElement.innerHTML = `${location}<span class="remove-location">×</span>`;
                
                locationElement.querySelector('.remove-location').onclick = () => {
                    selectedLocationsList.delete(location);
                    locationElement.remove();
                    showResults(locationSearch.value);
                };
                
                selectedLocations.appendChild(locationElement);
                locationSearch.value = '';
                locationResults.style.display = 'none';
            }

            locationSearch.addEventListener('input', (e) => {
                showResults(e.target.value);
            });

            // Close results when clicking outside
            document.addEventListener('click', (e) => {
                if (!locationSearch.contains(e.target) && !locationResults.contains(e.target)) {
                    locationResults.style.display = 'none';
                }
            });

            // Prevent form submission on enter
            locationSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const firstResult = locationResults.querySelector(`.location-item${suffix}`);
                    if (firstResult) {
                        addLocation(firstResult.textContent, suffix);
                    }
                }
            });
        }
    });
}

// Update the toggleDesktopPriceDropdown function
function toggleDesktopPriceDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    const dropdown = document.querySelector('.price-range-dropdown');
    const options = document.getElementById('priceRangeOptionsDesktop');
    const icon = dropdown.querySelector('.fas.fa-chevron-down');
    
    if (options.style.display === 'block') {
        options.style.display = 'none';
        dropdown.classList.remove('active');
        icon.style.transform = 'rotate(0deg)';
    } else {
        options.style.display = 'block';
        dropdown.classList.add('active');
        icon.style.transform = 'rotate(180deg)';
    }
}

// Update the click outside handler
document.addEventListener('click', (e) => {
    const dropdowns = document.querySelectorAll('.price-range-dropdown');
    dropdowns.forEach(dropdown => {
        const options = dropdown.querySelector('.price-range-options');
        const icon = dropdown.querySelector('.fas.fa-chevron-down');
        if (dropdown && !dropdown.contains(e.target)) {
            options.style.display = 'none';
            dropdown.classList.remove('active');
            icon.style.transform = 'rotate(0deg)';
        }
    });
});

// Update the checkbox handler for both mobile and desktop
function updateSelectedPriceRanges(isDesktop = false) {
    const suffix = isDesktop ? 'Desktop' : '';
    const checkboxes = document.querySelectorAll(`input[name="price_range"][id$="${suffix}"]:checked`);
    const selectedText = document.getElementById(`selectedPriceRanges${suffix}`);
    
    if (checkboxes.length === 0) {
        selectedText.textContent = 'Select Price Range';
    } else if (checkboxes.length === 1) {
        selectedText.textContent = checkboxes[0].nextElementSibling.textContent;
    } else {
        selectedText.textContent = `${checkboxes.length} ranges selected`;
    }

    // Update filters and refresh listings
    const selectedRanges = Array.from(checkboxes).map(cb => cb.value);
    currentFilters.priceRanges = selectedRanges;
    initListings(true);
}

// Add event listeners when document loads
document.addEventListener('DOMContentLoaded', () => {
    // Add click handlers to price range headers
    const desktopPriceHeader = document.querySelector('.price-range-header');
    if (desktopPriceHeader) {
        desktopPriceHeader.onclick = (e) => toggleDesktopPriceDropdown(e);
    }

    // Add change handlers to checkboxes for both mobile and desktop
    const allPriceCheckboxes = document.querySelectorAll('input[name="price_range"]');
    allPriceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            updateSelectedPriceRanges(checkbox.id.includes('Desktop'));
        });
    });

    // Add click handlers to prevent dropdown from closing
    const allPriceOptions = document.querySelectorAll('.price-checkbox');
    allPriceOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
});

// Update reset filters to handle both mobile and desktop price ranges
const existingResetFunction = window.resetFilters || function() {};
window.resetFilters = function() {
    existingResetFunction();
    
    // Reset all price range checkboxes
    const allPriceCheckboxes = document.querySelectorAll('input[name="price_range"]');
    allPriceCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    // Reset all selected texts
    ['', 'Desktop'].forEach(suffix => {
        const selectedText = document.getElementById(`selectedPriceRanges${suffix}`);
        if (selectedText) {
            selectedText.textContent = 'Select Price Range';
        }
    });
    
    // Reset filters and refresh listings
    currentFilters.priceRanges = [];
    initListings(true);
};

// Helper function to get price range values
function getPriceRangeValues(range) {
    switch (range) {
        case 'under2':
            return [0, 200000];
        case '2to3':
            return [200000, 300000];
        case '3to5':
            return [300000, 500000];
        case '5to8':
            return [500000, 800000];
        case '8to10':
            return [800000, 1000000];
        case 'above10':
            return [1000000, Infinity];
        default:
            return [0, Infinity];
    }
}

// Make sure fetchMakes is called when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    await fetchMakes(); // Fetch all makes immediately when page loads
    // ... rest of your initialization code
});

// Update the loadMore function with better state management
async function loadMore() {
    if (isLoadingMore || !hasMoreItems) return;
    
    try {
        isLoadingMore = true;
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            loadMoreBtn.disabled = true;
        }

        // Store current state
        const nextPage = currentPage + 1;
        const currentFilterState = { ...currentFilters };

        const response = await fetchListings(nextPage, currentFilterState, currentSort);
        
        if (response && response.success && response.data.length > 0) {
            // Only update if filters haven't changed during the request
            if (JSON.stringify(currentFilterState) === JSON.stringify(currentFilters)) {
                currentPage = nextPage;
                
                // Create and append new listings
                const newListings = response.data.map(listing => createListingCard(listing)).join('');
                if (listingsContainer) {
                    listingsContainer.insertAdjacentHTML('beforeend', newListings);
                }
                
                // Update pagination state
                hasMoreItems = currentPage < response.pagination.totalPages;

// Update results info
                if (resultsInfo) {
                    const total = response.pagination.totalItems;
                    const currentlyShowing = Math.min(currentPage * ITEMS_PER_PAGE, total);
                    resultsInfo.innerHTML = `Showing <strong>1-${currentlyShowing}</strong> of <strong>${total}</strong> vehicles`;
                }
            }
        } else {
            hasMoreItems = false;
        }

    } catch (error) {
        console.error('Error loading more listings:', error);
        hasMoreItems = false;
    } finally {
        isLoadingMore = false;
        updateLoadMoreButton();
    }
}

// Update the updateLoadMoreButton function
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (!hasMoreItems) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = isMobile ? 'none' : 'block';
            loadMoreBtn.innerHTML = 'Load More Vehicles';
            loadMoreBtn.disabled = isLoadingMore;
        }
    }
}

// Add infinite scroll for mobile
function handleInfiniteScroll() {
    if (!isMobile || isLoadingMore || !hasMoreItems) return;

    const scrollPosition = window.innerHeight + window.pageYOffset;
    const bottomPosition = document.documentElement.offsetHeight - 1000;

    if (scrollPosition >= bottomPosition) {
        loadMore();
    }
}

// Add event listeners
window.addEventListener('scroll', handleInfiniteScroll);
window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 576;
    updateLoadMoreButton();
});

// Update the fetchLocations function to handle both dropdown and search versions
async function fetchLocations() {
    try {
        console.log('Fetching locations...');
        const response = await fetch(`${API_BASE_URL}/api/vehicles?limit=1000`);
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
            // Extract unique locations
            const uniqueLocations = new Set(
                data.data
                    .map(vehicle => vehicle.location?.trim())
                    .filter(location => location) // Remove null/undefined/empty
            );
            
            availableLocations = Array.from(uniqueLocations).sort();
            console.log('Available locations:', availableLocations);
            
            // Populate both desktop and mobile location filters
            populateLocationDropdown();
            populateMobileLocationDropdown();
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

// Add new function for mobile location dropdown
function populateMobileLocationDropdown() {
    const mobileLocationSelect = document.querySelector('.filter-sidebar select[name="location"]');
    if (!mobileLocationSelect) return;

    const locationOptions = `
        <option value="">Select Location</option>
        ${availableLocations.map(location => `<option value="${location}">${location}</option>`).join('')}
    `;

    mobileLocationSelect.innerHTML = locationOptions;
    
    // Initialize or refresh Bootstrap select if available
    if (typeof $.fn.selectpicker !== 'undefined') {
        $(mobileLocationSelect).selectpicker('refresh');
    }

    // Add change event listener for mobile location select
    mobileLocationSelect.addEventListener('change', async function() {
        currentFilters.locations = this.value ? [this.value] : [];
        currentPage = 1;
        await initListings(true);
    });
}

// Update initializeFilterHandlers to handle both location types
function initializeFilterHandlers() {
    const filterInputs = document.querySelectorAll('.filter-group select:not([name="location"]), .filter-group input');
    
    filterInputs.forEach(input => {
        input.addEventListener('change', async function() {
            // Update currentFilters based on the changed input
            if (this.type === 'checkbox') {
                const filterName = this.name;
                if (!currentFilters[filterName]) currentFilters[filterName] = [];
                
                if (this.checked) {
                    currentFilters[filterName].push(this.value);
                } else {
                    currentFilters[filterName] = currentFilters[filterName]
                        .filter(value => value !== this.value);
                }
            } else {
                currentFilters[this.name] = this.value;
            }

            // Reset pagination when filters change
            currentPage = 1;
            
            // Immediately fetch and display new results
            await initListings(true);
        });
    });
}

// Add this function to populate location dropdowns
function populateLocationDropdown() {
    // For desktop location dropdown
    const locationSelect = document.querySelector('select[name="location"]:not(.filter-sidebar select)');
    if (locationSelect) {
        const locationOptions = `
            <option value="">Select Location</option>
            ${availableLocations.map(location => `<option value="${location}">${location}</option>`).join('')}
        `;
        
        locationSelect.innerHTML = locationOptions;
        
        // Initialize or refresh Bootstrap select if available
        if (typeof $.fn.selectpicker !== 'undefined') {
            $(locationSelect).selectpicker('refresh');
        }

        // Add change event listener
        locationSelect.addEventListener('change', async function() {
            currentFilters.locations = this.value ? [this.value] : [];
            currentPage = 1;
            await initListings(true);
        });
    }
}

// Add this function to fetch models based on selected make
async function fetchModels(make) {
    try {
        console.log('Fetching models for make:', make);
        const response = await fetch(`${API_BASE_URL}/api/vehicles?make=${make}&limit=1000`);
        if (!response.ok) throw new Error('Failed to fetch models');
        
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
            // Extract unique models for the selected make
            const uniqueModels = new Set(
                data.data
                    .map(vehicle => vehicle.model?.trim())
                    .filter(model => model)
            );
            
            models[make] = Array.from(uniqueModels).sort();
            console.log('Available models:', models[make]);
            
            // Update model dropdowns
            updateModelDropdowns(make);
        }
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

// Add function to update model dropdowns
function updateModelDropdowns(make) {
    // Update both mobile and desktop model dropdowns
    const modelSelects = document.querySelectorAll('select[name="model"]');
    
    modelSelects.forEach(select => {
        const modelOptions = `
            <option value="">Select Model</option>
            ${models[make]?.map(model => `<option value="${model}">${model}</option>`).join('') || ''}
        `;
        
        select.innerHTML = modelOptions;
        
        // Refresh Bootstrap select if available
        if (typeof $.fn.selectpicker !== 'undefined') {
            $(select).selectpicker('refresh');
        }
    });
}

// Update the make change event handler
function initializeMakeChangeHandlers() {
    const makeSelects = document.querySelectorAll('select[name="make"]');
    
    makeSelects.forEach(select => {
        select.addEventListener('change', async function() {
            const selectedMake = this.value;
            currentFilters.make = selectedMake;
            currentFilters.model = ''; // Reset model when make changes
            
            // Reset model dropdowns
            const modelSelects = document.querySelectorAll('select[name="model"]');
            modelSelects.forEach(modelSelect => {
                modelSelect.innerHTML = '<option value="">Select Model</option>';
                if (typeof $.fn.selectpicker !== 'undefined') {
                    $(modelSelect).selectpicker('refresh');
                }
            });
            
            if (selectedMake) {
                await fetchModels(selectedMake);
            }
            
            // Update listings
            currentPage = 1;
            await initListings(true);
        });
    });
}

// Update form submission handlers to prevent page refresh
function initializeFormSubmission() {
    const filterForms = document.querySelectorAll('.b-filter');
    
    filterForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevent form submission
            
            const formData = new FormData(form);
            
            // Handle price range selection
            const selectedPriceRange = formData.get('price_range');
            let minPrice = '';
            let maxPrice = '';
            
            if (selectedPriceRange) {
                const [min, max] = getPriceRangeValues(selectedPriceRange);
                minPrice = min;
                maxPrice = max === Infinity ? '' : max;
            }
            
            // Update currentFilters
            currentFilters = {
                make: formData.get('make') || '',
                model: formData.get('model') || '',
                minPrice: minPrice,
                maxPrice: maxPrice,
                year: formData.get('year') || '',
                fuelType: formData.getAll('fuelType') || [],
                transmission: formData.get('transmission') || '',
                seats: formData.get('seats') || '',
                kmsRange: formData.get('kmsRange') || '',
                locations: formData.get('location') ? [formData.get('location')] : []
            };

            // Reset to first page when applying new filters
            currentPage = 1;
            
            // Fetch and display filtered results
            await initListings(true);
        });
    });
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing...');
        await fetchLocations();
        initializeMakeChangeHandlers();
        initializeFormSubmission();
        await initListings();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}); 