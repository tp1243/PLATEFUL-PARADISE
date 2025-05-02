document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const currentDate = new Date();
    document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    
    // Set last reviewed dates (could be dynamic from CMS)
    document.getElementById('introReviewDate').textContent = currentDate.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(currentDate.getDate() - 14);
    document.getElementById('orderingReviewDate').textContent = twoWeeksAgo.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    document.getElementById('pricingReviewDate').textContent = oneMonthAgo.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    
    // Smooth scrolling for navigation
    document.querySelectorAll('.nav-item').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Update active nav item
                document.querySelectorAll('.nav-item').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
                
                // Scroll to section
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
                
                // Update URL hash
                history.pushState(null, null, targetId);
            }
        });
    });
    
    // Highlight current section in nav while scrolling
    const sections = document.querySelectorAll('.terms-section');
    const navItems = document.querySelectorAll('.nav-item');
    
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
    
    // Toggle search in sidebar
    const searchToggle = document.querySelector('.search-toggle');
    const sidebarSearch = document.querySelector('.sidebar-search');
    
    if (searchToggle && sidebarSearch) {
        searchToggle.addEventListener('click', function() {
            sidebarSearch.style.display = sidebarSearch.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    // Search functionality
    const termsSearch = document.getElementById('termsSearch');
    if (termsSearch) {
        termsSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const termsSections = document.querySelectorAll('.terms-section');
            
            termsSections.forEach(section => {
                const sectionContent = section.textContent.toLowerCase();
                if (sectionContent.includes(searchTerm)) {
                    section.style.display = 'block';
                    
                    // Highlight matching text
                    const regex = new RegExp(searchTerm, 'gi');
                    section.innerHTML = section.innerHTML.replace(
                        regex,
                        match => `<span class="highlight">${match}</span>`
                    );
                } else {
                    section.style.display = 'none';
                }
            });
        });
    }
    
    // Bookmark sections
    const bookmarkButtons = document.querySelectorAll('.bookmark-btn');
    bookmarkButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            this.innerHTML = this.classList.contains('active') ? 
                '<i class="fas fa-bookmark"></i>' : 
                '<i class="far fa-bookmark"></i>';
            
            const sectionId = this.getAttribute('data-section');
            const bookmarkedSections = JSON.parse(localStorage.getItem('bookmarkedSections') || '[]');
            
            if (this.classList.contains('active')) {
                if (!bookmarkedSections.includes(sectionId)) {
                    bookmarkedSections.push(sectionId);
                }
            } else {
                const index = bookmarkedSections.indexOf(sectionId);
                if (index > -1) {
                    bookmarkedSections.splice(index, 1);
                }
            }
            
            localStorage.setItem('bookmarkedSections', JSON.stringify(bookmarkedSections));
        });
    });
    
    // Check for bookmarked sections on load
    const bookmarkedSections = JSON.parse(localStorage.getItem('bookmarkedSections') || '[]');
    bookmarkedSections.forEach(sectionId => {
        const button = document.querySelector(`.bookmark-btn[data-section="${sectionId}"]`);
        if (button) {
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-bookmark"></i>';
        }
    });
    
    // Print functionality
    const printBtn = document.querySelector('.print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Download as PDF (simulated)
    const downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            // In a real implementation, this would generate or fetch a PDF
            alert('PDF download would start here. In a real implementation, this would connect to a PDF generation service.');
        });
    }
    
    // Terms acceptance
    const acceptTerms = document.getElementById('acceptTerms');
    const signature = document.getElementById('signature');
    const submitAcceptance = document.getElementById('submitAcceptance');
    const confirmationModal = document.getElementById('confirmationModal');
    const modalClose = document.querySelector('.modal-close');
    const modalConfirm = document.getElementById('modalConfirm');
    
    if (acceptTerms && submitAcceptance) {
        submitAcceptance.disabled = true;
        
        acceptTerms.addEventListener('change', function() {
            submitAcceptance.disabled = !this.checked || signature.value.trim() === '';
        });
        
        signature.addEventListener('input', function() {
            submitAcceptance.disabled = !acceptTerms.checked || this.value.trim() === '';
        });
        
        submitAcceptance.addEventListener('click', function() {
            if (acceptTerms.checked && signature.value.trim() !== '') {
                // Store acceptance in localStorage
                localStorage.setItem('termsAccepted', 'true');
                localStorage.setItem('termsSignature', signature.value.trim());
                localStorage.setItem('termsAcceptanceDate', new Date().toISOString());
                
                // Show confirmation modal
                confirmationModal.classList.add('active');
            }
        });
    }
    
    if (modalClose && modalConfirm) {
        modalClose.addEventListener('click', function() {
            confirmationModal.classList.remove('active');
        });
        
        modalConfirm.addEventListener('click', function() {
            confirmationModal.classList.remove('active');
        });
    }
    
    // Back to top button
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        
        backToTop.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Check if terms were previously accepted
    if (localStorage.getItem('termsAccepted') === 'true') {
        acceptTerms.checked = true;
        if (localStorage.getItem('termsSignature')) {
            signature.value = localStorage.getItem('termsSignature');
        }
        submitAcceptance.disabled = false;
    }
    
    // Mobile menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.style.display = 'none';
            });
        });
    }
    
    // Initialize tooltips
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
    
    function showTooltip(e) {
        const tooltipText = this.getAttribute('data-tooltip');
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);
        
        const rect = this.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        
        this.tooltip = tooltip;
    }
    
    function hideTooltip() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }
});