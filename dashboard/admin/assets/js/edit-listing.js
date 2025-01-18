// Initialize variables
let currentFeatures = [];
let uploadedImages = [];
let originalData = {};

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load listing data
    loadListingData();
    
    // Initialize image upload
    initializeImageUpload();
    
    // Store original data after loading
    setTimeout(storeOriginalData, 500);
});

// Load listing data
function loadListingData() {
    // Get listing ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');
    
    // In a real application, you would fetch the listing data from your backend
    // For now, we'll use dummy data
    const listingData = {
        title: '2022 Honda City',
        price: 1250000,
        make: 'Honda',
        model: 'City',
        year: 2022,
        status: 'active',
        fuel: 'petrol',
        transmission: 'automatic',
        mileage: 15000,
        color: 'Silver',
        description: 'Well maintained Honda City with all service records.',
        features: ['Power Steering', 'Air Conditioning', 'Power Windows'],
        images: ['https://via.placeholder.com/300x200']
    };
    
    // Populate form fields
    populateFormFields(listingData);
}

// Populate form fields with listing data
function populateFormFields(data) {
    document.getElementById('title').value = data.title;
    document.getElementById('price').value = data.price;
    document.getElementById('make').value = data.make;
    document.getElementById('model').value = data.model;
    document.getElementById('year').value = data.year;
    document.getElementById('status').value = data.status;
    document.getElementById('fuel').value = data.fuel;
    document.getElementById('transmission').value = data.transmission;
    document.getElementById('mileage').value = data.mileage;
    document.getElementById('color').value = data.color;
    document.getElementById('description').value = data.description;
    
    // Load features
    currentFeatures = [...data.features];
    updateFeaturesDisplay();
    
    // Load images
    uploadedImages = [...data.images];
    updateImagePreview();
}

// Initialize image upload functionality
function initializeImageUpload() {
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.addEventListener('change', handleImageUpload);
}

// Handle image upload
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    if (uploadedImages.length + files.length > 5) {
        showNotification('Maximum 5 images allowed', 'error');
        return;
    }
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            uploadedImages.push(event.target.result);
            updateImagePreview();
        };
        reader.readAsDataURL(file);
    });
}

