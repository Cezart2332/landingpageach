// Rezervari Page JavaScript - AcoomH API Integration

// Direct API endpoint
const API_BASE_URL = 'https://api.acoomh.ro';

let allLocations = [];
let filteredLocations = [];
let currentFilter = 'all';
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', function() {
  try {
    // Use the existing loading overlay from HTML instead of creating a new one
    const existingOverlay = document.getElementById('immediateLoadingOverlay');
    if (existingOverlay) {
      existingOverlay.id = 'pageLoadingOverlay'; // Rename to match our functions
    }
    
    // Initialize all components
    initializeFiltering();
    initializeSearch();
    initializeInteractions();
    
    // Load locations from API
    loadLocations();
    
    // Override navigation links to use loading overlay
    setTimeout(() => {
      const navigationLinks = document.querySelectorAll('a[href*=".html"], .btn[href*=".html"], .back-button');
      
      navigationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          
          // Only intercept internal navigation (not external links or anchors)
          if (href && href.includes('.html') && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
            e.preventDefault();
            navigateWithLoading(href);
          }
        });
      });
    }, 100);
    
  } catch (error) {
    console.error('Rezervari page initialization error:', error);
    hideLoadingOverlay();
  }
});

// API Functions
async function loadLocations() {
  showLoadingState();
  
  try {
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const locations = await response.json();
    allLocations = locations;
    filteredLocations = locations;
    
    displayLocations(filteredLocations);
    hideLoadingState();
    
    // FIXED: Hide the page loading overlay after content is loaded
    setTimeout(() => {
      hideLoadingOverlay();
    }, 800);
    
    console.log('✅ Successfully loaded locations from API:', locations.length);
    
  } catch (error) {
    console.error('Error loading locations from API:', error);
    
    // Show user-friendly error message and hide loading overlay
    showErrorState(`Nu am putut încărca locațiile. ${error.message}`);
    hideLoadingOverlay();
  }
}

// Display Functions
function showLoadingState() {
  document.getElementById('loadingState').style.display = 'block';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('locationsContainer').style.display = 'none';
  document.getElementById('emptyResults').style.display = 'none';
}

function showErrorState(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
  document.getElementById('locationsContainer').style.display = 'none';
  document.getElementById('emptyResults').style.display = 'none';
  document.getElementById('errorMessage').textContent = message || 'Nu am putut încărca locațiile disponibile.';
}

function hideLoadingState() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
}

function displayLocations(locations) {
  const locationsGrid = document.getElementById('locationsGrid');
  const locationsContainer = document.getElementById('locationsContainer');
  const emptyResults = document.getElementById('emptyResults');
  
  if (!locations || locations.length === 0) {
    locationsContainer.style.display = 'none';
    emptyResults.style.display = 'block';
    return;
  }
  
  locationsContainer.style.display = 'block';
  emptyResults.style.display = 'none';
  
  locationsGrid.innerHTML = '';
  
  locations.forEach(location => {
    const locationCard = createLocationCard(location);
    locationsGrid.appendChild(locationCard);
  });
}

