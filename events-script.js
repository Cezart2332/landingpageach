// Events Page JavaScript - AcoomH API Integration

// Direct API endpoint (use proxy in dev to avoid CORS)
const isLocalDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);
const API_BASE_URL = isLocalDev ? '/api' : 'https://api.acoomh.ro';

let allEvents = [];
let filteredEvents = [];
let currentFilter = 'all';
let currentSearchTerm = '';

// Cache DOM elements for better performance
const DOM = {
  loadingState: null,
  errorState: null,
  eventsContainer: null,
  emptyResults: null,
  eventsGrid: null,
  errorMessage: null,
  searchInput: null
};

// Initialize DOM cache
function initializeDOM() {
  DOM.loadingState = document.getElementById('loadingState');
  DOM.errorState = document.getElementById('errorState');
  DOM.eventsContainer = document.getElementById('eventsContainer');
  DOM.emptyResults = document.getElementById('emptyResults');
  DOM.eventsGrid = document.getElementById('eventsGrid');
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
    
    // Load events from API
    loadEvents();
    
    // Setup navigation handlers with requestAnimationFrame for better performance
    requestAnimationFrame(setupNavigationHandlers);
    
  } catch (error) {
    console.error('Events page initialization error:', error);
    hideLoadingOverlay();
  }
});

// API Functions
async function loadEvents() {
  showLoadingState();
  
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
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
    
    // Handle paginated response format
    const events = responseData.data || responseData || [];
    
    // Ensure we have an array
    if (!Array.isArray(events)) {
      throw new Error('Răspunsul API-ului nu conține un array valid de evenimente');
    }
    
    allEvents = events;
    filteredEvents = events;
    
    displayEvents(filteredEvents);
    hideLoadingState();
    
    // Hide loading overlay immediately
    hideLoadingOverlay();
    
    console.log('✅ Successfully loaded events from API:', events.length);
    
  } catch (error) {
    console.error('Error loading events from API:', error);
    
    // Show user-friendly error message and hide loading overlay
    showErrorState(`Nu am putut încărca evenimentele. ${error.message}`);
    hideLoadingOverlay();
  }
}

// Display Functions - Optimized with DOM cache
function showLoadingState() {
  DOM.loadingState.style.display = 'block';
  DOM.errorState.style.display = 'none';
  DOM.eventsContainer.style.display = 'none';
  DOM.emptyResults.style.display = 'none';
}

function showErrorState(message) {
  DOM.loadingState.style.display = 'none';
  DOM.errorState.style.display = 'block';
  DOM.eventsContainer.style.display = 'none';
  DOM.emptyResults.style.display = 'none';
  DOM.errorMessage.textContent = message || 'Nu am putut încărca evenimentele disponibile.';
}

function hideLoadingState() {
  DOM.loadingState.style.display = 'none';
  DOM.errorState.style.display = 'none';
}

function displayEvents(events) {
  if (!events || events.length === 0) {
    DOM.eventsContainer.style.display = 'none';
    DOM.emptyResults.style.display = 'block';
    return;
  }
  
  DOM.eventsContainer.style.display = 'block';
  DOM.emptyResults.style.display = 'none';
  
  // Use DocumentFragment for better performance when adding multiple elements
  const fragment = document.createDocumentFragment();
  
  events.forEach(event => {
    const eventCard = createEventCard(event);
    fragment.appendChild(eventCard);
  });
  
  // Clear and append all at once
  DOM.eventsGrid.innerHTML = '';
  DOM.eventsGrid.appendChild(fragment);
}

// Optimized image processing function for events
function getOptimizedEventImageUrl(event) {
  const defaultImages = {
    'concert': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    'festival': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    'teatru': 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    'conferinta': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    'sport': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  };
  
  const category = (event.Category || event.category || 'concert').toLowerCase();
  const defaultImage = defaultImages[category] || defaultImages['concert'];
  
  // Check for photoUrl first (new backend format)
  if (event.photoUrl) {
    return event.photoUrl;
  }
  
  // FALLBACK: Support for legacy photo field
  if (!event.Photo && !event.photo) return defaultImage;
  
  try {
    const photoData = event.Photo || event.photo;
    if (typeof photoData === 'string') {
      // Handle "use_photo_url" indicator
      if (photoData === 'use_photo_url') {
        return event.photoUrl || defaultImage;
      }
      
      // Handle direct URLs and base64 data
      if (photoData.startsWith('data:image/') || photoData.startsWith('http')) {
        return photoData;
      }
      
      // Handle base64 without data prefix
      return `data:image/jpeg;base64,${photoData}`;
    }
    // For other types, use default
    return defaultImage;
  } catch (error) {
    console.warn('Error processing image for event:', event.id);
    return defaultImage;
  }
}

function createEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card';
  
  // Add data-event-id to the main card element for click detection
  card.setAttribute('data-event-id', event.id);
  
  // Safe tag processing
  let tags = [];
  if (event.tags) {
    if (typeof event.tags === 'string') {
      tags = event.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    } else if (Array.isArray(event.tags)) {
      tags = event.tags.map(tag => String(tag).trim()).filter(Boolean);
    }
  }
  
  const imageUrl = getOptimizedEventImageUrl(event);
  const eventName = event.Name || event.name || 'Eveniment';
  const eventLocation = event.Location || event.location || 'Locație necunoscută';
  const eventCategory = event.Category || event.category || 'Eveniment';
  const eventPrice = event.Price || event.price || 'Preț la cerere';
  
  // Format date and time
  let eventDate = 'Data se anunță';
  let eventTime = '';
  
  if (event.Date || event.date) {
    const date = new Date(event.Date || event.date);
    eventDate = date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short'
    });
  }
  
  if (event.Time || event.time) {
    eventTime = event.Time || event.time;
  }
  
  card.innerHTML = `
    <div class="event-image">
      <img src="${imageUrl}" alt="${eventName}" loading="lazy" onerror="this.src='${getOptimizedEventImageUrl({})}'" />
      <div class="event-category">${getCategoryIcon(eventCategory)} ${eventCategory}</div>
      <div class="event-date-badge">${eventDate}</div>
    </div>
    <div class="event-content">
      <h3 class="event-name">${eventName}</h3>
      <p class="event-location">
        <i class="fas fa-map-marker-alt"></i>
        ${eventLocation}
      </p>
      ${eventTime ? `
        <p class="event-time">
          <i class="fas fa-clock"></i>
          ${eventTime}
        </p>
      ` : ''}
      <p class="event-price">
        <i class="fas fa-ticket-alt"></i>
        ${eventPrice}
      </p>
      ${tags.length > 0 ? `
        <div class="event-tags">
          ${tags.slice(0, 2).map(tag => `<span class="event-tag">${tag}</span>`).join('')}
          ${tags.length > 2 ? `<span class="event-tag">+${tags.length - 2}</span>` : ''}
        </div>
      ` : ''}
      <div class="event-actions">
        <button class="btn-view-details" data-event-id="${event.id}">
          <i class="fas fa-eye"></i>
          Vezi detalii
        </button>
        <button class="btn-reserve" data-event-id="${event.id}">
          <i class="fas fa-ticket-alt"></i>
          Rezervă bilete
        </button>
      </div>
    </div>
  `;
  
  // Event listener with better debugging
  card.addEventListener('click', function(e) {
    console.log('Event card clicked!', { eventId: event.id, target: e.target });
    handleCardClick(e, event.id);
  });
  
  return card;
}

// Optimized event handling with delegation
function handleCardClick(e, eventId) {
  // Use the passed eventId parameter, or fallback to data attribute
  const finalEventId = eventId || e.target.closest('[data-event-id]')?.dataset.eventId;
  
  console.log('handleCardClick called', { finalEventId, target: e.target.tagName });
  
  if (!finalEventId) {
    console.warn('No eventId found!');
    return;
  }
  
  if (e.target.closest('.btn-view-details')) {
    console.log('Clicked Vezi detalii button');
    e.preventDefault();
    e.stopPropagation();
    navigateToEvent(finalEventId);
  } else if (e.target.closest('.btn-reserve')) {
    console.log('Clicked Rezervă bilete button');
    e.preventDefault();
    e.stopPropagation();
    navigateToEventReservation(finalEventId);
  } else if (!e.target.closest('button')) {
    console.log('Clicked somewhere else on card - navigating to event');
    e.preventDefault();
    e.stopPropagation();
    navigateToEvent(finalEventId);
  }
}

