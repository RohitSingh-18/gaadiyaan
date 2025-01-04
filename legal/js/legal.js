// Initial setup - show user content by default
document.addEventListener('DOMContentLoaded', () => {
    showContent('user');
});

function showContent(type) {
    // Hide all content first
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected content
    document.getElementById(type).classList.add('active');

    // Add active class to clicked button
    const activeButton = document.querySelector(`[onclick="showContent('${type}')"]`);
    activeButton.classList.add('active');

    // Optional: Update URL without page reload
    history.pushState(null, '', `#${type}`);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '') || 'user';
    showContent(hash);
});

// Check URL hash on page load
window.addEventListener('load', () => {
    const hash = window.location.hash.replace('#', '') || 'user';
    showContent(hash);
}); 