function createLocationCard(location) {
  const card = document.createElement('div');
  card.className = 'location-card';
  
  // Process tags with proper null checking
  const tags = location.tags && typeof location.tags === 'string' 
    ? location.tags.split(',').map(tag => tag.trim()).filter(tag => tag) 
    : [];
  
  // FIXED: Better image handling for different data formats
  let imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  
  if (location.photo) {
    try {
      if (typeof location.photo === 'string') {
        // If it's already a base64 string or URL
        if (location.photo.startsWith('data:image/')) {
          imageUrl = location.photo;
        } else if (location.photo.startsWith('http')) {
          imageUrl = location.photo;
        } else {
          // Assume it's a base64 string without the data URL prefix
          imageUrl = `data:image/jpeg;base64,${location.photo}`;
        }
      } else if (Array.isArray(location.photo) && location.photo.length > 0) {
        // If it's an array of bytes
        const base64String = arrayBufferToBase64(location.photo);
        imageUrl = `data:image/jpeg;base64,${base64String}`;
      } else if (location.photo.constructor === ArrayBuffer || location.photo.buffer) {
        // If it's an ArrayBuffer
        const base64String = arrayBufferToBase64(new Uint8Array(location.photo));
        imageUrl = `data:image/jpeg;base64,${base64String}`;
      }
    } catch (error) {
      console.error('Error processing image for location:', location.id, error);
      // Keep default image URL
    }
  }
  
  card.innerHTML = `
    <div class="location-image">
      <img src="${imageUrl}" alt="${location.name}" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
      <div class="location-category">${getCategoryIcon(location.category)} ${location.category}</div>
    </div>
    <div class="location-content">
      <h3 class="location-name">${location.name}</h3>
      <p class="location-address">
        <i class="fas fa-map-marker-alt"></i>
        ${location.address}
      </p>
      ${tags.length > 0 ? `
        <div class="location-tags">
          ${tags.slice(0, 3).map(tag => `<span class="location-tag">${tag}</span>`).join('')}
          ${tags.length > 3 ? `<span class="location-tag-more">+${tags.length - 3}</span>` : ''}
        </div>
      ` : ''}
      <div class="location-actions">
        <button class="btn-view-details" data-location-id="${location.id}">
          <i class="fas fa-eye"></i>
          Vezi detalii
        </button>
        <button class="btn-reserve" data-location-id="${location.id}">
          <i class="fas fa-calendar-check"></i>
          Rezervă
        </button>
      </div>
    </div>
  `;
  
  // FIXED: Add proper event listeners with IMMEDIATE overlay
  const viewDetailsBtn = card.querySelector('.btn-view-details');
  const reserveBtn = card.querySelector('.btn-reserve');
  
  // CRITICAL: Zero-delay, completely synchronous navigation with full blocking
  viewDetailsBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // Block any other events from firing
    document.body.style.pointerEvents = 'none';
    
    // Show overlay completely synchronously
    showLoadingOverlayImmediately();
    
    // Force synchronous rendering
    document.body.offsetHeight;
    
    // Navigate immediately without any delay
    window.location.href = `restaurant.html?id=${location.id}`;
  });
  
  reserveBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // Block any other events from firing
    document.body.style.pointerEvents = 'none';
    
    // Show overlay completely synchronously
    showLoadingOverlayImmediately();
    
    // Force synchronous rendering
    document.body.offsetHeight;
    
    // Navigate immediately without any delay
    window.location.href = `restaurant.html?id=${location.id}#reservation`;
  });
  
  // Also add click to the card itself
  card.addEventListener('click', function(e) {
    // Only trigger if not clicking on buttons
    if (!e.target.closest('.btn-view-details') && !e.target.closest('.btn-reserve')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Block any other events from firing
      document.body.style.pointerEvents = 'none';
      
      // Show overlay completely synchronously
      showLoadingOverlayImmediately();
      
      // Force synchronous rendering
      document.body.offsetHeight;
      
      // Navigate immediately without any delay
      window.location.href = `restaurant.html?id=${location.id}`;
    }
  });
  
  return card;
}

function getCategoryIcon(category) {
  const categoryIcons = {
    'restaurant': 'fas fa-utensils',
    'cafe': 'fas fa-coffee',
    'pub': 'fas fa-beer',
    'club': 'fas fa-music',
    'bar': 'fas fa-cocktail'
  };
  
  const normalizedCategory = category.toLowerCase();
  return `<i class="${categoryIcons[normalizedCategory] || 'fas fa-store'}"></i>`;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Navigation Functions
function openLocationDetails(locationId) {
  window.location.href = `restaurant.html?id=${locationId}`;
}

function quickReserve(locationId) {
  window.location.href = `restaurant.html?id=${locationId}#reservation`;
}

// Filter functionality
function initializeFiltering() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      currentFilter = this.dataset.type;
      applyFilters();
    });
  });
}