function navigateToEvent(eventId) {
  showLoadingOverlayImmediately();
  window.location.href = `event.html?id=${eventId}`;
}

function navigateToEventReservation(eventId) {
  showLoadingOverlayImmediately();
  window.location.href = `event.html?id=${eventId}#reservation`;
}

function getCategoryIcon(category) {
  const categoryIcons = {
    'concert': 'fas fa-music',
    'festival': 'fas fa-star',
    'teatru': 'fas fa-theater-masks',
    'conferinta': 'fas fa-microphone',
    'sport': 'fas fa-trophy',
    'club': 'fas fa-cocktail',
    'party': 'fas fa-glass-cheers'
  };
  
  const normalizedCategory = category.toLowerCase();
  return `<i class="${categoryIcons[normalizedCategory] || 'fas fa-calendar-alt'}"></i>`;
}

// Filter functionality
function initializeFiltering() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => {
        btn.classList.remove('active');
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
  let filtered = [...allEvents];
  
  // Apply category filter
  if (currentFilter !== 'all') {
    const categoryMap = {
      'concert': ['concert', 'concerte', 'muzică'],
      'festival': ['festival', 'festivaluri'],
      'teatru': ['teatru', 'spectacol', 'piesa'],
      'sport': ['sport', 'meci', 'competiție'],
      'conferinta': ['conferință', 'prezentare', 'workshop']
    };
    
    const validCategories = categoryMap[currentFilter] || [currentFilter];
    filtered = filtered.filter(event => {
      const eventCategory = (event.Category || event.category || '').toLowerCase();
      return validCategories.some(cat => 
        eventCategory.includes(cat.toLowerCase())
      );
    });
  }
  
  // Apply search filter
  if (currentSearchTerm) {
    filtered = filtered.filter(event => {
      const searchTerm = currentSearchTerm.toLowerCase();
      const eventName = (event.Name || event.name || '').toLowerCase();
      const eventLocation = (event.Location || event.location || '').toLowerCase();
      const eventCategory = (event.Category || event.category || '').toLowerCase();
      
      // Check name, location, and category
      const matchesBasic = 
        eventName.includes(searchTerm) ||
        eventLocation.includes(searchTerm) ||
        eventCategory.includes(searchTerm);
      
      // Safe tag checking
      let matchesTags = false;
      if (event.tags) {
        if (typeof event.tags === 'string') {
          matchesTags = event.tags.toLowerCase().includes(searchTerm);
        } else if (Array.isArray(event.tags)) {
          matchesTags = event.tags.some(tag => 
            String(tag).toLowerCase().includes(searchTerm)
          );
        }
      }
      
      return matchesBasic || matchesTags;
    });
  }
  
  filteredEvents = filtered;
  displayEvents(filteredEvents);
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

// Navigation handlers setup
function setupNavigationHandlers() {
  // Override navigation links to use loading overlay
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
}

// Page Loading Overlay System
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
  document.body.classList.add('loading');
  document.body.classList.remove('loaded');
  
  let overlay = document.getElementById('pageLoadingOverlay');
  if (!overlay) {
    overlay = createLoadingOverlay();
  }
  
  overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('pageLoadingOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 500);
  }
  
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');
  document.body.style.pointerEvents = 'auto';
}

function navigateWithLoading(url) {
  clearTimeout(window.loadingTimeout);
  showLoadingOverlay();
  window.location.href = url;
}

function showLoadingOverlayImmediately() {
  document.body.classList.add('loading');
  document.body.classList.remove('loaded');
  
  let overlay = document.getElementById('pageLoadingOverlay');
  if (!overlay) {
    overlay = createLoadingOverlay();
  }
  
  overlay.classList.remove('hidden');
}

// Handle page visibility and navigation events
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    setTimeout(() => {
      const overlay = document.getElementById('pageLoadingOverlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        hideLoadingOverlay();
      }
    }, 100);
  }
});

window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    hideLoadingOverlay();
  }
});

window.addEventListener('beforeunload', function() {
  showLoadingOverlay();
});

console.log('Events page JavaScript initialized successfully');