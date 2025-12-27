/* Performance Optimizations */
(function() {
    // Preload critical resources
    function preloadCriticalResources() {
        const criticalImages = [
            'https://github.com/notdeathm.png',
            'assets/icon.png'
        ];

        criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // Optimize animations for performance
    function optimizeAnimations() {
        // Use transform and opacity for better performance
        const style = document.createElement('style');
        style.textContent = `
            .fade-in {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: opacity, transform;
            }

            .fade-in.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .slide-in-left {
                opacity: 0;
                transform: translateX(-50px);
                transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: opacity, transform;
            }

            .slide-in-left.visible {
                opacity: 1;
                transform: translateX(0);
            }

            .slide-in-right {
                opacity: 0;
                transform: translateX(50px);
                transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: opacity, transform;
            }

            .slide-in-right.visible {
                opacity: 1;
                transform: translateX(0);
            }

            .scale-in {
                opacity: 0;
                transform: scale(0.9);
                transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: opacity, transform;
            }

            .scale-in.visible {
                opacity: 1;
                transform: scale(1);
            }

            /* Stagger animation delays for children */
            .stagger-children > * {
                transition-delay: calc(var(--stagger-delay, 0) * 100ms);
            }

            /* Remove will-change after animation completes */
            .fade-in.visible,
            .slide-in-left.visible,
            .slide-in-right.visible,
            .scale-in.visible {
                will-change: auto;
            }
        `;
        document.head.appendChild(style);
    }

    // Lazy load images
    function initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Initialize performance optimizations
    function init() {
        preloadCriticalResources();
        optimizeAnimations();
        initLazyLoading();
    }

    // Run optimizations when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
    
    // Smooth scroll behavior for anchor links
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    // Initialize scroll animations
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Unobserve after animation to improve performance
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Add animation classes to elements
        const animatedElements = [
            { selector: 'header', animation: 'fade-in' },
            { selector: '#about', animation: 'slide-in-left' },
            { selector: '#skills', animation: 'fade-in' },
            { selector: '#projects', animation: 'slide-in-right' },
            { selector: '#contact', animation: 'fade-in' },
            { selector: 'footer', animation: 'slide-in-left' }
        ];
        
        animatedElements.forEach(({ selector, animation }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add(animation);
                observer.observe(element);
            }
        });
        
        // Add staggered animations to skill cards and project cards
        const skillCards = document.querySelectorAll('.skill-card');
        skillCards.forEach((card, index) => {
            card.style.setProperty('--stagger-delay', index);
            card.classList.add('fade-in', 'stagger-children');
            observer.observe(card);
        });
        
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            card.style.setProperty('--stagger-delay', index);
            card.classList.add('scale-in', 'stagger-children');
            observer.observe(card);
        });
        
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach((item, index) => {
            item.style.setProperty('--stagger-delay', index);
            item.classList.add('slide-in-left', 'stagger-children');
            observer.observe(item);
        });
        
        // Add timeline animations
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.style.setProperty('--stagger-delay', index);
            observer.observe(item);
        });
    }
    
    // Add scroll-to-top button
    function addScrollToTopButton() {
        const scrollButton = document.createElement('button');
        scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollButton.className = 'scroll-to-top';
        scrollButton.setAttribute('aria-label', 'Scroll to top');
        
        // Add CSS for the scroll button
        const scrollButtonCSS = `
            .scroll-to-top {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: var(--color-dark-accent);
                color: var(--color-dark-text);
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                font-size: 1.2em;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
            }
            
            .scroll-to-top.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .scroll-to-top:hover {
                background: var(--color-dark-accent-hover);
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(229, 9, 20, 0.4);
            }
            
            body.light-mode .scroll-to-top {
                background: var(--color-light-accent);
                color: var(--color-light-card);
                box-shadow: 0 4px 12px rgba(204, 0, 0, 0.2);
            }
            
            body.light-mode .scroll-to-top:hover {
                background: var(--color-light-accent-hover);
                box-shadow: 0 6px 20px rgba(204, 0, 0, 0.3);
            }
        `;
        
        styleSheet.textContent += scrollButtonCSS;
        document.body.appendChild(scrollButton);
        
        // Show/hide scroll button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        });
        
        // Scroll to top functionality
        scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Initialize all animations and UX improvements
    function init() {
        initSmoothScroll();
        initScrollAnimations();
        addScrollToTopButton();
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// JavaScript for Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const icon = themeToggle.querySelector('i');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light-mode') {
    body.classList.add('light-mode');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        localStorage.setItem('theme', 'dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// Small toast helper (global function for both contact form and status reporting)
function showToast(message, timeout = 3000) {
    let t = document.getElementById('global-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'global-toast';
        t.style.position = 'fixed';
        t.style.right = '20px';
        t.style.bottom = '20px';
        t.style.background = '#111';
        t.style.color = '#fff';
        t.style.padding = '10px 14px';
        t.style.borderRadius = '8px';
        t.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
        document.body.appendChild(t);
    }
    t.textContent = message;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, timeout);
}

// JavaScript for Contact Form (using EmailJS)
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

console.log('Contact form found:', contactForm);
console.log('Form status element found:', formStatus);
console.log('Submit button found:', submitBtn);

// EmailJS Configuration
const EJ_PUBLIC_KEY = 'Lnl3z8jkAukMKlYF7';
const EJ_SERVICE_ID = 'service_nq7sylf';
const EJ_CONTACT_TEMPLATE_ID = 'template_fo816z3'; // Contact message to you

// Real-time validation function
function validateField(fieldName, value) {
    const errors = {};
    
    switch (fieldName) {
        case 'name':
            if (!value || value.trim().length === 0) {
                errors[fieldName] = 'Name is required';
            } else if (value.length > 50) {
                errors[fieldName] = 'Name must be less than 50 characters';
            }
            break;
        case 'email':
            if (!value || value.trim().length === 0) {
                errors[fieldName] = 'Email is required';
            } else if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value.trim())) {
                errors[fieldName] = 'Please enter a valid email address';
            }
            break;
        case 'title':
            if (!value || value.trim().length === 0) {
                errors[fieldName] = 'Subject is required';
            } else if (value.length > 100) {
                errors[fieldName] = 'Subject must be less than 100 characters';
            }
            break;
        case 'message':
            if (!value || value.trim().length === 0) {
                errors[fieldName] = 'Message is required';
            } else if (value.length > 1000) {
                errors[fieldName] = 'Message must be less than 1000 characters';
            }
            break;
    }
    
    return errors;
}

