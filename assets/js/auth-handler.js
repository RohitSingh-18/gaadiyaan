// Auth state handler
function updateAuthUI() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    // Get all auth-related nav items
    const authNavItems = document.querySelectorAll('.auth-nav-item');
    
    authNavItems.forEach(item => {
        if (isLoggedIn) {
            item.innerHTML = '<a class="nav-link" href="javascript:void(0)" onclick="handleMyAccountClick()">My Account</a>';
        } else {
            item.innerHTML = '<a class="nav-link" href="/auth/signup.html">Sign Up</a>';
        }
    });
}

// Handle My Account navigation
function handleMyAccountClick() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn || !userProfile.userType) {
        window.location.href = '/auth/login.html';
        return;
    }

    // Route to appropriate dashboard
    if (userProfile.userType === 'admin') {
        window.location.href = '/dashboard/admin/pages/portal.html';
    } else if (userProfile.userType === 'dealer') {
        window.location.href = '/dashboard/dealer/pages/portal.html';
    } else if (userProfile.userType === 'buyer') {
        window.location.href = '/dashboard/client/user.html';
    } else {
        localStorage.clear();
        window.location.href = '/auth/login.html';
    }
}

// Initialize auth state when DOM loads
document.addEventListener('DOMContentLoaded', updateAuthUI); 