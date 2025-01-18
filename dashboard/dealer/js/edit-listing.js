// Constants
const API_BASE_URL = 'https://gaadiyaan-api.onrender.com/api';
const listingId = new URLSearchParams(window.location.search).get('id');

// State
let specifications = [];
let features = {};
let currentImages = [];
const MAX_IMAGES = 5;

// Helper Functions
function showNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price);
}

// API Calls
async function fetchListingData() {
    try {
        const response = await fetch(`${API_BASE_URL}/vehicles/${listingId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch listing');
        }

        populateForm(data.data);
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, false);
    }
}

async function updateListing(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/vehicles/${listingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update listing');
        }

        showNotification('Listing updated successfully');
        setTimeout(() => {
            window.location.href = 'listings.html';
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, false);
    }
}

// Form Population
function populateForm(data) {
    // Populate basic fields
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key);
        if (element && key !== 'images' && key !== 'specifications' && key !== 'features') {
            element.value = data[key];
        }
    });

    // Populate specifications
    if (data.specifications) {
        specifications = Array.isArray(data.specifications) 
            ? data.specifications 
            : JSON.parse(data.specifications);
        updateSpecificationsList();
    }

    // Populate features
    if (data.features) {
        features = typeof data.features === 'string' 
            ? JSON.parse(data.features) 
            : data.features;
        updateFeaturesList();
    }

    // Populate images
    if (data.images) {
        currentImages = Array.isArray(data.images) 
            ? data.images 
            : JSON.parse(data.images);
        displayExistingImages();
    }
}

// Image Handling
function displayExistingImages() {
    const existingImagesDiv = document.getElementById('existingImages');
    existingImagesDiv.innerHTML = '';
    
    if (currentImages.length > 0) {
        existingImagesDiv.classList.add('has-images');
        
        currentImages.forEach((imageUrl, index) => {
            const div = document.createElement('div');
            div.className = 'image-preview';
            div.innerHTML = `
                <img src="${imageUrl}" alt="Vehicle Image ${index + 1}">
                <button type="button" class="delete-image" onclick="deleteImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            existingImagesDiv.appendChild(div);
        });
    } else {
        existingImagesDiv.classList.remove('has-images');
    }

    // Show/hide upload placeholder based on image count
    document.querySelector('.upload-placeholder').style.display = 
        currentImages.length >= MAX_IMAGES ? 'none' : 'block';
}

async function handleImageUpload(event) {
    const files = event.target.files;
    const remainingSlots = MAX_IMAGES - currentImages.length;

    if (files.length > remainingSlots) {
        showNotification(`You can only upload ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}`, false);
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        try {
            // Here you would normally upload the image to your server/storage
            // For now, we'll use a local FileReader for preview
            const reader = new FileReader();
            reader.onload = function(e) {
                currentImages.push(e.target.result);
                displayExistingImages();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            showNotification('Failed to upload image', false);
        }
    }

    event.target.value = '';
}

function deleteImage(index) {
    currentImages.splice(index, 1);
    displayExistingImages();
}

// Specifications Handling
function updateSpecificationsList() {
    const list = document.getElementById('specificationsList');
    list.innerHTML = specifications.map((spec, index) => `
        <div class="added-item">
            <div class="item-content">
                <span class="spec-name">${spec.name}:</span>
                <span class="spec-value">${spec.value}</span>
            </div>
            <button class="delete-btn" onclick="deleteSpecification(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function addSpecification() {
    const specName = document.getElementById('specName').value.trim();
    const specValue = document.getElementById('specValue').value.trim();

    if (specName && specValue) {
        specifications.push({ name: specName, value: specValue });
        updateSpecificationsList();
        
        // Clear inputs
        document.getElementById('specName').value = '';
        document.getElementById('specValue').value = '';
    }
}

function deleteSpecification(index) {
    specifications.splice(index, 1);
    updateSpecificationsList();
}

// Features Handling
function updateFeaturesList() {
    const list = document.getElementById('featuresList');
    list.innerHTML = Object.entries(features).map(([category, items]) => 
        items.map(item => `
            <div class="added-item">
                <div class="item-content">
                    <span class="feature-category">${category}:</span>
                    <span class="feature-name">${item}</span>
                </div>
                <button class="delete-btn" onclick="deleteFeature('${category}', '${item}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('')
    ).join('');
}

function addFeature() {
    const category = document.getElementById('featureCategory').value.trim();
    const featureName = document.getElementById('featureName').value.trim();

    if (category && featureName) {
        if (!features[category]) {
            features[category] = [];
        }
        features[category].push(featureName);
        updateFeaturesList();
        
        // Clear inputs
        document.getElementById('featureCategory').value = '';
        document.getElementById('featureName').value = '';
    }
}

function deleteFeature(category, item) {
    features[category] = features[category].filter(f => f !== item);
    if (features[category].length === 0) {
        delete features[category];
    }
    updateFeaturesList();
}

// Form Validation
function validateForm(formData) {
    const requiredFields = [
        'carTitle', 'price', 'year', 'make', 'model',
        'registrationYear', 'insurance', 'fuelType',
        'seats', 'kmsDriven', 'location', 'ownership',
        'engineDisplacement', 'transmission'
    ];

    for (const field of requiredFields) {
        if (!formData[field]) {
            throw new Error(`${field.replace(/([A-Z])/g, ' $1').trim()} is required`);
        }
    }

    if (isNaN(formData.price) || formData.price <= 0) {
        throw new Error('Price must be a valid number greater than 0');
    }

    const currentYear = new Date().getFullYear();
    if (formData.year < 1900 || formData.year > currentYear) {
        throw new Error('Please enter a valid year');
    }

    return true;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!listingId) {
        showNotification('No listing ID provided', false);
        setTimeout(() => {
            window.location.href = 'listings.html';
        }, 1500);
        return;
    }

    // Fetch and populate form
    fetchListingData();

    // Add specification button
    document.getElementById('addSpec').addEventListener('click', addSpecification);

    // Add feature button
    document.getElementById('addFeature').addEventListener('click', addFeature);

    // Form submission
    document.querySelector('.edit-listing-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = {
                carTitle: document.getElementById('carTitle').value,
                price: parseFloat(document.getElementById('price').value),
                year: parseInt(document.getElementById('year').value),
                make: document.getElementById('make').value,
                model: document.getElementById('model').value,
                registrationYear: parseInt(document.getElementById('registrationYear').value),
                insurance: document.getElementById('insurance').value,
                fuelType: document.getElementById('fuelType').value,
                seats: parseInt(document.getElementById('seats').value),
                kmsDriven: parseInt(document.getElementById('kmsDriven').value),
                location: document.getElementById('rto').value,
                ownership: document.getElementById('ownership').value,
                engineDisplacement: parseInt(document.getElementById('engineDisplacement').value),
                transmission: document.getElementById('transmission').value,
                specifications: JSON.stringify(specifications),
                features: JSON.stringify(features),
                images: JSON.stringify(currentImages)
            };

            validateForm(formData);
            await updateListing(formData);

        } catch (error) {
            showNotification(error.message, false);
        }
    });

    // Image upload handling
    const dropZone = document.getElementById('dropZone');
    const imageUpload = document.getElementById('imageUpload');

    imageUpload.addEventListener('change', handleImageUpload);

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleImageUpload({ target: { files } });
    });
});

// Make functions available globally
window.deleteImage = deleteImage;
window.deleteSpecification = deleteSpecification;
window.deleteFeature = deleteFeature;
window.handleImageUpload = handleImageUpload; 