// Show/hide field error
function showFieldError(fieldName, message) {
    const errorElement = document.getElementById(fieldName + '-error');
    const inputElement = document.getElementById(fieldName);
    
    if (errorElement && inputElement) {
        if (message) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
            inputElement.style.borderColor = '#ff6b6b';
        } else {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
            inputElement.style.borderColor = '';
        }
    }
}

// Add real-time validation listeners
function addRealTimeValidation() {
    const fields = ['name', 'email', 'title', 'message'];
    
    fields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.addEventListener('blur', function() {
                const errors = validateField(fieldName, this.value);
                showFieldError(fieldName, errors[fieldName]);
            });
            
            field.addEventListener('input', function() {
                // Clear error as user types (if there was one)
                const errorElement = document.getElementById(fieldName + '-error');
                if (errorElement && errorElement.classList.contains('show')) {
                    const errors = validateField(fieldName, this.value);
                    if (!errors[fieldName]) {
                        showFieldError(fieldName, '');
                    }
                }
            });
        }
    });
}

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
    try {
        emailjs.init(EJ_PUBLIC_KEY);
        console.log('EmailJS initialized successfully');
    } catch (e) {
        console.warn('emailjs.init failed', e);
    }
}

// Contact form event handler
if (contactForm && submitBtn) {
    // Initialize real-time validation
    addRealTimeValidation();
    
    submitBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        
        // Check if EmailJS is available
        if (typeof emailjs === 'undefined') {
            formStatus.textContent = 'Email service not available. Please refresh the page.';
            formStatus.className = 'form-status error';
            return;
        }
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const title = formData.get('title');
        const message = formData.get('message');
        
        // Validate all fields
        const allErrors = {};
        ['name', 'email', 'title', 'message'].forEach(field => {
            const fieldErrors = validateField(field, formData.get(field));
            Object.assign(allErrors, fieldErrors);
        });
        
        // Show any validation errors
        let hasErrors = false;
        Object.keys(allErrors).forEach(fieldName => {
            showFieldError(fieldName, allErrors[fieldName]);
            hasErrors = true;
        });
        
        if (hasErrors) {
            formStatus.textContent = 'Please fix the errors above and try again.';
            formStatus.className = 'form-status error';
            return;
        }
        
        // Update button to show loading state
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline';
        
        formStatus.textContent = 'Sending your message...';
        formStatus.className = 'form-status';
        
        try {
            // Prepare email parameters
            const contactParams = {
                to_email: 'notdeath@duck.com',
                from_name: name,
                from_email: email,
                subject: title,
                message: message
            };

            // Send contact message
            const contactResponse = await emailjs.send(EJ_SERVICE_ID, EJ_CONTACT_TEMPLATE_ID, contactParams);
            console.log('Contact email sent successfully!', contactResponse);
            
            formStatus.textContent = 'Message sent successfully! I\'ll get back to you soon.';
            formStatus.className = 'form-status success';
            contactForm.reset();
            
            // Clear all field errors
            ['name', 'email', 'title', 'message'].forEach(fieldName => {
                showFieldError(fieldName, '');
            });
            
            showToast('Message sent successfully!', 4000);
            
        } catch (error) {
            console.error('EmailJS failed:', error);
            
            // Handle specific EmailJS errors
            let errorMessage = 'Failed to send message. Please try again.';
            
            if (error.status === 422) {
                errorMessage = 'Email configuration issue. Please contact support.';
            } else if (error.status === 429) {
                errorMessage = 'Too many requests. Please wait a moment before trying again.';
            } else if (error.text && error.text.includes('service')) {
                errorMessage = 'Email service error. Please contact support.';
            } else {
                errorMessage = `Error: ${error.message || 'Unknown error occurred'}`;
            }
            
            formStatus.textContent = errorMessage;
            formStatus.className = 'form-status error';
            showToast('Failed to send message. Please try again.');
            
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    });
}

