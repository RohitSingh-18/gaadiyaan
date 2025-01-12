// Constants
const API_BASE_URL = 'http://localhost:3000/api';

// Global state
let specifications = [];
let features = {};
let currentImages = [];
const MAX_IMAGES = 10;

// Initialize form handlers
function initializeFormHandlers() {
    // Get form and submit button
    const form = document.getElementById('addListingForm');
    const submitBtn = document.getElementById('submitButton');
    
    if (form && submitBtn) {
        console.log('Form and submit button found');
        
        // Remove any existing event listeners
        form.removeEventListener('submit', handleFormSubmit);
        submitBtn.removeEventListener('click', handleButtonClick);
        
        // Add new event listeners
        form.addEventListener('submit', handleFormSubmit);
        submitBtn.addEventListener('click', handleButtonClick);
    } else {
        console.error('Form or submit button not found');
    }
}

// Form submit handler
function handleFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

// Button click handler
async function handleButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Submit button clicked');
    try {
        await handleSubmission();
    } catch (error) {
        console.error('Submission error:', error);
        showNotification(error.message || 'Error submitting form', false);
    }
    return false;
}

// Function to initialize event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Add specification button handler
    const addSpecBtn = document.getElementById('addSpec');
    if (addSpecBtn) {
        console.log('Spec button found');
        addSpecBtn.addEventListener('click', handleSpecification);
    } else {
        console.log('Spec button not found');
    }
    
    // Add feature button handler
    const addFeatureBtn = document.getElementById('addFeature');
    if (addFeatureBtn) {
        console.log('Feature button found');
        addFeatureBtn.addEventListener('click', handleFeature);
    } else {
        console.log('Feature button not found');
    }
    
    // Add image upload handlers
    console.log('Setting up image upload...');
    setupImageUpload();

    // Add input validation
    console.log('Setting up input validation...');
    addInputValidation();
    
    console.log('Event listeners initialized');
}

// Make initialization functions available globally
window.initializeFormHandlers = initializeFormHandlers;
window.initializeEventListeners = initializeEventListeners;

// Function to handle image upload
function handleImageUpload(files) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (!previewContainer) return;
    
    // Get current number of previews
    const currentPreviews = previewContainer.querySelectorAll('.image-preview').length;
    const remainingSlots = MAX_IMAGES - currentPreviews;
    
    // Convert FileList to Array and process only the allowed number of images
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
        showNotification(`Maximum ${MAX_IMAGES} images allowed. Only first ${remainingSlots} images will be added.`, false);
    }

    filesToProcess.forEach(file => {
        if (!file.type.startsWith('image/')) {
            showNotification('Please upload only image files', false);
            return;
        }

        // Check file size (limit to 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            showNotification(`File ${file.name} is too large. Maximum size is 5MB`, false);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview';
            
            // Create image element
            const img = new Image();
            img.src = e.target.result;
            img.alt = 'Preview';
            
            // Add loading state
            previewDiv.classList.add('loading');
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'loading-spinner';
            previewDiv.appendChild(loadingSpinner);
            
            // When image loads, remove loading state
            img.onload = function() {
                previewDiv.classList.remove('loading');
                loadingSpinner.remove();
                
                // Add the remove button
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-image';
                removeButton.innerHTML = '×';
                removeButton.addEventListener('click', function() {
                    previewDiv.classList.add('removing');
                    setTimeout(() => {
                        previewDiv.remove();
                        updateImageCount();
                    }, 300);
                });
                
                previewDiv.appendChild(img);
                previewDiv.appendChild(removeButton);
            };
            
            previewContainer.appendChild(previewDiv);
            updateImageCount();
        };
        reader.readAsDataURL(file);
    });
}

// Function to update image count
function updateImageCount() {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const imageCount = previewContainer.querySelectorAll('.image-preview').length;
    const uploadPlaceholder = document.querySelector('.upload-placeholder p');
    
    if (uploadPlaceholder) {
        if (imageCount === 0) {
            uploadPlaceholder.textContent = 'Drag & Drop images or click to upload';
            uploadPlaceholder.style.color = '#6c757d';
        } else if (imageCount === MAX_IMAGES) {
            uploadPlaceholder.textContent = 'Maximum number of images reached';
            uploadPlaceholder.style.color = '#dc3545';
        } else {
            uploadPlaceholder.textContent = `${imageCount}/${MAX_IMAGES} images uploaded`;
            uploadPlaceholder.style.color = '#6c757d';
        }
    }
}