// Update image preview
function updateImagePreview() {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = uploadedImages.map((image, index) => `
        <div class="preview-image">
            <img src="${image}" alt="Vehicle Image ${index + 1}">
            <button type="button" class="remove-image" onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Remove image
function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImagePreview();
}

// Add feature
function addFeature() {
    const modal = document.getElementById('addFeatureModal');
    const input = document.getElementById('featureName');
    input.value = ''; // Clear previous input
    modal.classList.add('active');
    // Focus the input after modal animation
    setTimeout(() => input.focus(), 300);
}

// Remove feature
function removeFeature(index) {
    currentFeatures.splice(index, 1);
    updateFeaturesDisplay();
}

// Update features display
function updateFeaturesDisplay() {
    const container = document.getElementById('featuresContainer');
    container.innerHTML = currentFeatures.map((feature, index) => `
        <div class="feature-tag">
            ${feature}
            <button type="button" class="remove-feature" onclick="removeFeature(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Update listing
function updateListing() {
    // Get form data
    const form = document.getElementById('editListingForm');
    const formData = new FormData(form);
    const data = {
        title: formData.get('title'),
        price: formData.get('price'),
        make: formData.get('make'),
        model: formData.get('model'),
        year: formData.get('year'),
        status: formData.get('status'),
        fuel: formData.get('fuel'),
        transmission: formData.get('transmission'),
        mileage: formData.get('mileage'),
        color: formData.get('color'),
        description: formData.get('description'),
        features: currentFeatures,
        images: uploadedImages
    };
    
    // In a real application, you would send this data to your backend
    console.log('Updating listing with data:', data);
    
    // Show success message
    showNotification('Listing updated successfully', 'success');
    
    // Close the modal
    closeSaveModal();
    
    // Redirect back to listings page after a short delay
    setTimeout(goBack, 1500);
}

// Go back to listings page
function goBack() {
    window.history.back();
}

// Show notification
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

// Store original data when page loads
function storeOriginalData() {
    originalData = {
        title: document.getElementById('title').value,
        price: document.getElementById('price').value,
        make: document.getElementById('make').value,
        model: document.getElementById('model').value,
        year: document.getElementById('year').value,
        status: document.getElementById('status').value,
        fuel: document.getElementById('fuel').value,
        transmission: document.getElementById('transmission').value,
        mileage: document.getElementById('mileage').value,
        color: document.getElementById('color').value,
        description: document.getElementById('description').value,
        features: [...currentFeatures],
        images: [...uploadedImages]
    };
}

// Show save confirmation modal
function showSaveConfirmation(event) {
    event.preventDefault();
    const modal = document.getElementById('saveChangesModal');
    const changesList = document.getElementById('changesList');
    const changes = getChangedFields();
    
    // Update changes list in modal
    changesList.innerHTML = changes.map(change => `
        <li>
            <i class="fas fa-pen"></i>
            <span>${change}</span>
        </li>
    `).join('');
    
    // If no changes, show message
    if (changes.length === 0) {
        changesList.innerHTML = `
            <li>
                <i class="fas fa-info-circle"></i>
                <span>No changes detected</span>
            </li>
        `;
    }
    
    modal.classList.add('active');
}

// Close save modal
function closeSaveModal() {
    const modal = document.getElementById('saveChangesModal');
    modal.classList.remove('active');
}

// Confirm save changes
function confirmSaveChanges() {
    updateListing();
}

// Get changed fields
function getChangedFields() {
    const changes = [];
    const formData = new FormData(document.getElementById('editListingForm'));
    
    // Check each field for changes
    if (formData.get('title') !== originalData.title) 
        changes.push('Title updated');
    if (formData.get('price') !== originalData.price) 
        changes.push('Price updated');
    if (formData.get('make') !== originalData.make) 
        changes.push('Make updated');
    if (formData.get('model') !== originalData.model) 
        changes.push('Model updated');
    if (formData.get('year') !== originalData.year) 
        changes.push('Year updated');
    if (formData.get('status') !== originalData.status) 
        changes.push('Status updated');
    if (formData.get('fuel') !== originalData.fuel) 
        changes.push('Fuel type updated');
    if (formData.get('transmission') !== originalData.transmission) 
        changes.push('Transmission updated');
    if (formData.get('mileage') !== originalData.mileage) 
        changes.push('Mileage updated');
    if (formData.get('color') !== originalData.color) 
        changes.push('Color updated');
    if (formData.get('description') !== originalData.description) 
        changes.push('Description updated');
    
    // Check features changes
    if (JSON.stringify(currentFeatures) !== JSON.stringify(originalData.features)) 
        changes.push('Features updated');
    
    // Check images changes
    if (JSON.stringify(uploadedImages) !== JSON.stringify(originalData.images)) 
        changes.push('Images updated');
    
    return changes;
}

// Add Feature Modal Functions
function addFeature() {
    const modal = document.getElementById('addFeatureModal');
    const input = document.getElementById('featureName');
    input.value = ''; // Clear previous input
    modal.classList.add('active');
    // Focus the input after modal animation
    setTimeout(() => input.focus(), 300);
}

function closeFeatureModal() {
    const modal = document.getElementById('addFeatureModal');
    modal.classList.remove('active');
}

function selectFeature(feature) {
    document.getElementById('featureName').value = feature;
}

function saveFeature() {
    const featureName = document.getElementById('featureName').value.trim();
    
    if (!featureName) {
        showNotification('Please enter a feature name', 'error');
        return;
    }
    
    // Check for duplicates
    if (currentFeatures.includes(featureName)) {
        showNotification('This feature already exists', 'error');
        return;
    }
    
    // Add the feature
    currentFeatures.push(featureName);
    updateFeaturesDisplay();
    
    // Show success notification
    showNotification('Feature added successfully', 'success');
    
    // Close the modal
    closeFeatureModal();
}

// Add keyboard event listener for the feature input
document.getElementById('featureName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveFeature();
    }
});

// Close modal when clicking outside
document.getElementById('addFeatureModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeFeatureModal();
    }
}); 