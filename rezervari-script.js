// Rezervari Page JavaScript - AcoomH API Integration

// Direct API endpoint
const API_BASE_URL = 'https://api.acoomh.ro';

let allLocations = [];
let filteredLocations = [];
let currentFilter = 'all';
let currentSearchTerm = '';

// Cache DOM elements for better performance
const DOM = {
  loadingState: null,
  errorState: null,
  locationsContainer: null,
  emptyResults: null,
  locationsGrid: null,
  errorMessage: null,
  searchInput: null
};

// Initialize DOM cache
function initializeDOM() {
  DOM.loadingState = document.getElementById('loadingState');
  DOM.errorState = document.getElementById('errorState');
  DOM.locationsContainer = document.getElementById('locationsContainer');
  DOM.emptyResults = document.getElementById('emptyResults');
  DOM.locationsGrid = document.getElementById('locationsGrid');
  DOM.errorMessage = document.getElementById('errorMessage');
  DOM.searchInput = document.getElementById('searchInput');
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    // CRITICAL: Initialize DOM cache first
    initializeDOM();
    
    // CRITICAL: Ensure pointer events are enabled when page loads
    document.body.style.pointerEvents = 'auto';
    
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
    
    // Setup navigation handlers with requestAnimationFrame for better performance
    requestAnimationFrame(setupNavigationHandlers);
    
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
    
    const responseData = await response.json();
    
    // FIXED: Handle paginated response format
    const locations = responseData.data || responseData || [];
    
    // Ensure we have an array
    if (!Array.isArray(locations)) {
      throw new Error('Răspunsul API-ului nu conține un array valid de locații');
    }
    
    allLocations = locations;
    filteredLocations = locations;
    
    displayLocations(filteredLocations);
    hideLoadingState();
    
    // OPTIMIZED: Remove artificial 800ms delay - hide immediately
    hideLoadingOverlay();
    
    console.log('✅ Successfully loaded locations from API:', locations.length);
    
  } catch (error) {
    console.error('Error loading locations from API:', error);
    
    // Show user-friendly error message and hide loading overlay
    showErrorState(`Nu am putut încărca locațiile. ${error.message}`);
    hideLoadingOverlay();
  }
}

// Display Functions - Optimized with DOM cache
function showLoadingState() {
  DOM.loadingState.style.display = 'block';
  DOM.errorState.style.display = 'none';
  DOM.locationsContainer.style.display = 'none';
  DOM.emptyResults.style.display = 'none';
}

function showErrorState(message) {
  DOM.loadingState.style.display = 'none';
  DOM.errorState.style.display = 'block';
  DOM.locationsContainer.style.display = 'none';
  DOM.emptyResults.style.display = 'none';
  DOM.errorMessage.textContent = message || 'Nu am putut încărca locațiile disponibile.';
}

function hideLoadingState() {
  DOM.loadingState.style.display = 'none';
  DOM.errorState.style.display = 'none';
}

function displayLocations(locations) {
  if (!locations || locations.length === 0) {
    DOM.locationsContainer.style.display = 'none';
    DOM.emptyResults.style.display = 'block';
    return;
  }
  
  DOM.locationsContainer.style.display = 'block';
  DOM.emptyResults.style.display = 'none';
  
  // Use DocumentFragment for better performance when adding multiple elements
  const fragment = document.createDocumentFragment();
  
  locations.forEach(location => {
    const locationCard = createLocationCard(location);
    fragment.appendChild(locationCard);
  });
  
  // Clear and append all at once
  DOM.locationsGrid.innerHTML = '';
  DOM.locationsGrid.appendChild(fragment);
}

// Optimized image processing function
function getOptimizedImageUrl(location) {
  const defaultImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  
  // NEW: Check for photoUrl first (new backend format)
  if (location.photoUrl) {
    return location.photoUrl;
  }
  
  // FALLBACK: Support for legacy photo field
  if (!location.photo) return defaultImage;
  
  try {
    if (typeof location.photo === 'string') {
      // NEW: Handle "use_photo_url" indicator
      if (location.photo === 'use_photo_url') {
        return location.photoUrl || defaultImage;
      }
      
      // LEGACY: Handle direct URLs and base64 data
      if (location.photo.startsWith('data:image/') || location.photo.startsWith('http')) {
        return location.photo;
      }
      
      // LEGACY: Handle base64 without data prefix
      return `data:image/jpeg;base64,${location.photo}`;
    }
    // For other types, use default
    return defaultImage;
  } catch (error) {
    console.warn('Error processing image for location:', location.id);
    return defaultImage;
  }
}

