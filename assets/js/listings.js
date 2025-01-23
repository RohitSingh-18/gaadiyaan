// Configuration
const API_BASE_URL = 'https://gaadiyaan-api.onrender.com';
const ITEMS_PER_PAGE = 12;

// State management
let currentPage = 1;
let currentFilters = {};
let isLoading = false;
let totalPages = 0;
let currentSort = 'newest';
let isMobile = window.innerWidth <= 576;
let isLoadingMore = false;

// DOM Elements
const listingsContainer = document.getElementById('listingsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResultsMessage = document.getElementById('noResultsMessage');
const resultsInfo = document.getElementById('resultsInfo');
const pagination = document.getElementById('pagination');
const sortSelect = document.querySelector('.b-filter-goods__select select');

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

// Fetch listings with filters and pagination
async function fetchListings(page = 1, filters = {}, sort = currentSort) {
    try {
        isLoading = true;
        updateLoadingState();

        // Build query parameters
        const queryParams = new URLSearchParams({
            page,
            limit: ITEMS_PER_PAGE,
            sortBy: sort,
            ...filters
        });

        const response = await fetch(`${API_BASE_URL}/api/vehicles?${queryParams}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        // Update pagination state
        totalPages = data.pagination.totalPages;
        updatePagination(data.pagination);
        updateResultsInfo(data.pagination);

        return data;
    } catch (error) {
        console.error('Error fetching listings:', error);
        showError('Failed to load listings. Please try again later.');
        return null;
    } finally {
        isLoading = false;
        updateLoadingState();
    }
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
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
    if (listingsContainer) {
        listingsContainer.style.opacity = isLoading ? '0.5' : '1';
    }

    // Handle infinite scroll loading indicator
    const existingIndicator = document.querySelector('.loading-indicator');
    if (isMobile && isLoadingMore) {
        if (!existingIndicator) {
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize listings
    initListings();

    // Add filter form submit handler
    const filterForm = document.querySelector('.b-filter');
    if (filterForm) {
        filterForm.addEventListener('submit', handleFilterSubmit);
    }

    // Add sort change handler
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.value;
            if (selectedOption) {
                handleSortChange(selectedOption);
            }
        });
    }

    // Initialize Bootstrap components
    if (typeof $.fn.selectpicker !== 'undefined') {
        $('.selectpicker').selectpicker('refresh');
    }
});

// Update pagination UI
function updatePagination({ currentPage: page, totalPages }) {
    if (!pagination) return;
    
    // Hide pagination on mobile
    if (isMobile) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';
    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="return handlePageChange(${page - 1})" aria-label="Previous" ${page === 1 ? 'disabled' : ''}>
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Determine visible pages for desktop
    const range = 2;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const isFirstPage = i === 1;
        const isLastPage = i === totalPages;
        const isWithinRange = i >= page - range && i <= page + range;
        const showEllipsis = !isWithinRange && (i === page - range - 1 || i === page + range + 1);

        if (isFirstPage || isLastPage || isWithinRange) {
            paginationHTML += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="return handlePageChange(${i})">${i}</a>
                </li>
            `;
        } else if (showEllipsis) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${page === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="return handlePageChange(${page + 1})" aria-label="Next" ${page === totalPages ? 'disabled' : ''}>
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    pagination.innerHTML = paginationHTML;
}

// Add resize listener to update pagination on screen size change
window.addEventListener('resize', () => {
    if (currentPage) {
        updatePagination({ currentPage, totalPages });
    }
});

// Initialize listings
async function initListings() {
    const data = await fetchListings(currentPage, currentFilters, currentSort);
    if (data) {
        updateListings(data.data, false);
    }
}

// Handle filter form submission
function handleFilterSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    currentFilters = {
        minPrice: formData.get('minPrice'),
        maxPrice: formData.get('maxPrice'),
        year: formData.get('year'),
        fuelType: formData.get('fuel_type'),
        transmission: formData.get('transmission'),
        search: formData.get('search')
    };

    // Reset to first page when applying new filters
    currentPage = 1;
    initListings();
}

// Handle sort change
function handleSortChange(value) {
    currentSort = value;
    currentPage = 1; // Reset to first page when sorting changes
    initListings();
}

// Update results info
function updateResultsInfo(paginationData) {
    if (!resultsInfo) return;

    const { total, currentPage, limit } = paginationData;
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    resultsInfo.innerHTML = `Showing results <strong>${start} to ${end}</strong> of total <strong>${total}</strong>`;
}

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

// Handle window resize
function handleResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 576;

    // If mobile state changed, reset and reinitialize
    if (wasMobile !== isMobile) {
        currentPage = 1;
        initListings();
    }
}

// Add resize listener
window.addEventListener('resize', handleResize);

// Add loading indicator for infinite scroll
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'text-center py-3 loading-indicator';
loadingIndicator.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>';

// Update results info
function updateResultsInfo(paginationData) {
    if (!resultsInfo) return;

    const { total, currentPage, limit } = paginationData;
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    resultsInfo.innerHTML = `Showing results <strong>${start} to ${end}</strong> of total <strong>${total}</strong>`;
} 