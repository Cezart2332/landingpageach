// Restaurant Page JavaScript - AcoomH API Integration

// Direct API endpoint
const API_BASE_URL = 'https://api.acoomh.ro';

let currentLocation = null;

document.addEventListener('DOMContentLoaded', function() {
  try {
    // CRITICAL: Immediately set body to loading state to prevent content flash
    document.body.classList.add('loading');
    document.body.classList.remove('loaded');
    
    // Use the existing loading overlay from HTML instead of creating a new one
    const existingOverlay = document.getElementById('immediateLoadingOverlay');
    if (existingOverlay) {
      existingOverlay.id = 'pageLoadingOverlay'; // Rename to match our functions
      // Ensure overlay is visible immediately
      existingOverlay.style.opacity = '1';
      existingOverlay.style.visibility = 'visible';
    }
    
    // Get location ID from URL
    const locationId = getLocationId();
    if (locationId) {
      loadLocationDetails(locationId);
    } else {
      showError('ID-ul locației nu a fost găsit în URL.');
      hideLoadingOverlay();
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
      }, 1500); // Increased delay to ensure page is fully loaded
    }
    
    // Override navigation links to use loading overlay
    setTimeout(() => {
      const navigationLinks = document.querySelectorAll('a[href*=".html"], .btn[href*=".html"], .back-button, .btn-back');
      
      navigationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href') || this.getAttribute('onclick');
          
          // Handle onclick navigation
          if (this.hasAttribute('onclick')) {
            const onclickValue = this.getAttribute('onclick');
            if (onclickValue.includes('goBack()')) {
              e.preventDefault();
              navigateWithLoading('rezervari.html');
              return;
            }
          }
          
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
    hideLoadingOverlay();
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
    // Smoothly fade out the overlay
    overlay.style.transition = 'opacity 0.5s ease, visibility 0.5s ease';
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    overlay.style.pointerEvents = 'none';
    
    // Remove overlay after transition
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 500);
  }
  
  // Re-enable animations and show content
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');
}

// Intercept page navigation to show loading overlay
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

