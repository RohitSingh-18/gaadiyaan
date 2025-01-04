;(function() {
    // Single observer instance
    let observer = null;
    let debounceTimer = null;
    let isProcessing = false;

    // Debounce function
    function debounce(func, wait) {
        return function executedFunction(...args) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
                func.apply(this, args);
                debounceTimer = null;
            }, wait);
        };
    }

    // Initialize settings functionality
    function initializeSettings() {
        // Prevent concurrent processing
        if (isProcessing) return;
        isProcessing = true;

        try {
            // Get DOM elements with null checks
            const settingsNav = document.querySelector('.settings-nav');
            if (!settingsNav) {
                isProcessing = false;
                return;
            }

            // Clean up existing event listeners
            if (settingsNav.cleanup) {
                settingsNav.cleanup();
            }

            const dropdownTrigger = settingsNav.querySelector('.active-tab-button');
            if (!dropdownTrigger) {
                isProcessing = false;
                return;
            }

            const tabs = settingsNav.querySelectorAll('.settings-tab');
            if (!tabs.length) {
                isProcessing = false;
                return;
            }

            const sections = document.querySelectorAll('.settings-section');
            
            // Get dropdown elements
            const activeTabText = dropdownTrigger.querySelector('span');
            const activeTabIcon = dropdownTrigger.querySelector('i:not(.dropdown-arrow)');

            // Initialize dropdown with active tab content
            function updateDropdownContent(activeTab) {
                if (!activeTab || !activeTabText || !activeTabIcon) return;

                const icon = activeTab.querySelector('i');
                const text = activeTab.textContent.trim();
                
                if (icon) {
                    activeTabIcon.className = icon.className;
                }
                activeTabText.textContent = text;
            }

            // Initialize with current active tab
            const initialActiveTab = settingsNav.querySelector('.settings-tab.active');
            if (initialActiveTab) {
                updateDropdownContent(initialActiveTab);
            }

            // Toggle dropdown on mobile
            function handleDropdownClick(e) {
                e.preventDefault();
                e.stopPropagation();
                settingsNav.classList.toggle('open');
            }
            dropdownTrigger.addEventListener('click', handleDropdownClick);

            // Close dropdown when clicking outside
            function handleOutsideClick(e) {
                if (!settingsNav.contains(e.target)) {
                    settingsNav.classList.remove('open');
                }
            }
            document.addEventListener('click', handleOutsideClick);

            // Handle tab clicks
            function handleTabClick(e) {
                e.preventDefault();
                
                // Remove active class from all tabs and sections
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                // Add active class to clicked tab
                this.classList.add('active');

                // Update dropdown content
                updateDropdownContent(this);

                // Show corresponding section
                const targetId = this.dataset.tab;
                if (targetId) {
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        targetSection.classList.add('active');
                    }
                }

                // Close dropdown on mobile
                settingsNav.classList.remove('open');
            }

            tabs.forEach(tab => {
                tab.addEventListener('click', handleTabClick);
            });

            // Handle escape key to close dropdown
            function handleEscKey(e) {
                if (e.key === 'Escape') {
                    settingsNav.classList.remove('open');
                }
            }
            document.addEventListener('keydown', handleEscKey);

            // Store cleanup function
            settingsNav.cleanup = function() {
                dropdownTrigger.removeEventListener('click', handleDropdownClick);
                document.removeEventListener('click', handleOutsideClick);
                document.removeEventListener('keydown', handleEscKey);
                tabs.forEach(tab => {
                    tab.removeEventListener('click', handleTabClick);
                });
            };

        } catch (error) {
            console.error('Error initializing settings:', error);
        } finally {
            isProcessing = false;
        }
    }

    // Debounced initialization
    const debouncedInit = debounce(initializeSettings, 250);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', debouncedInit);
    } else {
        debouncedInit();
    }

    // Clean up existing observer
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    // Create new observer with debounced callback
    observer = new MutationObserver((mutations) => {
        // Only process if we see relevant changes
        const hasRelevantChanges = mutations.some(mutation => {
            return Array.from(mutation.addedNodes).some(node => {
                return node.classList && (
                    node.classList.contains('settings-nav') ||
                    node.querySelector('.settings-nav')
                );
            });
        });

        if (hasRelevantChanges) {
            debouncedInit();
        }
    });

    // Start observing
    const targetNode = document.querySelector('.main-content') || document.body;
    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });
})(); 