let currentListingToRemove = null;
let toastTimeout;

function showListingRemoveModal(button) {
    const card = button.closest('.listing-card');
    const modal = document.getElementById('listingRemoveModal');
    
    const title = card.querySelector('.listing-title h3').textContent;
    const price = card.querySelector('.listing-price').textContent;
    const image = card.querySelector('.listing-image img').src;
    
    document.getElementById('listingPreviewTitle').textContent = title;
    document.getElementById('listingPreviewPrice').textContent = price;
    document.getElementById('listingPreviewImage').src = image;
    
    currentListingToRemove = card;
    modal.classList.add('active');
}

function closeListingRemoveModal() {
    const modal = document.getElementById('listingRemoveModal');
    modal.classList.remove('active');
    currentListingToRemove = null;
}

function confirmListingRemoval() {
    if (!currentListingToRemove) return;
    
    currentListingToRemove.classList.add('removing');
    updateListingsCount();
    
    setTimeout(() => {
        currentListingToRemove.remove();
        showToast(
            'Listing Removed',
            'The listing has been successfully removed',
            'success'
        );
    }, 300);
    
    closeListingRemoveModal();
}

function confirmRemoveAllListings() {
    const modal = document.getElementById('removeAllListingsModal');
    modal.classList.add('active');
}

function closeRemoveAllListingsModal() {
    const modal = document.getElementById('removeAllListingsModal');
    modal.classList.remove('active');
}

function removeAllListings() {
    const listingsGrid = document.querySelector('.listings-grid');
    const cards = Array.from(listingsGrid.querySelectorAll('.listing-card'));
    
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('removing');
            updateListingsCount();
        }, index * 50);
    });
    
    setTimeout(() => {
        listingsGrid.innerHTML = '';
        updateListingsCount();
        showToast(
            'Listings Removed',
            'All listings have been successfully removed',
            'success'
        );
        closeRemoveAllListingsModal();
    }, (cards.length * 50) + 300);
}

function confirmRemoveDealer() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('active');
}

function removeListing() {
    closeModal();
    showToast(
        'Dealer Removed',
        'The dealer has been successfully removed from the system',
        'success'
    );
    setTimeout(() => {
        window.location.href = 'portal.html?page=dealers';
    }, 1500);
}

function showToast(title, message, type = 'success') {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    // Add toast to container
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove previous timeout if exists
    if (toastTimeout) clearTimeout(toastTimeout);

    // Remove toast after delay
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                modal.classList.remove('active');
            }
        });
    });
    updateListingsCount();
});

function editListing(button) {
    const listingId = button.getAttribute('data-listing-id');
    window.location.href = `edit-listing.html?id=${listingId}`;
}

function updateListingsCount() {
    const totalListings = document.querySelectorAll('.listing-card:not(.removing)').length;
    const countElement = document.querySelector('#listingsCount .count');
    if (countElement) {
        countElement.textContent = totalListings;
    }
} 