// Handle form submission
async function handleSubmission() {
    console.log('Starting form submission');
    
    try {
        // Validate form data
        const formData = new FormData();
        const data = collectFormData();
        
        console.log('Collected form data:', data);
        
        if (!validateFormData(data)) {
            console.log('Form validation failed');
            return;
        }
        
        // Add form data
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        // Add images from the preview container
        const previewContainer = document.getElementById('imagePreviewContainer');
        if (previewContainer) {
            const previews = previewContainer.querySelectorAll('.image-preview img');
            console.log(`Found ${previews.length} images to upload`);
            
            const imagePromises = Array.from(previews).map((img, index) => {
                return new Promise((resolve, reject) => {
                    const base64 = img.src;
                    if (base64.startsWith('data:image')) {
                        fetch(base64)
                            .then(res => res.blob())
                            .then(blob => {
                                const file = new File([blob], `image-${index + 1}.jpg`, { type: 'image/jpeg' });
                                formData.append('vehicleImages', file);
                                resolve();
                            })
                            .catch(reject);
                    } else {
                        resolve();
                    }
                });
            });
            
            await Promise.all(imagePromises);
        }
        
        // Send data to server
        console.log('Preparing to send data to server...');
        console.log('API URL:', `${API_BASE_URL}/vehicles`);
        
        const response = await fetch(`${API_BASE_URL}/vehicles`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to create listing');
        }
        
        showNotification('Listing created successfully!');
        
        // Instead of reloading, redirect using the dashboard's loadPage function
        if (typeof loadPage === 'function') {
            console.log('Using dashboard loadPage function');
            setTimeout(() => {
                loadPage('listings');
                window.location.hash = 'listings';
            }, 2000);
        } else {
            console.log('Fallback to hash navigation');
            setTimeout(() => {
                window.location.hash = 'listings';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        showNotification(error.message || 'Error creating listing', false);
    }
}

// Collect form data
function collectFormData() {
    return {
        carTitle: document.getElementById('carTitle').value.trim(),
        price: document.getElementById('price').value,
        year: document.getElementById('year').value,
        make: document.getElementById('make').value.trim(),
        model: document.getElementById('model').value.trim(),
        registrationYear: document.getElementById('registrationYear').value,
        insurance: document.getElementById('insurance').value.trim(),
        fuelType: document.getElementById('fuelType').value,
        seats: document.getElementById('seats').value,
        kmsDriven: document.getElementById('kmsDriven').value,
        location: document.getElementById('rto').value.trim(),
        ownership: document.getElementById('ownership').value,
        engineDisplacement: document.getElementById('engineDisplacement').value,
        transmission: document.getElementById('transmission').value,
        specifications: JSON.stringify(specifications),
        features: JSON.stringify(features)
    };
}

// Validate form data
function validateFormData(data) {
    const requiredFields = [
        'carTitle', 'price', 'year', 'make', 'model',
        'registrationYear', 'insurance', 'fuelType',
        'seats', 'kmsDriven', 'location', 'ownership',
        'engineDisplacement', 'transmission'
    ];

    for (const field of requiredFields) {
        if (!data[field]) {
            showNotification(`${field.replace(/([A-Z])/g, ' $1').trim()} is required`, false);
            return false;
        }
    }

    return true;
}

// Helper function to show notifications
function showNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to handle specifications
function handleSpecification() {
    const specName = document.getElementById('specName');
    const specValue = document.getElementById('specValue');
    
    // Reset any previous validation styles
    specName.style.borderColor = '#ddd';
    specValue.style.borderColor = '#ddd';
    
    const nameValue = specName.value.trim();
    const valueValue = specValue.value.trim();
    
    if (!nameValue || !valueValue) {
        if (!nameValue) specName.style.borderColor = '#dc3545';
        if (!valueValue) specValue.style.borderColor = '#dc3545';
        return;
    }

    if (specifications.length >= 100) {
        return;
    }

    specifications.push({ name: nameValue, value: valueValue });
    updateSpecificationsList();
    
    // Clear inputs and reset styles
    specName.value = '';
    specValue.value = '';
    specName.style.borderColor = '#ddd';
    specValue.style.borderColor = '#ddd';
}

// Function to handle features
function handleFeature() {
    const categoryInput = document.getElementById('featureCategory');
    const nameInput = document.getElementById('featureName');
    
    // Reset any previous validation styles
    categoryInput.style.borderColor = '#ddd';
    nameInput.style.borderColor = '#ddd';
    
    const categoryValue = categoryInput.value.trim();
    const nameValue = nameInput.value.trim();
    
    if (!categoryValue || !nameValue) {
        if (!categoryValue) categoryInput.style.borderColor = '#dc3545';
        if (!nameValue) nameInput.style.borderColor = '#dc3545';
        return;
    }

    const totalFeatures = Object.values(features).reduce((acc, curr) => acc + curr.length, 0);
    if (totalFeatures >= 100) {
        return;
    }

    if (!features[categoryValue]) {
        features[categoryValue] = [];
    }
    
    // Check if this feature already exists in this category
    if (!features[categoryValue].includes(nameValue)) {
        features[categoryValue].push(nameValue);
        updateFeaturesList();
        
        // Clear inputs and reset styles
        categoryInput.value = '';
        nameInput.value = '';
        categoryInput.style.borderColor = '#ddd';
        nameInput.style.borderColor = '#ddd';
    }
}

// Function to update specifications list
function updateSpecificationsList() {
    const specList = document.getElementById('specificationsList');
    if (!specList) return;
    
    specList.innerHTML = specifications.map((spec, index) => `
        <div class="added-item" data-index="${index}">
            <div class="item-content">
                <span class="spec-name">${spec.name}</span>
                <span class="spec-value">${spec.value}</span>
            </div>
            <button type="button" class="delete-btn" onclick="removeSpecification(${index})" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    // Update counter
    const specCount = specifications.length;
    const specHeader = document.querySelector('.specifications-container h2');
    if (specHeader) {
        specHeader.textContent = `Specifications (${specCount}/100)`;
    }
}

// Function to update features list
function updateFeaturesList() {
    const featuresList = document.getElementById('featuresList');
    if (!featuresList) return;

    // Convert features object to flat array of {category, name} objects
    const flatFeatures = Object.entries(features).reduce((acc, [category, items]) => {
        return acc.concat(items.map(name => ({ category, name })));
    }, []);

    featuresList.innerHTML = flatFeatures.map((feature, index) => `
        <div class="added-item" data-category="${feature.category}" data-index="${index}">
            <div class="item-content">
                <span class="spec-name">${feature.category}</span>
                <span class="spec-value">${feature.name}</span>
            </div>
            <button type="button" class="delete-btn" onclick="removeFeature('${feature.category}', '${feature.name}')" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    // Update counter
    const totalFeatures = flatFeatures.length;
    const featureHeader = document.querySelector('.features-container h2');
    if (featureHeader) {
        featureHeader.textContent = `Features (${totalFeatures}/100)`;
    }
}

// Function to remove specification
function removeSpecification(index) {
    specifications.splice(index, 1);
    updateSpecificationsList();
}

// Function to remove feature
function removeFeature(category, featureName) {
    if (features[category]) {
        features[category] = features[category].filter(name => name !== featureName);
        if (features[category].length === 0) {
            delete features[category];
        }
        updateFeaturesList();
    }
}

// Add this to your existing styles (add to the style section in add-listing.html)
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .image-preview.loading {
        background: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .image-preview.removing {
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.3s ease;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

// Add input event listeners for validation
function addInputValidation() {
    const specName = document.getElementById('specName');
    const specValue = document.getElementById('specValue');
    const featureCategory = document.getElementById('featureCategory');
    const featureName = document.getElementById('featureName');

    const inputs = [specName, specValue, featureCategory, featureName];
    
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                this.style.borderColor = this.value.trim() ? '#ddd' : '#dc3545';
            });
            
            input.addEventListener('focus', function() {
                if (this.style.borderColor === 'rgb(220, 53, 69)') { // #dc3545
                    this.style.borderColor = '#ddd';
                }
            });
        }
    });
}

// Function to setup image upload
function setupImageUpload() {
    const imageInput = document.getElementById('imageInput');
    const uploadContainer = document.querySelector('.image-upload-container');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');

    if (!imageInput || !uploadContainer || !uploadPlaceholder) return;

    // Make the entire container clickable
    uploadContainer.addEventListener('click', function(e) {
        if (e.target !== imageInput) {
            imageInput.click();
        }
    });

    // Handle file selection
    imageInput.addEventListener('change', function(e) {
        handleImageUpload(e.target.files);
    });

    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, () => {
            uploadContainer.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, () => {
            uploadContainer.classList.remove('dragover');
        });
    });

    uploadContainer.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleImageUpload(files);
    });
}

// Make functions available globally
window.handleSubmission = handleSubmission;
window.handleSpecification = handleSpecification;
window.handleFeature = handleFeature;
window.removeSpecification = removeSpecification;
window.removeFeature = removeFeature;