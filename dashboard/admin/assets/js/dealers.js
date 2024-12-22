// Global variables
let currentDealerToRemove = null;

// Function to view dealer listings
function viewDealerListings(dealerId) {
    try {
        // Find the dealer row
        const dealerRow = document.querySelector(`tr[data-dealer-id="${dealerId}"]`);
        if (!dealerRow) {
            console.error(`Dealer row not found for ID: ${dealerId}`);
            return;
        }

        // Get dealer info
        const dealerName = dealerRow.querySelector('.dealer-info h4')?.textContent || 'Unknown Dealer';
        const dealerLocation = dealerRow.querySelector('[data-label="Location"]')?.textContent || 'Location not available';

        // Store dealer info in session storage for the listings page
        sessionStorage.setItem('selectedDealer', JSON.stringify({
            id: dealerId,
            name: dealerName,
            location: dealerLocation
        }));

        // Redirect to dealer listings page
        window.location.href = 'dealer-listings.html';
    } catch (error) {
        console.error('Error in viewDealerListings:', error);
        alert('Unable to view dealer listings at this time. Please try again later.');
    }
}

// Function to show dealer remove modal
function showDealerRemoveModal(button) {
    try {
        const dealerRow = button.closest('tr');
        if (!dealerRow) {
            console.error('Dealer row not found');
            return;
        }

        const modal = document.getElementById('dealerRemoveModal');
        if (!modal) {
            console.error('Remove modal not found');
            return;
        }

        // Get dealer info
        const dealerInfo = dealerRow.querySelector('.dealer-info');
        const dealerImage = dealerInfo.querySelector('img')?.src || '';
        const dealerName = dealerInfo.querySelector('h4')?.textContent || 'Unknown Dealer';
        const dealerLocation = dealerRow.querySelector('[data-label="Location"]')?.textContent || '';

        // Update modal with dealer info
        const previewImage = modal.querySelector('#dealerPreviewImage');
        const previewName = modal.querySelector('#dealerPreviewName');
        const previewLocation = modal.querySelector('#dealerPreviewLocation');

        if (previewImage) previewImage.src = dealerImage;
        if (previewName) previewName.textContent = dealerName;
        if (previewLocation) previewLocation.textContent = dealerLocation;

        // Store dealer ID for removal
        modal.dataset.dealerId = dealerRow.dataset.dealerId;

        // Show modal
        modal.classList.add('active');
    } catch (error) {
        console.error('Error in showDealerRemoveModal:', error);
        alert('Unable to show removal dialog. Please try again.');
    }
}

// Function to close dealer remove modal
function closeDealerRemoveModal() {
    const modal = document.getElementById('dealerRemoveModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Function to confirm dealer removal
function confirmDealerRemoval() {
    try {
        const modal = document.getElementById('dealerRemoveModal');
        const dealerId = modal?.dataset.dealerId;
        
        if (!dealerId) {
            console.error('Dealer ID not found');
            return;
        }

        const dealerRow = document.querySelector(`tr[data-dealer-id="${dealerId}"]`);
        if (!dealerRow) {
            console.error('Dealer row not found');
            return;
        }

        // Get dealer name for the notification
        const dealerName = dealerRow.querySelector('.dealer-info h4')?.textContent || 'Dealer';

        // Add removing class for animation
        dealerRow.classList.add('removing');

        // Remove the row after animation
        setTimeout(() => {
            dealerRow.remove();
            closeDealerRemoveModal();
            
            // Update total dealers count if exists
            const totalDealersElement = document.querySelector('.stat-value');
            if (totalDealersElement) {
                const currentTotal = parseInt(totalDealersElement.textContent) || 0;
                if (currentTotal > 0) {
                    totalDealersElement.textContent = (currentTotal - 1).toString();
                }
            }

            // Show success toast notification
            showToast(
                'Dealer Removed',
                `${dealerName} has been successfully removed from the platform.`,
                'success'
            );
        }, 300);

    } catch (error) {
        console.error('Error in confirmDealerRemoval:', error);
        showToast(
            'Error',
            'Unable to remove dealer. Please try again.',
            'error'
        );
    }
}

// Function to show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add this function to show toast notifications
function showToast(title, message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    // Add toast to document
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                modal.classList.remove('active');
            }
        });
    });

    // Initialize search and filter functionality
    const searchInput = document.getElementById('dealerSearch');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const dealerRows = document.querySelectorAll('.dealers-table tbody tr');
            
            dealerRows.forEach(row => {
                const dealerName = row.querySelector('.dealer-info h4')?.textContent.toLowerCase() || '';
                const dealerLocation = row.querySelector('[data-label="Location"]')?.textContent.toLowerCase() || '';
                
                if (dealerName.includes(searchTerm) || dealerLocation.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', function(e) {
            const selectedStatus = e.target.value.toLowerCase();
            const dealerRows = document.querySelectorAll('.dealers-table tbody tr');
            
            dealerRows.forEach(row => {
                const status = row.querySelector('.status-badge')?.textContent.toLowerCase() || '';
                
                if (selectedStatus === 'all' || status === selectedStatus) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 