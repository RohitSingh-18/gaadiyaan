document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    loadPage(getCurrentPage());

    // Add click handlers to navigation items
    document.querySelectorAll('.sidebar-nav li[data-page]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            loadPage(page);
            updateActiveNav(this);
            window.location.hash = page;
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('hashchange', function() {
        loadPage(getCurrentPage());
    });

    // Handle mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
});

function getCurrentPage() {
    // Get page from URL hash or default to listings
    return window.location.hash.slice(1) || 'listings';
}

function updateActiveNav(clickedItem) {
    // Remove active class from all items
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.classList.remove('active');
    });
    // Add active class to clicked item
    clickedItem.classList.add('active');
}

function updatePageTitle(page) {
    const titles = {
        'listings': 'My Listings',
        'add-listing': 'Add New Listing',
        'profile': 'Profile Settings',
        'reviews': 'Reviews',
        'analytics': 'Analytics'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'My Listings';
}

async function loadPage(page) {
    const mainContent = document.getElementById('mainContent');
    
    try {
        // Show loading state
        mainContent.innerHTML = '<div class="loading">Loading...</div>';
        
        // Fetch the page content
        const response = await fetch(`../pages/components/${page}.html`);
        if (!response.ok) throw new Error('Page not found');
        
        const content = await response.text();
        mainContent.innerHTML = content;
        
        // Update page title and active nav
        updatePageTitle(page);
        const activeNav = document.querySelector(`.sidebar-nav li[data-page="${page}"]`);
        if (activeNav) updateActiveNav(activeNav);

        // Initialize form handlers and event listeners for add-listing page
        if (page === 'add-listing') {
            if (typeof initializeFormHandlers === 'function') {
                initializeFormHandlers();
            }
            if (typeof initializeEventListeners === 'function') {
                initializeEventListeners();
            }
        }
        
    } catch (error) {
        console.error('Error loading page:', error);
        mainContent.innerHTML = '<div class="error">Error loading page content</div>';
    }
}

function logout() {
    // Handle logout logic here
    window.location.href = '../../auth/login.html';
} 