function handleLogout() {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to homepage
    window.location.href = '/index.html';
} 