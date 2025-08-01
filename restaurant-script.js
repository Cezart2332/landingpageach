// Restaurant Page JavaScript - AcoomH API Integration

// CRITICAL: Show loading overlay immediately to prevent page flipping
document.body.classList.add('loading');
const immediateOverlay = document.createElement('div');
immediateOverlay.className = 'page-loading-overlay';
immediateOverlay.id = 'pageLoadingOverlay';
immediateOverlay.innerHTML = `
  <div class="loading-spinner-container">
    <div class="modern-loading-spinner"></div>
    <div class="loading-text">
      Se încarcă<span class="loading-dots"></span>
    </div>
  </div>
`;
document.body.appendChild(immediateOverlay);

// Direct API endpoint
const API_BASE_URL = 'https://api.acoomh.ro';

let currentLocation = null;

document.addEventListener("DOMContentLoaded", function () {
  try {
    // Show loading overlay immediately when DOM is ready
    showLoadingOverlay();

    // Get location ID from URL
    const locationId = getLocationId();
    if (locationId) {
      loadLocationDetails(locationId);
    } else {
      showError('ID-ul locației nu a fost găsit în URL.');
      hideLoadingOverlay(); // FIXED: Hide loading overlay on error
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
    
    // FIXED: Ensure loading overlay is hidden after initialization
    setTimeout(() => {
      hideLoadingOverlay();
    }, 1500); // Increased timeout to ensure API calls complete
    
    // Override navigation links to use loading overlay
    setTimeout(() => {
      const navigationLinks = document.querySelectorAll('a[href*=".html"], .btn[href*=".html"], .back-button, .btn-back');
      
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
    console.error('Restaurant page initialization error:', error);
    showError('A apărut o problemă la încărcarea paginii.');
    hideLoadingOverlay(); // FIXED: Hide loading overlay on error
  }
});

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
  
  // Re-enable animations
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');
}

// Intercept page navigation to show loading overlay
function navigateWithLoading(url) {
  showLoadingOverlay();
  
  // Small delay before navigation to show loading state
  setTimeout(() => {
    window.location.href = url;
  }, 100);
}

// Show loading on page unload (when leaving page)
window.addEventListener('beforeunload', function() {
  showLoadingOverlay();
});

// API Functions
async function loadLocationDetails(locationId) {
  try {
    showLoadingState();
    
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Locația nu a fost găsită.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const location = await response.json();
    currentLocation = location;
    console.log('✅ Successfully loaded location details:', location);
    
    // Load location hours separately
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
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}/hours`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const hours = await response.json();
      currentLocation.hours = hours;
      console.log('✅ Successfully loaded location hours:', hours);
    } else {
      console.log('No hours data available for this location');
      currentLocation.hours = [];
    }
  } catch (error) {
    console.log('Could not load location hours:', error);
    currentLocation.hours = [];
  }
}

async function createReservation(reservationData) {
  try {
    // Prepare form data for the API
    const formData = new FormData();
    formData.append('customerName', reservationData.customerName);
    formData.append('customerEmail', reservationData.customerEmail);
    formData.append('customerPhone', reservationData.customerPhone);
    formData.append('reservationDate', reservationData.reservationDate);
    formData.append('reservationTime', reservationData.reservationTime);
    formData.append('numberOfPeople', reservationData.numberOfPeople.toString());
    formData.append('locationId', reservationData.locationId.toString());
    formData.append('specialRequests', reservationData.specialRequests || '');
    
    // Add userId if available (for logged-in users)
    if (reservationData.userId) {
      formData.append('userId', reservationData.userId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/reservation`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'A apărut o eroare la crearea rezervării.';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If not JSON, use the text directly if it's meaningful
        if (errorText.length < 200) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
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
  // Basic info with null checking
  document.getElementById('restaurantName').textContent = location.Name || location.name || 'Restaurant';
  document.getElementById('restaurantAddress').textContent = location.Address || location.address || 'Adresă necunoscută';
  document.getElementById('restaurantCuisine').textContent = location.Category || location.category || 'Restaurant';
  
  // Description (use a default if not provided)
  const description = location.Description || location.description || 
    `Descoperă ${location.Name || location.name || 'acest loc'}, un loc minunat cu o atmosferă unică și o experiență de neuitat. Situat în ${location.Address || location.address || 'oraș'}, oferim servicii de calitate și o experiență plăcută pentru toți vizitatorii.`;
  document.getElementById('restaurantDescription').textContent = description;
  
  // Restaurant image with better error handling
  const restaurantImage = document.getElementById('restaurantImage');
  const photoData = location.Photo || location.photo;
  
  if (photoData) {
    try {
      let imageUrl;
      if (typeof photoData === 'string') {
        // If photo is already a base64 string
        imageUrl = photoData.startsWith('data:') ? photoData : `data:image/jpeg;base64,${photoData}`;
      } else if (Array.isArray(photoData) && photoData.length > 0) {
        // If photo is an array of bytes
        const base64String = btoa(String.fromCharCode.apply(null, photoData));
        imageUrl = `data:image/jpeg;base64,${base64String}`;
      }
      
      if (imageUrl) {
        restaurantImage.src = imageUrl;
        restaurantImage.onerror = () => setDefaultImage(restaurantImage, location.Category || location.category);
      } else {
        setDefaultImage(restaurantImage, location.Category || location.category);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setDefaultImage(restaurantImage, location.Category || location.category);
    }
  } else {
    setDefaultImage(restaurantImage, location.Category || location.category);
  }
  restaurantImage.alt = location.Name || location.name || 'Restaurant';
  
  // FIXED: Tags display - properly use location's category
  const tagsContainer = document.getElementById('restaurantTags');
  tagsContainer.innerHTML = '';
  
  // Add category as first tag with icon - use the actual location category
  const categoryValue = location.category || location.Category || 'Location';
  console.log(categoryValue + "test")
  const categoryTag = document.createElement('span');
  categoryTag.className = 'restaurant-tag primary';
  
  // Create icon element properly
  const iconClass = getCategoryIcon(categoryValue);
  const iconElement = document.createElement('i');
  iconElement.className = iconClass;
  
  categoryTag.appendChild(iconElement);
  categoryTag.appendChild(document.createTextNode(` ${categoryValue}`));
  tagsContainer.appendChild(categoryTag);
  
  // Add other tags if available - check API response format
  const tagsData = location.tags; // API returns lowercase 'tags'
  if (tagsData && Array.isArray(tagsData) && tagsData.length > 0) {
    // API returns tags as an array, filter out empty strings
    const validTags = tagsData.filter(tag => tag && tag.trim().length > 0);
    
    // Display up to 4 additional tags
    validTags.slice(0, 4).forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'restaurant-tag';
      tagElement.textContent = tag;
      tagsContainer.appendChild(tagElement);
    });
    
    console.log('✅ Tags processed from API:', validTags);
  } else {
    console.log('ℹ️ No tags data available for this location');
  }
  
  // FIXED: Schedule display
  populateSchedule(location.hours);
  
  // Features based on category and available info
  populateFeatures(location);
  
  // Set phone if available from company data
  if (location.Company && location.Company.phone) {
    const phoneElement = document.getElementById('restaurantPhone');
    if (phoneElement) {
      phoneElement.textContent = location.Company.phone;
      phoneElement.href = `tel:${location.Company.phone.replace(/\s/g, '')}`;
    }
  } else if (location.phone) {
    // Check for phone directly on location
    const phoneElement = document.getElementById('restaurantPhone');
    if (phoneElement) {
      phoneElement.textContent = location.phone;
      phoneElement.href = `tel:${location.phone.replace(/\s/g, '')}`;
    }
  } else {
    // Hide phone info if not available
    const phoneElement = document.getElementById('restaurantPhone');
    if (phoneElement) {
      const phoneItem = phoneElement.closest('.info-item');
      if (phoneItem) {
        phoneItem.style.display = 'none';
      }
    }
  }
  
  // Update page title
  document.title = `${location.Name || location.name || 'Restaurant'} - AcoomH`;
  
  console.log('✅ Location details populated successfully:', location);
}

function populateSchedule(hours) {
  const scheduleContainer = document.getElementById('restaurantSchedule');
  if (!scheduleContainer) {
    console.warn('Schedule container not found');
    return;
  }
  
  scheduleContainer.innerHTML = '';
  
  const today = new Date();
  const todayDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Map day numbers to day names (API uses day names)
  const dayNamesRo = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  console.log('Processing schedule with hours:', hours);
  
  if (hours && Array.isArray(hours) && hours.length > 0) {
    // Use actual hours from API
    dayNamesRo.forEach((dayRo, index) => {
      const dayEn = dayNamesEn[index];
      
      // Find hours for this day (check both Romanian and English day names)
      const dayHour = hours.find(h => 
        h.DayOfWeek === dayRo || 
        h.DayOfWeek === dayEn ||
        h.dayOfWeek === dayRo ||
        h.dayOfWeek === dayEn
      );
      
      const scheduleItem = document.createElement('div');
      scheduleItem.className = 'schedule-item';
      
      const isToday = index === todayDay;
      let hoursText = 'Nedisponibil';
      let isClosed = true;
      
      if (dayHour) {
        if (dayHour.IsClosed || dayHour.isClosed) {
          hoursText = 'Închis';
          isClosed = true;
        } else if (dayHour.OpenTime || dayHour.openTime) {
          const openTime = dayHour.OpenTime || dayHour.openTime;
          const closeTime = dayHour.CloseTime || dayHour.closeTime;
          hoursText = `${openTime} - ${closeTime}`;
          isClosed = false;
        }
      }
      
      scheduleItem.innerHTML = `
        <span class="schedule-day">${dayRo}</span>
        <span class="schedule-hours ${isClosed ? 'closed' : ''} ${isToday ? 'current-day' : ''}">${hoursText}</span>
      `;
      
      scheduleContainer.appendChild(scheduleItem);
    });
    
    console.log('✅ Schedule populated from API data');
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
    
    Object.entries(defaultSchedule).forEach(([dayRo, hoursText], index) => {
      const scheduleItem = document.createElement('div');
      scheduleItem.className = 'schedule-item';
      scheduleItem.innerHTML = `
        <span class="schedule-day">${dayRo}</span>
        <span class="schedule-hours">${hoursText}</span>
      `;
      
      scheduleContainer.appendChild(scheduleItem);
    });
    
    console.log('✅ Default schedule populated');
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
    'cafenea': [
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
  
  // Add null checking for category here too
  const normalizedCategory = location.category && typeof location.category === 'string' 
    ? location.category.toLowerCase() 
    : 'restaurant';
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
    'cafenea': 'fas fa-coffee',
    'pub': 'fas fa-beer',
    'club': 'fas fa-music',
    'bar': 'fas fa-cocktail'
  };
  
  // Add null checking for category
  if (!category || typeof category !== 'string') {
    return 'fas fa-store'; // Default icon
  }
  
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

// View menu function - FIXED to use actual API endpoint
window.viewMenu = async function() {
  if (!currentLocation) {
    showPopup(
      'Eroare',
      'Datele locației nu sunt disponibile. Te rugăm să reîmprospătezi pagina.',
      'fas fa-exclamation-triangle'
    );
    return;
  }

  const restaurant = getCurrentRestaurant();
  
  // Show loading state
  showPopup(
    'Se încarcă meniul...',
    '<div class="loading" style="margin: 20px auto;"></div>',
    'fas fa-utensils'
  );

  try {
    const response = await fetch(`${API_BASE_URL}/locations/${currentLocation.id}/menu`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf,*/*'
      }
    });

    // Close loading popup
    const existingPopups = document.querySelectorAll('.popup-overlay');
    existingPopups.forEach(popup => popup.remove());

    if (response.ok) {
      // Get the PDF blob
      const blob = await response.blob();
      
      if (blob.size > 0) {
        // Create a URL for the PDF blob
        const pdfUrl = URL.createObjectURL(blob);
        
        // Open PDF in a new tab/window
        const newWindow = window.open(pdfUrl, '_blank');
        
        if (newWindow) {
          newWindow.document.title = `Meniu - ${restaurant.name}`;
          
          showPopup(
            'Meniu deschis!',
            `Meniul pentru <strong>${restaurant.name}</strong> s-a deschis într-o fereastră nouă.`,
            'fas fa-check-circle',
            true
          );
        } else {
          // Fallback: create download link
          const downloadLink = document.createElement('a');
          downloadLink.href = pdfUrl;
          downloadLink.download = `Meniu-${restaurant.name.replace(/\s+/g, '-')}.pdf`;
          downloadLink.click();
          
          showPopup(
            'Meniu descărcat!',
            `Meniul pentru <strong>${restaurant.name}</strong> a fost descărcat pe dispozitivul tău.`,
            'fas fa-download',
            true
          );
        }
        
        // Clean up the blob URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 60000);
        
      } else {
        throw new Error('Fișierul meniu este gol');
      }
    } else if (response.status === 404) {
      const currentPhone = getCurrentRestaurant().phone;
      const phoneDisplay = currentPhone && currentPhone !== 'N/A' 
        ? `<strong><a href="tel:${currentPhone.replace(/\s/g, '')}" style="color: var(--primary-color);">📞 ${currentPhone}</a></strong>`
        : 'restaurant direct';
        
      showPopup(
        'Meniu indisponibil',
        `Meniul pentru <strong>${restaurant.name}</strong> nu este disponibil momentan.<br><br>Te rugăm să contactezi ${phoneDisplay} pentru informații despre preparatele disponibile.`,
        'fas fa-info-circle'
      );
    } else {
      throw new Error(`Eroare server: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error loading menu:', error);
    
    // Close any existing popups
    const existingPopups = document.querySelectorAll('.popup-overlay');
    existingPopups.forEach(popup => popup.remove());
    
    const currentPhone = getCurrentRestaurant().phone;
    const phoneDisplay = currentPhone && currentPhone !== 'N/A'
      ? `<strong><a href="tel:${currentPhone.replace(/\s/g, '')}" style="color: var(--primary-color);">📞 ${currentPhone}</a></strong>`
      : 'restaurant direct';
    
    showPopup(
      'Eroare la încărcarea meniului',
      `Nu am putut încărca meniul pentru <strong>${restaurant.name}</strong>.<br><br>Te rugăm să încerci din nou mai târziu sau să contactezi ${phoneDisplay} pentru informații despre preparate.`,
      'fas fa-exclamation-triangle'
    );
  }
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
    // Get phone from company data or location data
    let phone = 'N/A';
    if (currentLocation.Company && currentLocation.Company.phone) {
      phone = currentLocation.Company.phone;
    } else if (currentLocation.phone) {
      phone = currentLocation.phone;
    }
    
    return {
      name: currentLocation.name || currentLocation.Name || 'Restaurant',
      address: currentLocation.address || currentLocation.Address || '',
      phone: phone,
      cuisine: currentLocation.category || currentLocation.Category || 'Restaurant'
    };
  }
  return {
    name: 'Restaurant',
    address: '',
    phone: 'N/A',
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
