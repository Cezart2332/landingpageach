// Restaurant Page JavaScript - AcoomH API Integration with CORS Proxy

// Use CORS proxy for local development
const API_BASE_URL = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname === '' 
                    ? 'https://cors-anywhere.herokuapp.com/https://api.acoomh.ro'
                    : 'https://api.acoomh.ro';

let currentLocation = null;

document.addEventListener("DOMContentLoaded", function () {
  try {
    // Get location ID from URL
    const locationId = getLocationId();
    if (locationId) {
      loadLocationDetails(locationId);
    } else {
      showError('ID-ul locației nu a fost găsit în URL.');
      return;
    }

    // Initialize form and other components
    initializeAll();
    
    // Check if should scroll to reservation section
    if (window.location.hash === '#reservation') {
      setTimeout(() => {
        const reservationSection = document.querySelector('.reservation-section');
        if (reservationSection) {
          reservationSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 1000);
    }
    
  } catch (error) {
    console.error('Restaurant page initialization error:', error);
    showError('A apărut o problemă la încărcarea paginii.');
  }
});

// API Functions
async function loadLocationDetails(locationId) {
  try {
    showLoadingState();
    
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
    
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Locația nu a fost găsită.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const location = await response.json();
    currentLocation = location;
    
    // Load location hours if available
    await loadLocationHours(locationId);
    
    populateLocationDetails(location);
    hideLoadingState();
    
    console.log('✅ Successfully loaded location details:', location);
    
  } catch (error) {
    console.error('Error loading location details:', error);
    showError(error.message || 'Nu am putut încărca detaliile locației.');
  }
}

async function loadLocationHours(locationId) {
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
    
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}/hours`, {
      method: 'GET',
      headers: headers
    });
    
    if (response.ok) {
      const hours = await response.json();
      currentLocation.hours = hours;
    }
  } catch (error) {
    console.log('Could not load location hours:', error);
    // Don't show error for hours, it's optional
  }
}

async function createReservation(reservationData) {
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
    
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(reservationData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const reservation = await response.json();
    console.log('✅ Successfully created reservation:', reservation);
    return reservation;
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

// Utility Functions
function getLocationId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

function showLoadingState() {
  document.body.classList.add('loading');
  // You can add a loading overlay here if needed
}

function hideLoadingState() {
  document.body.classList.remove('loading');
}

function showError(message) {
  showPopup(
    'Eroare',
    message,
    'fas fa-exclamation-triangle'
  );
}

// Populate location details
function populateLocationDetails(location) {
  // Basic info
  document.getElementById('restaurantName').textContent = location.name;
  document.getElementById('restaurantAddress').textContent = location.address;
  document.getElementById('restaurantCuisine').textContent = location.category;
  
  // Description (use a default if not provided)
  const description = location.description || 
    `Descoperă ${location.name}, un loc minunat cu o atmosferă unică și o experiență de neuitat. Situat în ${location.address}, oferim servicii de calitate și o experiență plăcută pentru toți vizitatorii.`;
  document.getElementById('restaurantDescription').textContent = description;
  
  // Restaurant image
  const restaurantImage = document.getElementById('restaurantImage');
  if (location.photo && location.photo.length > 0) {
    try {
      const imageUrl = `data:image/jpeg;base64,${arrayBufferToBase64(location.photo)}`;
      restaurantImage.src = imageUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      setDefaultImage(restaurantImage, location.category);
    }
  } else {
    setDefaultImage(restaurantImage, location.category);
  }
  restaurantImage.alt = location.name;
  
  // Tags
  const tagsContainer = document.getElementById('restaurantTags');
  tagsContainer.innerHTML = '';
  
  // Add category as first tag
  const categoryTag = document.createElement('span');
  categoryTag.className = 'restaurant-tag primary';
  categoryTag.innerHTML = `${getCategoryIcon(location.category)} ${location.category}`;
  tagsContainer.appendChild(categoryTag);
  
  // Add other tags if available - fix null checking here too
  if (location.tags && typeof location.tags === 'string') {
    const tags = location.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    tags.slice(0, 4).forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'restaurant-tag';
      tagElement.textContent = tag;
      tagsContainer.appendChild(tagElement);
    });
  }
  
  // Schedule
  populateSchedule(location.hours);
  
  // Features based on category and available info
  populateFeatures(location);
  
  // Set phone if available from company data
  if (location.company && location.company.email) {
    // For now, we'll keep the default phone, but you could enhance this
    const phoneElement = document.getElementById('restaurantPhone');
    phoneElement.textContent = '0721 234 567'; // Default for now
    phoneElement.href = 'tel:0721234567';
  }
  
  // Update page title
  document.title = `${location.name} - AcoomH`;
}

function setDefaultImage(imageElement, category) {
  const defaultImages = {
    'restaurant': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'pub': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'club': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  };
  
  const normalizedCategory = category.toLowerCase();
  imageElement.src = defaultImages[normalizedCategory] || defaultImages['restaurant'];
}

function populateSchedule(hours) {
  const scheduleContainer = document.getElementById('restaurantSchedule');
  scheduleContainer.innerHTML = '';
  
  const today = new Date().toLocaleDateString('ro-RO', { weekday: 'long' });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);
  
  const dayNames = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
  
  if (hours && hours.length > 0) {
    // Use actual hours from API
    dayNames.forEach(day => {
      const dayHour = hours.find(h => h.dayOfWeek === day);
      const scheduleItem = document.createElement('div');
      scheduleItem.className = 'schedule-item';
      
      const isToday = day === todayCapitalized;
      const hoursText = dayHour ? 
        (dayHour.isClosed ? 'Închis' : `${dayHour.openTime} - ${dayHour.closeTime}`) : 
        'Nedisponibil';
      const isClosed = !dayHour || dayHour.isClosed;
      
      scheduleItem.innerHTML = `
        <span class="schedule-day">${day}</span>
        <span class="schedule-hours ${isClosed ? 'closed' : ''} ${isToday ? 'current-day' : ''}">${hoursText}</span>
      `;
      
      scheduleContainer.appendChild(scheduleItem);
    });
  } else {
    // Use default schedule
    const defaultSchedule = {
      'Luni': '10:00 - 22:00',
      'Marți': '10:00 - 22:00',
      'Miercuri': '10:00 - 22:00',
      'Joi': '10:00 - 22:00',
      'Vineri': '10:00 - 23:00',
      'Sâmbătă': '10:00 - 23:00',
      'Duminică': '12:00 - 21:00'
    };
    
    Object.entries(defaultSchedule).forEach(([day, hoursText]) => {
      const scheduleItem = document.createElement('div');
      scheduleItem.className = 'schedule-item';
      
      const isToday = day === todayCapitalized;
      
      scheduleItem.innerHTML = `
        <span class="schedule-day">${day}</span>
        <span class="schedule-hours ${isToday ? 'current-day' : ''}">${hoursText}</span>
      `;
      
      scheduleContainer.appendChild(scheduleItem);
    });
  }
}

function populateFeatures(location) {
  const featuresContainer = document.getElementById('restaurantFeatures');
  featuresContainer.innerHTML = '';
  
  // Base features for all locations
  const baseFeatures = [
    { icon: 'fas fa-credit-card', name: 'Plată cu cardul' },
    { icon: 'fas fa-calendar-check', name: 'Rezervări online' }
  ];
  
  // Category-specific features
  const categoryFeatures = {
    'restaurant': [
      { icon: 'fas fa-utensils', name: 'Meniu variat' },
      { icon: 'fas fa-users', name: 'Pentru grupuri' }
    ],
    'cafe': [
      { icon: 'fas fa-wifi', name: 'WiFi gratuit' },
      { icon: 'fas fa-coffee', name: 'Cafea proaspătă' }
    ],
    'pub': [
      { icon: 'fas fa-beer', name: 'Bere la halba' },
      { icon: 'fas fa-tv', name: 'Transmisiuni live' }
    ],
    'club': [
      { icon: 'fas fa-music', name: 'Muzică live' },
      { icon: 'fas fa-cocktail', name: 'Cocktailuri' }
    ]
  };
  
  const normalizedCategory = location.category.toLowerCase();
  const features = [...baseFeatures, ...(categoryFeatures[normalizedCategory] || [])];
  
  features.forEach(feature => {
    const featureElement = document.createElement('div');
    featureElement.className = 'feature-item';
    featureElement.innerHTML = `
      <i class="${feature.icon}"></i>
      <span>${feature.name}</span>
    `;
    featuresContainer.appendChild(featureElement);
  });
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
  return categoryIcons[normalizedCategory] || 'fas fa-store';
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

// Initialize reservation form
function initializeReservationForm() {
  const dateInput = document.getElementById('reservationDate');
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30); // Allow reservations up to 30 days in advance
  
  // Set minimum date to today
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.max = maxDate.toISOString().split('T')[0];
  
  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  dateInput.value = tomorrow.toISOString().split('T')[0];
}

// Validate reservation form
function validateReservationForm() {
  const fullName = document.getElementById('fullName').value.trim();
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const date = document.getElementById('reservationDate').value;
  const time = document.getElementById('reservationTime').value;
  const guests = document.getElementById('guestCount').value;
  
  const errors = [];
  
  if (!fullName) {
    errors.push('Introdu numele tău complet');
  } else if (fullName.length < 2) {
    errors.push('Numele trebuie să aibă cel puțin 2 caractere');
  }
  
  if (!phoneNumber) {
    errors.push('Introdu numărul de telefon');
  } else if (!/^(\+4|4|0)?\d{9}$/.test(phoneNumber.replace(/\s/g, ''))) {
    errors.push('Numărul de telefon nu este valid (ex: 0721234567)');
  }
  
  if (!date) {
    errors.push('Selectează o dată pentru rezervare');
  } else {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.push('Data rezervării nu poate fi în trecut');
    }
  }
  
  if (!time) {
    errors.push('Selectează ora pentru rezervare');
  }
  
  if (!guests) {
    errors.push('Selectează numărul de persoane');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Make reservation
window.makeReservation = async function() {
  const validation = validateReservationForm();
  
  if (!validation.isValid) {
    showPopup(
      'Formular incomplet',
      validation.errors.join('<br>'),
      'fas fa-exclamation-triangle'
    );
    return;
  }
  
  if (!currentLocation) {
    showPopup(
      'Eroare',
      'Datele locației nu sunt disponibile. Te rugăm să reîmprospătezi pagina.',
      'fas fa-exclamation-triangle'
    );
    return;
  }
  
  const fullName = document.getElementById('fullName').value.trim();
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const date = document.getElementById('reservationDate').value;
  const time = document.getElementById('reservationTime').value;
  const guests = document.getElementById('guestCount').value;
  
  // Prepare reservation data
  const reservationData = {
    customerName: fullName,
    customerEmail: `${fullName.replace(/\s+/g, '').toLowerCase()}@temp.acoomh.ro`, // Temporary email
    customerPhone: phoneNumber,
    reservationDate: date,
    reservationTime: time + ':00', // Add seconds
    numberOfPeople: parseInt(guests),
    locationId: parseInt(currentLocation.id),
    specialRequests: '', // Could be added to form later
    status: 'Pending'
  };
  
  // Show loading state
  const btn = document.querySelector('.btn-rezerva');
  const originalContent = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '<div class="loading"></div> Se procesează...';
  
  try {
    const reservation = await createReservation(reservationData);
    
    btn.disabled = false;
    btn.innerHTML = originalContent;
    
    const formattedDate = new Date(date).toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    showPopup(
      'Rezervare confirmată!',
      `Mulțumim, <strong>${fullName}</strong>!<br><br>Rezervarea ta la <strong>${currentLocation.name}</strong> pentru <strong>${formattedDate}</strong> la ora <strong>${time}</strong> pentru <strong>${guests} ${guests === '1' ? 'persoană' : 'persoane'}</strong> a fost trimisă!<br><br>Vei fi contactat în curând pentru confirmare.`,
      'fas fa-check-circle',
      true
    );
    
    // Reset form
    document.getElementById('fullName').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('reservationDate').value = '';
    document.getElementById('reservationTime').value = '';
    document.getElementById('guestCount').value = '';
    
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = originalContent;
    
    showPopup(
      'Eroare la rezervare',
      error.message || 'Nu am putut procesa rezervarea. Te rugăm să încerci din nou.',
      'fas fa-exclamation-triangle'
    );
  }
};

// Show popup message
function showPopup(title, message, icon = 'fas fa-info-circle', isSuccess = false) {
  // Remove existing popups
  const existingPopups = document.querySelectorAll('.popup-overlay');
  existingPopups.forEach(popup => popup.remove());
  
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'popup-content';
  popup.innerHTML = `
    <div style="margin-bottom: 25px;">
      <i class="${icon}" style="font-size: 3rem; color: ${isSuccess ? 'var(--success-color)' : 'var(--primary-color)'}; margin-bottom: 20px; display: block;"></i>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
    <button class="popup-close-btn">
      <i class="fas fa-check" style="margin-right: 8px;"></i>
      Înțeles!
    </button>
  `;

  function closePopup() {
    overlay.style.opacity = '0';
    popup.style.transform = 'scale(0.8) translateY(20px)';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  popup.querySelector('.popup-close-btn').addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePopup();
  });
  
  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closePopup();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  // Show popup with animation
  setTimeout(() => {
    overlay.style.opacity = '1';
    popup.style.transform = 'scale(1) translateY(0)';
  }, 10);
}

// Quick action functions
window.callRestaurant = function() {
  const restaurant = getCurrentRestaurant();
  if (restaurant.phone) {
    window.location.href = `tel:${restaurant.phone}`;
  }
};

window.openMaps = function() {
  const restaurant = getCurrentRestaurant();
  if (restaurant.address) {
    const encodedAddress = encodeURIComponent(restaurant.address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  }
};

window.shareRestaurant = function() {
  const restaurant = getCurrentRestaurant();
  const shareData = {
    title: restaurant.name,
    text: `Descoperă ${restaurant.name} pe AcoomH!`,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch(err => {
      console.log('Error sharing:', err);
      fallbackShare();
    });
  } else {
    fallbackShare();
  }

  function fallbackShare() {
    // Copy URL to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      showPopup(
        'Link copiat!',
        'Link-ul către restaurant a fost copiat în clipboard.',
        'fas fa-copy',
        true
      );
    }).catch(() => {
      showPopup(
        'Partajare',
        `Copiază acest link pentru a partaja restaurantul:<br><br><code style="background: var(--bg-dark); padding: 8px; border-radius: 6px; font-size: 0.8rem; word-break: break-all;">${window.location.href}</code>`,
        'fas fa-share-alt'
      );
    });
  }
};

// View menu function
window.viewMenu = function() {
  const restaurant = getCurrentRestaurant();
  
  showPopup(
    'Meniu Restaurant',
    `Meniul pentru <strong>${restaurant.name}</strong> va fi disponibil în curând! <br><br>Pentru moment, poți suna la restaurant pentru a afla mai multe detalii despre preparatele disponibile.`,
    'fas fa-utensils'
  );
};

// Go back function
window.goBack = function() {
  // Check if there's history to go back to
  if (document.referrer && document.referrer.includes(window.location.origin)) {
    history.back();
  } else {
    // Fallback to homepage
    window.location.href = 'index.html';
  }
};

// Form validation real-time feedback
function setupFormValidation() {
  const inputs = document.querySelectorAll('.form-input');
  
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      validateInput(this);
    });
    
    input.addEventListener('input', function() {
      if (this.classList.contains('error')) {
        validateInput(this);
      }
    });
  });
}

function validateInput(input) {
  const value = input.value;
  let isValid = true;
  let errorMessage = '';
  
  if (input.hasAttribute('required') && !value) {
    isValid = false;
    errorMessage = 'Acest câmp este obligatoriu';
  } else if (input.type === 'date' && value) {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      isValid = false;
      errorMessage = 'Data nu poate fi în trecut';
    }
  }
  
  // Remove existing error message
  const existingError = input.parentNode.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Update input styling
  input.classList.remove('success', 'error');
  
  if (!isValid) {
    input.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = errorMessage;
    input.parentNode.appendChild(errorDiv);
  } else if (value) {
    input.classList.add('success');
  }
  
  return isValid;
}

// Helper function to get current restaurant data
function getCurrentRestaurant() {
  if (currentLocation) {
    return {
      name: currentLocation.name,
      address: currentLocation.address,
      phone: '0721 234 567', // Default phone for now
      cuisine: currentLocation.category
    };
  }
  return {
    name: 'Restaurant',
    address: '',
    phone: '0721 234 567',
    cuisine: 'Restaurant'
  };
}

// Animation and UI initialization functions
function initializeAnimations() {
  // Smooth scroll for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
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

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Observe all animatable elements
  const animatableElements = document.querySelectorAll('.restaurant-section, .info-section, .reservation-section');
  animatableElements.forEach(el => observer.observe(el));
}

function initializeNavbar() {
  // Add scroll behavior to navbar if it exists
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      
      // Hide/show navbar on scroll
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        navbar.classList.add('hidden');
      } else {
        navbar.classList.remove('hidden');
      }
      
      lastScrollY = currentScrollY;
    });
  }

  // Mobile menu toggle if it exists
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      mobileToggle.classList.toggle('active');
    });
  }
}

// Initialize everything when DOM is loaded
function initializeAll() {
  initializeReservationForm();
  setupFormValidation();
  initializeAnimations();
  initializeNavbar();
}

// Initialize everything
initializeAll();
    
// Add loading state management
window.addEventListener('load', function() {
  document.body.classList.add('loaded');
});

console.log('Restaurant page initialized successfully');
    
// Utility functions for potential future use
const RestaurantUtils = {
  // Format phone number for display
  formatPhoneNumber: function(phone) {
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  },
  
  // Check if restaurant is currently open
  isRestaurantOpen: function(schedule) {
    const now = new Date();
    const currentDay = now.toLocaleDateString('ro-RO', { weekday: 'long' });
    const dayCapitalized = currentDay.charAt(0).toUpperCase() + currentDay.slice(1);
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todaySchedule = schedule[dayCapitalized];
    if (!todaySchedule || todaySchedule.toLowerCase().includes('închis')) {
      return false;
    }
    
    const [openTime, closeTime] = todaySchedule.split(' - ').map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 100 + minutes;
    });
    
    return currentTime >= openTime && currentTime <= closeTime;
  },
  
  // Generate rating stars HTML
  generateStarsHTML: function(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
  }
};
