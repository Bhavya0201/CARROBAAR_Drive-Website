document.addEventListener('DOMContentLoaded', () => {
    // 1. Create and inject the Floating Quick Nav Trigger and Drawer Overlay
    const quickNavHTML = `
        <!-- Floating Quick Navigation Trigger (Always accessible three-dash menu) -->
        <button class="quick-nav-trigger" id="quick-nav-trigger" aria-label="Open Navigation Menu">
            <span class="three-dash-line"></span>
            <span class="three-dash-line"></span>
            <span class="three-dash-line"></span>
        </button>

        <!-- Sleek Glassmorphism Quick Navigation Drawer -->
        <div class="quick-nav-overlay" id="quick-nav-overlay">
            <div class="quick-nav-drawer">
                <button class="quick-nav-close" id="quick-nav-close" aria-label="Close Menu">
                    <i data-lucide="x"></i>
                </button>
                <div class="quick-nav-header">
                    <a href="../index.html" class="logo">
                        <span class="logo-text-purple">CARROBAAR</span><span class="logo-text-orange">_Drive</span>
                    </a>
                    <p class="quick-nav-subtitle">Quick Navigator</p>
                </div>
                <nav class="quick-nav-links">
                    <a href="../index.html#hero" class="quick-nav-item"><i data-lucide="home"></i> Home</a>
                    <a href="../index.html#showroom-reality" class="quick-nav-item"><i data-lucide="alert-triangle"></i> Showroom Reality</a>
                    <a href="../sample-pdi-report.html" class="quick-nav-item"><i data-lucide="file-text"></i> Sample PDI Report</a>
                    <a href="../index.html#estimator" class="quick-nav-item"><i data-lucide="calculator"></i> Pricing Calculator</a>
                    <a href="../index.html#process" class="quick-nav-item"><i data-lucide="check-square"></i> Our Process</a>
                    <a href="../index.html#founder" class="quick-nav-item"><i data-lucide="user"></i> About Me</a>
                    <a href="index.html" class="quick-nav-item"><i data-lucide="book-open"></i> Blog Library</a>
                    <a href="../index.html#faq" class="quick-nav-item"><i data-lucide="help-circle"></i> FAQs</a>
                    <a href="../index.html#contact" class="quick-nav-item btn-quick-nav-cta"><i data-lucide="calendar"></i> Book Inspection</a>
                </nav>
                <div class="quick-nav-footer">
                    <a href="index.html" class="btn btn-secondary btn-sm btn-back-library"><i data-lucide="arrow-left"></i> Back to Blog Hub</a>
                </div>
            </div>
        </div>
    `;

    // Append to body
    const div = document.createElement('div');
    div.innerHTML = quickNavHTML;
    document.body.appendChild(div.firstElementChild); // trigger
    document.body.appendChild(div.lastElementChild); // overlay

    // Re-initialize Lucide icons to render the new icons in the injected HTML
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 2. Bind event listeners for the Quick Nav
    const trigger = document.getElementById('quick-nav-trigger');
    const overlay = document.getElementById('quick-nav-overlay');
    const closeBtn = document.getElementById('quick-nav-close');

    if (trigger && overlay && closeBtn) {
        // Toggle active classes
        trigger.addEventListener('click', () => {
            overlay.classList.add('active');
        });

        const closeOverlay = () => {
            overlay.classList.remove('active');
        };

        closeBtn.addEventListener('click', closeOverlay);

        // Close when clicking overlay (outside the drawer)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeOverlay();
            }
        });

        // Close drawer when any quick-nav-item link is clicked
        const items = document.querySelectorAll('.quick-nav-item, .btn-back-library');
        items.forEach(item => {
            item.addEventListener('click', closeOverlay);
        });
    }
});
