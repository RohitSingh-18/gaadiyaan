function showTutorialBox() {
    const tutorialBox = document.getElementById('tutorialBox');
    tutorialBox.style.opacity = '0';
    tutorialBox.style.display = 'block';
    
    // Fade in animation
    setTimeout(() => {
        tutorialBox.style.transition = 'opacity 0.5s';
        tutorialBox.style.opacity = '1';
    }, 100);
}

// Hide tutorial box function
function hideTutorialBox() {
    const tutorialBox = document.getElementById('tutorialBox');
    tutorialBox.style.opacity = '0';
    setTimeout(() => {
        tutorialBox.style.display = 'none';
    }, 500);
}

// Important: Hide the tutorial box initially and show after 5 seconds
document.addEventListener('DOMContentLoaded', () => {
    const tutorialBox = document.getElementById('tutorialBox');
    tutorialBox.style.display = 'none';  // Hide initially
    
    // Show after 5 seconds
    setTimeout(showTutorialBox, 5000);
});

// Mobile responsiveness
function checkMobile() {
    const tutorialImage = document.getElementById('tutorialImage');
    const playIcon = document.querySelector('#tutorialBox .fas');
    const tutorialBox = document.getElementById('tutorialBox');

    if (window.innerWidth <= 768) {
        tutorialImage.style.width = '250px';
        tutorialImage.style.height = '450px';
        playIcon.style.fontSize = '40px';
        tutorialBox.style.right = '10px';
    } else {
        tutorialImage.style.width = '200px';
        tutorialImage.style.height = '400px';
        playIcon.style.fontSize = '50px';
        tutorialBox.style.right = '20px';
    }
}

// Check video layout
function checkVideoLayout() {
    const isMobile = window.innerWidth <= 768;
    const desktopContainer = document.getElementById('desktopVideoContainer');
    const mobileContainer = document.getElementById('mobileVideoContainer');
    
    if (isMobile) {
        desktopContainer.style.display = 'none';
        mobileContainer.style.display = 'block';
    } else {
        desktopContainer.style.display = 'block';
        mobileContainer.style.display = 'none';
    }
}

// Apply mobile checks
document.addEventListener('DOMContentLoaded', checkMobile);
window.addEventListener('resize', checkMobile);
setTimeout(checkMobile, 100);

// Tutorial box click handler
document.getElementById('tutorialBox').addEventListener('click', () => {
    document.getElementById('tutorialModal').style.display = 'block';
    checkVideoLayout();
    if (window.innerWidth <= 768) {
        document.getElementById('mobileVideo').play();
    } else {
        document.getElementById('desktopVideo').play();
    }
});

// Close modal function
function closeModal() {
    document.getElementById('tutorialModal').style.display = 'none';
    document.getElementById('mobileVideo').pause();
    document.getElementById('desktopVideo').pause();
}

// Check layout on resize
window.addEventListener('resize', checkVideoLayout);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('tutorialModal')) {
        closeModal();
    }
});