function applyFilters() {
  let filtered = [...allLocations];
  
  // Apply category filter
  if (currentFilter !== 'all') {
    const categoryMap = {
      'restaurants': ['restaurant', 'restaurante'],
      'cafes': ['cafe', 'cafenea', 'coffee'],
      'pubs': ['pub', 'brewery'],
      'clubs': ['club', 'nightclub', 'disco']
    };
    
    const validCategories = categoryMap[currentFilter] || [currentFilter];
    filtered = filtered.filter(location => 
      validCategories.some(cat => 
        location.category.toLowerCase().includes(cat.toLowerCase())
      )
    );
  }
  
  // Apply search filter
  if (currentSearchTerm) {
    filtered = filtered.filter(location =>
      location.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      location.category.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      (location.tags && location.tags.toLowerCase().includes(currentSearchTerm.toLowerCase()))
    );
  }
  
  filteredLocations = filtered;
  displayLocations(filteredLocations);
}

// Search functionality
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');

  if (!searchInput) return;

  searchInput.addEventListener('input', function() {
    currentSearchTerm = this.value.trim();
    applyFilters();
  });

  // Search on Enter key
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
    }
  });
}

// Interactive effects
function initializeInteractions() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('searchInput');
  const searchBox = document.querySelector('.search-box');

  // Filter button hover effects
  filterButtons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'translateY(-2px)';
      }
    });

    button.addEventListener('mouseleave', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'translateY(0)';
      }
    });
  });

  // Search box focus effects
  if (searchInput && searchBox) {
    searchInput.addEventListener('focus', function() {
      searchBox.style.transform = 'translateY(-2px)';
    });

    searchInput.addEventListener('blur', function() {
      searchBox.style.transform = 'translateY(0)';
    });
  }

  // Back button hover effect
  const backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });

    backButton.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  }
}

// Page Loading Overlay System - Prevents barrel roll animations
function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'page-loading-overlay';
  overlay.id = 'pageLoadingOverlay';
  
  overlay.innerHTML = `
    <div class="loading-spinner-container">
      <div class="modern-loading-spinner"></div>
      <div class="loading-text">
        Se încarcă<span class="loading-dots"></span>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  return overlay;
}

function showLoadingOverlay() {
  // Add loading class to body to disable animations
  document.body.classList.add('loading');
  document.body.classList.remove('loaded');
  
  // Create overlay if it doesn't exist
  let overlay = document.getElementById('pageLoadingOverlay');
  if (!overlay) {
    overlay = createLoadingOverlay();
  }
  
  // Show overlay
  overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('pageLoadingOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    
    // Remove overlay after transition
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 500);
  }
  
  // Re-enable animations and mark page as loaded
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');
}

// Intercept page navigation to show loading overlay - COPIED FROM HOMEPAGE
function navigateWithLoading(url) {
  // Clear any existing timeouts that might hide the overlay
  clearTimeout(window.loadingTimeout);
  
  showLoadingOverlay();
  
  // Navigate immediately - no delay needed
  window.location.href = url;
}

// FIXED: Ensure loading overlay is hidden when page becomes visible again
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    // Page became visible again - ensure loading overlay is hidden
    setTimeout(() => {
      const overlay = document.getElementById('pageLoadingOverlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        hideLoadingOverlay();
      }
    }, 100);
  }
});

// FIXED: Handle back/forward navigation properly
window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    // Page was restored from cache - hide loading overlay
    hideLoadingOverlay();
  }
});

// Show loading on page unload (when leaving page)
window.addEventListener('beforeunload', function() {
  showLoadingOverlay();
});

// Immediately show loading overlay without delay
function showLoadingOverlayImmediately() {
  // Add loading class to body to disable animations
  document.body.classList.add('loading');
  document.body.classList.remove('loaded');
  
  // Create overlay if it doesn't exist
  let overlay = document.getElementById('pageLoadingOverlay');
  if (!overlay) {
    overlay = createLoadingOverlay();
  }
  
  // Show overlay
  overlay.classList.remove('hidden');
}
