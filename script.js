// RxScan Main JavaScript - Consolidated for all pages

console.log('RxScan script loaded successfully');
console.log('script is connected');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    try {
        initializeNavigation();
        console.log('Navigation initialized');
        
        initializeVerification();
        console.log('Verification initialized');
        
        initializeAnimations();
        console.log('Animations initialized');
        
        initializeResults();
        console.log('Results initialized');
        
        // Track page load
        trackEvent('page_view', {
            page: getCurrentPage(),
            timestamp: new Date().toISOString()
        });
        
        console.log('App initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Navigation Functions
function initializeNavigation() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileNav = document.getElementById('mobileNav');
    
    console.log('Mobile toggle found:', !!mobileToggle);
    console.log('Mobile nav found:', !!mobileNav);
    
    if (mobileToggle && mobileNav) {
        const hamburger = mobileToggle.querySelector('.hamburger');
        const closeIcon = mobileToggle.querySelector('.close');

        mobileToggle.addEventListener('click', function() {
            console.log('Mobile toggle clicked');
            const isHidden = mobileNav.classList.contains('hidden');
            
            if (isHidden) {
                mobileNav.classList.remove('hidden');
                hamburger?.classList.add('hidden');
                closeIcon?.classList.remove('hidden');
                console.log('Mobile nav opened');
            } else {
                mobileNav.classList.add('hidden');
                hamburger?.classList.remove('hidden');
                closeIcon?.classList.add('hidden');
                console.log('Mobile nav closed');
            }
        });

        // Close mobile nav when clicking on links
        const mobileNavLinks = mobileNav.querySelectorAll('.nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.add('hidden');
                hamburger?.classList.remove('hidden');
                closeIcon?.classList.add('hidden');
                console.log('Mobile nav closed via link click');
            });
        });
    }
}

// Verification Functions
function initializeVerification() {
    const verifyBtn = document.getElementById('verifyBtn');
    const nafdacInput = document.getElementById('nafdacInput');
    const getStartedBtn = document.getElementById('getStartedBtn');

    console.log('Verify button found:', !!verifyBtn);
    console.log('Input field found:', !!nafdacInput);
    console.log('Get started button found:', !!getStartedBtn);

    if (verifyBtn && nafdacInput) {
        verifyBtn.addEventListener('click', function() {
            console.log('Verify button clicked');
            handleVerification();
        });

        // Handle Enter key in input field
        nafdacInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Enter key pressed in input');
                handleVerification();
            }
        });
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            console.log('Get started button clicked');
            const howItWorksSection = document.getElementById('how-it-works');
            if (howItWorksSection) {
                howItWorksSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
            trackEvent('get_started_clicked');
        });
    }
}

function handleVerification() {
  const nafdacInput = document.getElementById('nafdacInput');
  const verifyBtn = document.getElementById('verifyBtn');

  if (!nafdacInput || !verifyBtn) {
    console.error('Required elements not found for verification');
    return;
  }

  const nafdacNumber = String(nafdacInput.value || '').trim();
  console.log('handleVerification() called. Input value ->', nafdacNumber);

  if (!nafdacNumber) {
    showNotification('Please enter a NAFDAC number', 'warning');
    nafdacInput.focus();
    return;
  }

  // show loading
  const originalContent = verifyBtn.innerHTML;
  verifyBtn.innerHTML = `<span style="opacity:.9">Verifying...</span>`;
  verifyBtn.disabled = true;

  fetch('data/drugs.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load JSON: ' + res.status);
      return res.json();
    })
    .then(drugs => {
      console.log('Loaded drugs:', Array.isArray(drugs) ? drugs.length : 'not array');
      console.log('First few entries:', Array.isArray(drugs) ? drugs.slice(0, 5) : drugs);
      console.log('Searching for:', nafdacNumber);

      const drug = (Array.isArray(drugs) ? drugs : []).find(d =>
        String(d.nafdacNumber || '').trim().toLowerCase() === nafdacNumber.toLowerCase().trim()
      );
      console.log('Matched drug:', drug);

      let result = 'not-found';
      if (drug && drug.status) {
        const s = String(drug.status).trim().toLowerCase();
        if (s === 'active' || s === 'genuine') result = 'genuine';
        else if (s === 'expired') result = 'expired';
      }

      console.log('Verification result:', result);

      localStorage.setItem('verificationResult', JSON.stringify({
        nafdacNumber,
        result,
        timestamp: new Date().toISOString(),
        drug: drug || null
      }));

      window.location.href = 'results.html';
    })
    .catch(err => {
      console.error('Verification error:', err);
      showNotification('Error verifying drug. See console for details.', 'danger');
    })
    .finally(() => {
      verifyBtn.innerHTML = originalContent;
      verifyBtn.disabled = false;
    });
}


// Results Page Functions
function initializeResults() {
    if (getCurrentPage() === 'results') {
        console.log('Loading results page...');
        loadVerificationResults();
    }
}

function loadVerificationResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const storedResult = localStorage.getItem('verificationResult');

    console.log('Results container found:', !!resultsContainer);
    console.log('Stored result found:', !!storedResult);

    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }

    if (!storedResult) {
        console.log('No results found, redirecting to home');
        window.location.href = 'index.html';
        return;
    }

    try {
        const result = JSON.parse(storedResult);
        console.log('Displaying results:', result);
        displayResults(result);
        
        // Clear the stored result after displaying
        localStorage.removeItem('verificationResult');
        
        // Track result display
        trackEvent('verification_result_displayed', {
            nafdac_number: result.nafdacNumber,
            result: result.result,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Error parsing verification results:', error);
        displayError();
    }
}

function displayResults(result) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    const { nafdacNumber, result: verificationResult, timestamp } = result;

    let resultClass = '';
    let icon = '';
    let title = '';
    let description = '';
    let details = '';

    switch (verificationResult) {
        case 'genuine':
            resultClass = 'genuine';
            icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <path d="m9 11 3 3L22 4"/>
                    </svg>`;
            title = '✅ Drug is Genuine';
            description = 'NAFDAC number ${nafdacNumber} is registered and safe to use';
            details = generateGenuineDetails(nafdacNumber, timestamp);
            break;

        case 'not-found':
            resultClass = 'not-found';
            icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="m15 9-6 6"/>
                      <path d="m9 9 6 6"/>
                    </svg>`;
            title = '❌ Drug Not Found';
            description = 'NAFDAC number ${nafdacNumber} was not found in the official database';
            details = generateNotFoundDetails();
            break;

        case 'expired':
            resultClass = 'expired';
            icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                      <path d="M12 9v4"/>
                      <path d="M12 17h.01"/>
                    </svg>`;
            title = '⚠ Registration Expired';
            description = 'NAFDAC number ${nafdacNumber} registration has expired';
            details = generateExpiredDetails();
            break;

        default:
            displayError();
            return;
    }

    resultsContainer.innerHTML = `
        <div class="result-card-large ${resultClass}">
            <div class="result-content-large">
                <div class="result-icon-large">
                    ${icon}
                </div>
                <h2 class="result-title-large">${title}</h2>
                <p class="result-description-large">${description}</p>
                ${details}
            </div>
        </div>
    `;
}

function generateGenuineDetails(nafdacNumber, timestamp) {
    return `
        <div class="result-details">
            <h4>Drug Information:</h4>
            <ul>
                <li><strong>NAFDAC Number:</strong> ${nafdacNumber}</li>
                <li><strong>Status:</strong> Active and Valid</li>
                <li><strong>Manufacturer:</strong> Verified Pharmaceutical Company</li>
                <li><strong>Registration Date:</strong> Valid</li>
                <li><strong>Verification Time:</strong> ${new Date(timestamp).toLocaleString()}</li>
            </ul>
            <div class="safety-note genuine">
                <p><strong>✅ This drug is safe to use</strong> - It has been verified against NAFDAC's official database.</p>
            </div>
        </div>
    `;
}

function generateNotFoundDetails() {
    return `
        <div class="result-details">
            <h4>What this means:</h4>
            <ul>
                <li>The NAFDAC number doesn't match any registered drug</li>
                <li>This could indicate a fake or counterfeit product</li>
                <li>The drug may be unregistered or illegal</li>
                <li>Double-check the number for typing errors</li>
            </ul>
            <div class="safety-note danger">
                <p><strong>⚠ Do not use this drug</strong> - It may be dangerous to your health.</p>
            </div>
        </div>
    `;
}

function generateExpiredDetails() {
    return `
        <div class="result-details">
            <h4>What this means:</h4>
            <ul>
                <li>The drug was previously registered with NAFDAC</li>
                <li>The registration approval has expired</li>
                <li>It is no longer approved for use or sale</li>
                <li>Using expired registration drugs can be unsafe</li>
            </ul>
            <div class="safety-note warning">
                <p><strong>⚠ Avoid using this drug</strong> - The registration has expired and it's no longer approved.</p>
            </div>
        </div>
    `;
}

function displayError() {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="result-card-large error">
            <div class="result-content-large">
                <div class="result-icon-large">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m15 9-6 6"/>
                        <path d="m9 9 6 6"/>
                    </svg>
                </div>
                <h2 class="result-title-large">Error Loading Results</h2>
                <p class="result-description-large">We couldn't load your verification results. Please try again.</p>
                <div class="result-details">
                    <p>If this problem persists, please contact our support team.</p>
                </div>
            </div>
        </div>
    `;
}

// Animation Functions
function initializeAnimations() {
    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add fade-in animation for elements when they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards and sections
    const animatedElements = document.querySelectorAll('.step-card, .result-card, .section-header');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    console.log('Showing notification:', message, type);
    
    const notification = document.createElement('div');
    notification.className = 'notification notification-${type}';
    notification.textContent = message;
    
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease-out';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function trackEvent(eventName, eventData = {}) {
    console.log('Event tracked:', eventName, eventData);
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('results.html')) return 'results';
    if (path.includes('how-it-works.html')) return 'how-it-works';
    if (path.includes('faq.html')) return 'faq';
    if (path.includes('report-fake-drug.html')) return 'report';
    if (path.includes('contact-support.html')) return 'support';
    return 'landing';
}