/* Project Filtering */
(function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (filterButtons.length === 0 || projectCards.length === 0) return;

    function filterProjects(filter) {
        projectCards.forEach(card => {
            const categories = card.getAttribute('data-category');
            if (filter === 'all' || categories.includes(filter)) {
                card.classList.remove('hidden');
                card.style.animation = 'fadeIn 0.5s ease';
            } else {
                card.classList.add('hidden');
            }
        });
    }

    // Add click handlers to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get filter value and apply it
            const filter = button.getAttribute('data-filter');
            filterProjects(filter);
        });
    });

    // Add fade in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
})();

/* Skills Progress Bar Animation */
(function() {
    const skillCards = document.querySelectorAll('.skill-card');
    
    if (skillCards.length === 0) return;

    // Function to animate progress bars
    function animateProgressBars() {
        skillCards.forEach(card => {
            const progressBar = card.querySelector('.progress-bar');
            const level = progressBar.getAttribute('data-level');
            
            if (progressBar && level) {
                // Set CSS custom property for animation
                progressBar.style.setProperty('--progress-width', level + '%');
                // Add animate class to trigger animation
                card.classList.add('animate');
            }
        });
    }

    // Intersection Observer for triggering animation when skills section is visible
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add a small delay for better visual effect
                setTimeout(() => {
                    animateProgressBars();
                }, 200);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe the skills section
    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
        observer.observe(skillsSection);
    } else {
        // Fallback: if section not found, animate immediately
        setTimeout(animateProgressBars, 1000);
    }
})();