// API Functions
async function loadLocationDetails(locationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const location = await response.json();
    currentLocation = location;

    // Populate the page with location data
    populateLocationDetails(location);

    // Load additional data
    await loadLocationHours(locationId);

    console.log('✅ Successfully loaded location details:', location);
    
    // FIXED: Hide loading overlay after everything is loaded
    setTimeout(() => {
      hideLoadingOverlay();
      // CRITICAL: Show content only after overlay is hidden
      setTimeout(() => {
        document.body.classList.add('loaded');
      }, 100);
    }, 500);

  } catch (error) {
    console.error('Error loading location details:', error);
    showError(`Nu am putut încărca datele restaurantului. ${error.message}`);
    hideLoadingOverlay(); // FIXED: Hide loading overlay on error
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
      
      // FIXED: Re-populate time slots after hours are loaded
      const dateInput = document.getElementById('reservationDate');
      if (dateInput && dateInput.value) {
        populateTimeSlots(dateInput.value);
      }
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
  
  // Restaurant image with NEW photo URL handling
  const restaurantImage = document.getElementById('restaurantImage');
  
  // NEW: Check for photoUrl first (new backend format)
  if (location.photoUrl) {
    restaurantImage.src = location.photoUrl;
    restaurantImage.onerror = () => setDefaultImage(restaurantImage, location.Category || location.category);
  } else {
    // FALLBACK: Support for legacy photo field
    const photoData = location.Photo || location.photo;
    
    if (photoData) {
      try {
        let imageUrl;
        if (typeof photoData === 'string') {
          // NEW: Handle "use_photo_url" indicator
          if (photoData === 'use_photo_url') {
            imageUrl = location.photoUrl;
          }
          // LEGACY: Handle base64 data
          else if (photoData.startsWith('data:')) {
            imageUrl = photoData;
          } else if (photoData.startsWith('http')) {
            imageUrl = photoData;
          } else {
            imageUrl = `data:image/jpeg;base64,${photoData}`;
          }
        } else if (Array.isArray(photoData) && photoData.length > 0) {
          // LEGACY: Handle byte arrays
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

function setDefaultImage(imageElement, category) {
  const categoryImages = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'cafenea': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'pub': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'club': 'https://images.unsplash.com/photo-1571266028243-d220c9f3e821?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'bar': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  };
  
  const normalizedCategory = category && typeof category === 'string' 
    ? category.toLowerCase() 
    : 'restaurant';
  
  imageElement.src = categoryImages[normalizedCategory] || categoryImages['restaurant'];
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
  const timeSelect = document.getElementById('reservationTime');
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
  
  // Populate time slots when date changes or when form is initialized
  dateInput.addEventListener('change', function() {
    populateTimeSlots(this.value);
  });
  
  // Initial population of time slots for tomorrow
  populateTimeSlots(dateInput.value);
}

// Generate time slots with 15-minute intervals based on restaurant hours
function populateTimeSlots(selectedDate) {
  const timeSelect = document.getElementById('reservationTime');
  const currentValue = timeSelect.value; // Preserve current selection if possible
  
  // Clear existing options
  timeSelect.innerHTML = '<option value="">Selectează ora</option>';
  
  if (!selectedDate || !currentLocation) {
    generateDefaultTimeSlots(timeSelect);
    return;
  }
  
  // FIXED: If hours array exists but is empty, OR if hours don't exist, use default slots
  if (!currentLocation.hours || currentLocation.hours.length === 0) {
    generateDefaultTimeSlots(timeSelect);
    return;
  }
  
  // Get the day of week for the selected date
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesRo = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const dayOfWeek = selectedDateObj.getDay();
  const dayNameEn = dayNames[dayOfWeek];
  const dayNameRo = dayNamesRo[dayOfWeek];
  
  // Find the hours for this day
  const dayHour = currentLocation.hours.find(h => 
    h.DayOfWeek === dayNameRo || 
    h.DayOfWeek === dayNameEn ||
    h.dayOfWeek === dayNameRo ||
    h.dayOfWeek === dayNameEn
  );
  
  if (!dayHour || dayHour.IsClosed || dayHour.isClosed) {
    // FIXED: Instead of showing "closed", use default slots when no hours are found for specific day
    generateDefaultTimeSlots(timeSelect);
    return;
  }
  
  // Get opening and closing times
  const openTime = dayHour.OpenTime || dayHour.openTime;
  const closeTime = dayHour.CloseTime || dayHour.closeTime;
  
  if (!openTime || !closeTime) {
    generateDefaultTimeSlots(timeSelect);
    return;
  }
  
  // Generate time slots with 15-minute intervals
  generateTimeSlots(timeSelect, openTime, closeTime, selectedDate);
  
  // Restore previous selection if still valid
  if (currentValue && timeSelect.querySelector(`option[value="${currentValue}"]`)) {
    timeSelect.value = currentValue;
  }
}

// Generate time slots between opening and closing times
function generateTimeSlots(selectElement, openTime, closeTime, selectedDate) {
  const slots = [];
  const now = new Date();
  const isToday = selectedDate === now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Parse opening time
  const [openHour, openMinute] = openTime.split(':').map(Number);
  // Parse closing time  
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  // Start from opening time
  let slotHour = openHour;
  let slotMinute = openMinute;
  
  // Round opening time to next 15-minute interval if needed
  const remainder = slotMinute % 15;
  if (remainder !== 0) {
    slotMinute += (15 - remainder);
    if (slotMinute >= 60) {
      slotMinute = 0;
      slotHour += 1;
    }
  }
  
  // Generate slots until closing time (minus 1 hour for last reservation)
  let endHour = closeHour;
  let endMinute = closeMinute;
  
  // Last reservation should be at least 1 hour before closing
  if (endMinute >= 60) {
    endHour += 1;
    endMinute -= 60;
  } else {
    endHour -= 1;
    endMinute += 0;
  }
  
  while (slotHour < endHour || (slotHour === endHour && slotMinute <= endMinute)) {
    // Skip past times if it's today
    if (isToday) {
      const slotTotalMinutes = slotHour * 60 + slotMinute;
      const currentTotalMinutes = currentHour * 60 + currentMinute + 60; // Add 1 hour buffer for today
      
      if (slotTotalMinutes < currentTotalMinutes) {
        // Move to next slot
        slotMinute += 15;
        if (slotMinute >= 60) {
          slotMinute = 0;
          slotHour += 1;
        }
        continue;
      }
    }
    
    // Format time as HH:MM
    const timeString = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
    
    // Create option element
    const option = document.createElement('option');
    option.value = timeString;
    option.textContent = timeString;
    selectElement.appendChild(option);
    
    // Move to next 15-minute slot
    slotMinute += 15;
    if (slotMinute >= 60) {
      slotMinute = 0;
      slotHour += 1;
    }
  }
  
  // If no slots were generated, show a message
  if (selectElement.children.length === 1) { // Only the default "Selectează ora" option
    const noSlotsOption = document.createElement('option');
    noSlotsOption.value = '';
    noSlotsOption.textContent = isToday ? 'Nu mai sunt ore disponibile astăzi' : 'Nu sunt ore disponibile';
    noSlotsOption.disabled = true;
    selectElement.appendChild(noSlotsOption);
  }
}

// Fallback function for default time slots when no hours data is available
function generateDefaultTimeSlots(selectElement) {
  const defaultSlots = [
    '12:00', '12:15', '12:30', '12:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '18:00', '18:15', '18:30', '18:45',
    '19:00', '19:15', '19:30', '19:45',
    '20:00', '20:15', '20:30', '20:45',
    '21:00', '21:15', '21:30', '21:45'
  ];
  
  const now = new Date();
  const isToday = document.getElementById('reservationDate').value === now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  defaultSlots.forEach(timeStr => {
    // Skip past times if it's today
    if (isToday) {
      const [hour, minute] = timeStr.split(':').map(Number);
      const slotTotalMinutes = hour * 60 + minute;
      const currentTotalMinutes = currentHour * 60 + currentMinute + 60; // Add 1 hour buffer
      
      if (slotTotalMinutes < currentTotalMinutes) {
        return; // Skip this slot
      }
    }
    
    const option = document.createElement('option');
    option.value = timeStr;
    option.textContent = timeStr;
    selectElement.appendChild(option);
  });
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
