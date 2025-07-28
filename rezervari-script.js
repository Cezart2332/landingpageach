// Rezervari Page JavaScript - API Integration with CORS Proxy

// Use CORS proxy for local development
const API_BASE_URL = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname === '' 
                    ? 'https://cors-anywhere.herokuapp.com/https://api.acoomh.ro'
                    : 'https://api.acoomh.ro';

let allLocations = [];
let filteredLocations = [];
let currentFilter = 'all';
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initializeFiltering();
  initializeSearch();
  initializeInteractions();
  
  // Load locations from API
  loadLocations();
});

// API Functions
async function loadLocations() {
  showLoadingState();
  
  try {
    // Prepare headers for CORS proxy
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Add special headers for CORS proxy when in development
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.hostname === '') {
      headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const locations = await response.json();
    allLocations = locations;
    filteredLocations = locations;
    
    displayLocations(filteredLocations);
    hideLoadingState();
    
    console.log('✅ Successfully loaded locations from API:', locations.length);
    
  } catch (error) {
    console.error('Error loading locations from API:', error);
    
    // Show user-friendly error message
    showErrorState(`Nu am putut încărca locațiile. ${error.message}`);
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
  card.onclick = () => openLocationDetails(location.id);
  
  // Process tags
  const tags = location.tags ? location.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
  
  // Create image URL from byte array if available
  const imageUrl = location.photo && location.photo.length > 0 
    ? `data:image/jpeg;base64,${arrayBufferToBase64(location.photo)}`
    : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  
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
        <button class="btn-view-details">
          <i class="fas fa-eye"></i>
          Vezi detalii
        </button>
        <button class="btn-reserve" onclick="event.stopPropagation(); quickReserve(${location.id})">
          <i class="fas fa-calendar-check"></i>
          Rezervă
        </button>
      </div>
    </div>
  `;
  
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

// Utility Functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Export utilities for potential future use
window.rezervariPage = {
  loadLocations,
  showNotification
};
async function locatii(){
  const response = await fetch("https://api.acoomh.ro/locations")
  console.log(response)
}
locatii();