document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on mobile
    if (window.innerWidth <= 768) {
        initMobileMenu();
    }

    function initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);

        // Toggle menu
        mobileMenuBtn?.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Close menu when clicking overlay
        overlay.addEventListener('click', closeMobileMenu);

        // Close menu when clicking links
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    setTimeout(closeMobileMenu, 150);
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
        });

        function toggleMobileMenu() {
            sidebar.classList.toggle('mobile-active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('mobile-active') ? 'hidden' : '';
        }

        function closeMobileMenu() {
            sidebar.classList.remove('mobile-active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}); 