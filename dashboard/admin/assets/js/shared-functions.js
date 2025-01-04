// Function to show toast notification
function showToast(message = 'Number copied to clipboard') {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.callback-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'callback-toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'callback-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    // Add toast to container
    container.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
        // Remove container if empty
        if (container.children.length === 0) {
            container.remove();
        }
    }, 2500);
}

// Function to copy number to clipboard
window.copyNumber = function(number, element) {
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = number;
    document.body.appendChild(tempInput);
    
    // Select the text
    tempInput.select();
    tempInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        // Try to copy using the modern API first
        navigator.clipboard.writeText(number)
            .then(() => {
                showCopySuccess(element);
                showToast('Number copied to clipboard');
            })
            .catch(() => {
                // Fallback to document.execCommand
                document.execCommand('copy');
                showCopySuccess(element);
                showToast('Number copied to clipboard');
            });
    } catch (err) {
        // Final fallback
        document.execCommand('copy');
        showCopySuccess(element);
        showToast('Number copied to clipboard');
    }
    
    // Remove the temporary input
    document.body.removeChild(tempInput);
}

// Function to show copy success feedback
function showCopySuccess(icon) {
    if (!icon) return;
    
    // Change icon to checkmark
    icon.classList.remove('fa-copy');
    icon.classList.add('fa-check');
    icon.style.color = '#4CAF50';
    
    // Reset icon after animation
    setTimeout(() => {
        icon.classList.remove('fa-check');
        icon.classList.add('fa-copy');
        icon.style.color = '';
    }, 1500);
}