function createLocationCard(location) {
  const card = document.createElement('div');
  card.className = 'location-card';
  
  // IMPORTANT: Add data-location-id to the main card element for click detection
  card.setAttribute('data-location-id', location.id);
  
  // FIXED: Safe tag processing with proper type checking
  let tags = [];
  if (location.tags) {
    if (typeof location.tags === 'string') {
      // If tags is a string, split it
      tags = location.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    } else if (Array.isArray(location.tags)) {
      // If tags is already an array, use it directly
      tags = location.tags.map(tag => String(tag).trim()).filter(Boolean);
    }
  }
  
  const imageUrl = getOptimizedImageUrl(location);
  
  card.innerHTML = `
    <div class="location-image">
      <img src="${imageUrl}" alt="${location.name}" loading="lazy" onerror="this.src='${getOptimizedImageUrl({})}'" />
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
  
  // IMPROVED: Event listener with better debugging
  card.addEventListener('click', function(e) {
    console.log('Card clicked!', { locationId: location.id, target: e.target });
    handleCardClick(e, location.id);
  });
  
  return card;
}

// Optimized event handling with delegation
function handleCardClick(e, locationId) {
  // Use the passed locationId parameter, or fallback to data attribute
  const finalLocationId = locationId || e.target.closest('[data-location-id]')?.dataset.locationId;
  
  console.log('handleCardClick called', { finalLocationId, target: e.target.tagName });
  
  if (!finalLocationId) {
    console.warn('No locationId found!');
    return;
  }
  
  if (e.target.closest('.btn-view-details')) {
    console.log('Clicked Vezi detalii button');
    e.preventDefault();
    e.stopPropagation();
    navigateToLocation(finalLocationId);
  } else if (e.target.closest('.btn-reserve')) {
    console.log('Clicked Rezervă button');
    e.preventDefault();
    e.stopPropagation();
    navigateToReservation(finalLocationId);
  } else if (!e.target.closest('button')) {
    console.log('Clicked somewhere else on card - navigating to restaurant');
    e.preventDefault();
    e.stopPropagation();
    navigateToLocation(finalLocationId);
  }
}

function navigateToLocation(locationId) {
  showLoadingOverlayImmediately();
  window.location.href = `restaurant.html?id=${locationId}`;
}

function navigateToReservation(locationId) {
  showLoadingOverlayImmediately();
  window.location.href = `restaurant.html?id=${locationId}#reservation`;
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
      filterButtons.forEach(btn => {
        btn.classList.remove('active');
        // Accessibility: keep aria-selected in sync
        if (btn.hasAttribute('role')) {
          btn.setAttribute('aria-selected', 'false');
        }
      });
      // Add active class to clicked button
      this.classList.add('active');
      if (this.hasAttribute('role')) {
        this.setAttribute('aria-selected', 'true');
      }
      
      currentFilter = this.dataset.type;
      applyFilters();
    });
  });

  // Ensure initial aria-selected state is correct on load
  filterButtons.forEach(btn => {
    const isActive = btn.classList.contains('active');
    if (btn.hasAttribute('role')) {
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
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
        location.category && location.category.toLowerCase().includes(cat.toLowerCase())
      )
    );
  }
  
  // Apply search filter with safe tag checking
  if (currentSearchTerm) {
    filtered = filtered.filter(location => {
      const searchTerm = currentSearchTerm.toLowerCase();
      
      // Check name and address
      const matchesBasic = 
        (location.name && location.name.toLowerCase().includes(searchTerm)) ||
        (location.address && location.address.toLowerCase().includes(searchTerm)) ||
        (location.category && location.category.toLowerCase().includes(searchTerm));
      
      // Safe tag checking
      let matchesTags = false;
      if (location.tags) {
        if (typeof location.tags === 'string') {
          matchesTags = location.tags.toLowerCase().includes(searchTerm);
        } else if (Array.isArray(location.tags)) {
          matchesTags = location.tags.some(tag => 
            String(tag).toLowerCase().includes(searchTerm)
          );
        }
      }
      
      return matchesBasic || matchesTags;
    });
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
  
  // CRITICAL: Always ensure pointer events are enabled
  document.body.style.pointerEvents = 'auto';
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
