document.addEventListener('DOMContentLoaded', function() {
    // Initialize FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
            
            // Track FAQ opens in analytics (simulated)
            if (item.classList.contains('active')) {
                const questionText = question.querySelector('h3').textContent;
                console.log(`FAQ opened: "${questionText}"`);
                // In a real implementation, you would send this to your analytics platform
            }
        });
    });
    
    // Category navigation
    const categoryLinks = document.querySelectorAll('.category-link');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active category
            categoryLinks.forEach(otherLink => {
                otherLink.classList.remove('active');
            });
            this.classList.add('active');
            
            // Scroll to section
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // FAQ search functionality
    const faqSearch = document.getElementById('faqSearch');
    
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                // Reset search
                document.querySelectorAll('.faq-section, .faq-item').forEach(el => {
                    el.style.display = '';
                });
                return;
            }
            
            let foundInSection = false;
            let activeSection = null;
            
            document.querySelectorAll('.faq-item').forEach(item => {
                const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
                
                if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.style.display = '';
                    foundInSection = true;
                    
                    // Highlight matching text
                    const regex = new RegExp(searchTerm, 'gi');
                    const questionEl = item.querySelector('.faq-question h3');
                    const answerEl = item.querySelector('.faq-answer');
                    
                    questionEl.innerHTML = questionEl.textContent.replace(
                        regex,
                        match => `<span class="highlight">${match}</span>`
                    );
                    
                    answerEl.innerHTML = answerEl.textContent.replace(
                        regex,
                        match => `<span class="highlight">${match}</span>`
                    );
                    
                    // Open the item
                    item.classList.add('active');
                    
                    // Track the section
                    activeSection = item.closest('.faq-section');
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Show/hide sections based on results
            document.querySelectorAll('.faq-section').forEach(section => {
                if (activeSection && section === activeSection) {
                    section.style.display = '';
                } else {
                    section.style.display = foundInSection ? 'none' : '';
                }
            });
        });
    }
    
    // Feedback buttons
    const feedbackYes = document.querySelector('.yes-btn');
    const feedbackNo = document.querySelector('.no-btn');
    
    if (feedbackYes && feedbackNo) {
        feedbackYes.addEventListener('click', function() {
            // In a real implementation, you would send this to your analytics or backend
            console.log('Positive feedback received');
            this.innerHTML = '<i class="fas fa-check"></i> Thank You!';
            this.style.backgroundColor = '#4CAF50';
            feedbackNo.style.display = 'none';
            
            // Reset after 3 seconds
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-thumbs-up"></i> Yes';
                this.style.backgroundColor = '';
                feedbackNo.style.display = '';
            }, 3000);
        });
        
        feedbackNo.addEventListener('click', function() {
            // Show contact modal for negative feedback
            document.getElementById('contactModal').classList.add('active');
        });
    }
    
    // Modal functionality
    const modal = document.getElementById('contactModal');
    const modalClose = document.querySelector('.modal-close');
    const supportForm = document.getElementById('supportForm');
    
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Form submission
    if (supportForm) {
        supportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('supportName').value;
            const email = document.getElementById('supportEmail').value;
            const question = document.getElementById('supportQuestion').value;
            const order = document.getElementById('supportOrder').value;
            
            // In a real implementation, you would send this to your backend
            console.log('Support request submitted:', {
                name,
                email,
                question,
                order
            });
            
            // Show success message
            alert('Thank you for your message! Our support team will get back to you within 24 hours.');
            
            // Reset form and close modal
            supportForm.reset();
            modal.classList.remove('active');
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
    
    // Track which FAQs are most viewed (simulated analytics)
    const observerOptions = {
        threshold: 0.5 // Trigger when 50% of element is visible
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const faqQuestion = entry.target.querySelector('.faq-question h3').textContent;
                console.log(`FAQ viewed: "${faqQuestion}"`);
                // In a real implementation, you would send this to your analytics platform
                
                // Unobserve after first view to avoid duplicate counts
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        observer.observe(item);
    });
});