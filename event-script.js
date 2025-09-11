// Events Page JavaScript - AcoomH API Integration

// API endpoint (uses dev proxy when running on localhost)
const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE_URL = isLocalDev ? '/api' : 'https://api.acoomh.ro';

let currentEvent = null;
let currentEventId = null;

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
    
    // Get event ID from URL
    const eventId = getEventId();
    currentEventId = eventId;
    if (eventId) {
      loadEventDetails(eventId);
    } else {
      showError('ID-ul evenimentului nu a fost găsit în URL.');
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
              navigateWithLoading('index.html');
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
    console.error('Events page initialization error:', error);
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
async function loadEventDetails(eventId) {
  try {
    const event = await fetchEventData(eventId);
    if (!event) throw new Error('Nu s-au primit detalii despre eveniment');
    currentEvent = event;
    // Populate the page with event data
    populateEventDetails(event);
    // Hide loading overlay after everything is loaded
    setTimeout(() => {
      hideLoadingOverlay();
      setTimeout(() => { document.body.classList.add('loaded'); }, 100);
    }, 500);
  } catch (error) {
    console.error('Error loading event details:', error);
    showError(`Nu am putut încărca datele evenimentului. ${error.message}`);
    hideLoadingOverlay();
  }
}

// New: fetch event data (id optional: uses currentEventId)
async function fetchEventData(eventId) {
  const id = eventId || currentEventId || getEventId();
  if (!id) { console.warn('No event id found for fetchEventData'); return null; }
  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    if (!response.ok) {
      console.log('Failed to fetch event, status:', response.status);
      return null;
    }
    const eventData = await response.json();
    console.log('Event data received:', {
      id: eventData.id || eventData.Id,
      title: eventData.title || eventData.name || eventData.Name,
      hasPhoto: !!(eventData.photo || eventData.Photo || eventData.photoUrl),
      photoLength: eventData.photo ? (eventData.photo.length || 0) : 0,
    });
    return eventData;
  } catch (error) {
    console.error('Error fetching event data:', error);
    return null;
  }
}

// New: expose a refresh callback similar to RN onRefresh
window.refreshEvent = async function() {
  try {
    showLoadingOverlay();
    const data = await fetchEventData();
    if (data) {
      currentEvent = data;
      populateEventDetails(data);
    }
  } finally {
    hideLoadingOverlay();
  }
};

// New: delete event with confirmation (uses unauthenticated DELETE like RN snippet)
window.deleteEvent = function() {
  const id = currentEventId || getEventId();
  if (!id) return;
  const confirmed = confirm('Ești sigur că vrei să ștergi acest eveniment? Această acțiune nu poate fi anulată.');
  if (!confirmed) return;
  (async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        alert('Eveniment șters cu succes');
        // Go back or home
        if (document.referrer && document.referrer.includes(window.location.origin)) {
          history.back();
        } else {
          window.location.href = 'events.html';
        }
      } else {
        alert('Eroare: nu s-a putut șterge evenimentul');
      }
    } catch (e) {
      console.error('Error deleting event:', e);
      alert('Eroare: nu s-a putut șterge evenimentul');
    }
  })();
};

// Formatters similar to RN snippet (adapted for ro-RO date)
function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return dateString || ''; }
}

function formatTime(timeString) {
  if (!timeString) return '';
  const parts = String(timeString).split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] ?? '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = ((hours % 12) || 12).toString();
  return `${displayHour}:${minutes} ${ampm}`;
}

// Utility Functions
function getEventId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

function showError(message) {
  showPopup(
    'Eroare',
    message,
    'fas fa-exclamation-triangle'
  );
}

// Populate event details
function populateEventDetails(event) {
  // Basic info with null checking
  document.getElementById('eventName').textContent = event.Name || event.name || 'Eveniment';
  document.getElementById('eventLocation').textContent = event.Location || event.location || 'Locație necunoscută';
  document.getElementById('eventType').textContent = event.Category || event.category || 'Eveniment';
  document.getElementById('eventPrice').textContent = event.Price || event.price || 'Preț la cerere';
  
  // Event date and time
  const rawDate = event.Date || event.date || event.eventDate;
  const rawTime = event.Time || event.time || event.eventTime;
  if (rawDate) {
    document.getElementById('eventDate').textContent = formatDate(rawDate);
  }
  if (rawTime) {
    document.getElementById('eventTime').textContent = formatTime(rawTime);
  }
  
  // Description (use a default if not provided)
  const description = event.Description || event.description || 
    `Descoperă ${event.Name || event.name || 'acest eveniment'}, o experiență extraordinară care îți va oferi momente de neuitat. Alătură-te nouă pentru o seară plină de energie și divertisment în ${event.Location || event.location || 'oraș'}.`;
  document.getElementById('eventDescription').textContent = description;
  
  // Event image with photo URL handling
  const eventImage = document.getElementById('eventImage');
  
  // Check for photoUrl first (new backend format)
  if (event.photoUrl) {
    eventImage.src = event.photoUrl;
    eventImage.onerror = () => setDefaultEventImage(eventImage, event.Category || event.category);
  } else {
    // FALLBACK: Support for legacy photo field
    const photoData = event.Photo || event.photo;
    
    if (photoData) {
      try {
        let imageUrl;
        if (typeof photoData === 'string') {
          // Handle "use_photo_url" indicator
          if (photoData === 'use_photo_url') {
            imageUrl = event.photoUrl;
          }
          // Handle base64 data
          else if (photoData.startsWith('data:')) {
            imageUrl = photoData;
          } else if (photoData.startsWith('http')) {
            imageUrl = photoData;
          } else {
            imageUrl = `data:image/jpeg;base64,${photoData}`;
          }
        } else if (Array.isArray(photoData) && photoData.length > 0) {
          // Handle byte arrays
          const base64String = btoa(String.fromCharCode.apply(null, photoData));
          imageUrl = `data:image/jpeg;base64,${base64String}`;
        }
        
        if (imageUrl) {
          eventImage.src = imageUrl;
          eventImage.onerror = () => setDefaultEventImage(eventImage, event.Category || event.category);
        } else {
          setDefaultEventImage(eventImage, event.Category || event.category);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        setDefaultEventImage(eventImage, event.Category || event.category);
      }
    } else {
      setDefaultEventImage(eventImage, event.Category || event.category);
    }
  }
  eventImage.alt = event.Name || event.name || 'Event';
  
  // Tags display
  const tagsContainer = document.getElementById('eventTags');
  tagsContainer.innerHTML = '';
  
  // Add category as first tag with icon
  const categoryValue = event.category || event.Category || 'Event';
  const categoryTag = document.createElement('span');
  categoryTag.className = 'event-tag primary';
  
  // Create icon element
  const iconClass = getEventCategoryIcon(categoryValue);
  const iconElement = document.createElement('i');
  iconElement.className = iconClass;
  
  categoryTag.appendChild(iconElement);
  categoryTag.appendChild(document.createTextNode(` ${categoryValue}`));
  tagsContainer.appendChild(categoryTag);
  
  // Add other tags if available
  const tagsData = event.tags;
  if (tagsData && Array.isArray(tagsData) && tagsData.length > 0) {
    const validTags = tagsData.filter(tag => tag && tag.trim().length > 0);
    
    validTags.slice(0, 4).forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'event-tag';
      tagElement.textContent = tag;
      tagsContainer.appendChild(tagElement);
    });
    
    console.log('✅ Tags processed from API:', validTags);
  }
  
  // Schedule display
  populateEventSchedule(event);
  
  // Features based on category
  populateEventFeatures(event);
  
  // Set phone if available
  if (event.Contact && event.Contact.phone) {
    const phoneElement = document.getElementById('eventPhone');
    if (phoneElement) {
      phoneElement.textContent = event.Contact.phone;
      phoneElement.href = `tel:${event.Contact.phone.replace(/\s/g, '')}`;
    }
  } else if (event.phone) {
    const phoneElement = document.getElementById('eventPhone');
    if (phoneElement) {
      phoneElement.textContent = event.phone;
      phoneElement.href = `tel:${event.phone.replace(/\s/g, '')}`;
    }
  } else {
    // Hide phone info if not available
    const phoneElement = document.getElementById('eventPhone');
    if (phoneElement) {
      const phoneItem = phoneElement.closest('.info-item');
      if (phoneItem) {
        phoneItem.style.display = 'none';
      }
    }
  }
  
  // Update page title
  document.title = `${event.Name || event.name || 'Eveniment'} - AcoomH`;
  
  console.log('✅ Event details populated successfully:', event);
}

function populateEventSchedule(event) {
  const scheduleContainer = document.getElementById('eventSchedule');
  if (!scheduleContainer) { console.warn('Schedule container not found'); return; }
  scheduleContainer.innerHTML = '';

  const scheduleItem = document.createElement('div');
  scheduleItem.className = 'schedule-item';
  const eventDate = event.Date || event.date || event.eventDate;
  const eventTime = event.Time || event.time || event.eventTime;
  const dateText = eventDate ? formatDate(eventDate) : 'Se anunță data';
  const timeText = eventTime ? formatTime(eventTime) : 'Se anunță ora';
  scheduleItem.innerHTML = `
    <span class="schedule-day">Data evenimentului</span>
    <span class="schedule-hours">${dateText}</span>
  `;
  scheduleContainer.appendChild(scheduleItem);
  if (eventTime) {
    const timeItem = document.createElement('div');
    timeItem.className = 'schedule-item';
    timeItem.innerHTML = `
      <span class="schedule-day">Ora începerii</span>
      <span class="schedule-hours">${timeText}</span>
    `;
    scheduleContainer.appendChild(timeItem);
  }
}

function populateEventFeatures(event) {
  const featuresContainer = document.getElementById('eventFeatures');
  featuresContainer.innerHTML = '';
  
  // Base features for all events
  const baseFeatures = [
    { icon: 'fas fa-ticket-alt', name: 'Bilete online' },
    { icon: 'fas fa-credit-card', name: 'Plată cu cardul' }
  ];
  
  // Category-specific features
  const categoryFeatures = {
    'concert': [
      { icon: 'fas fa-music', name: 'Muzică live' },
      { icon: 'fas fa-volume-up', name: 'Sunet profesional' }
    ],
    'festival': [
      { icon: 'fas fa-users', name: 'Mulțime de oameni' },
      { icon: 'fas fa-utensils', name: 'Zone food' }
    ],
    'teatru': [
      { icon: 'fas fa-theater-masks', name: 'Spectacol live' },
      { icon: 'fas fa-chair', name: 'Locuri rezervate' }
    ],
    'conferință': [
      { icon: 'fas fa-microphone', name: 'Prezentări' },
      { icon: 'fas fa-wifi', name: 'WiFi gratuit' }
    ],
    'sport': [
      { icon: 'fas fa-trophy', name: 'Competiție' },
      { icon: 'fas fa-tv', name: 'Ecrane mari' }
    ]
  };
  
  const normalizedCategory = event.category && typeof event.category === 'string' 
    ? event.category.toLowerCase() 
    : 'eveniment';
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

function getEventCategoryIcon(category) {
  const categoryIcons = {
    'concert': 'fas fa-music',
    'festival': 'fas fa-star',
    'teatru': 'fas fa-theater-masks',
    'conferință': 'fas fa-microphone',
    'sport': 'fas fa-trophy',
    'club': 'fas fa-cocktail',
    'party': 'fas fa-glass-cheers'
  };
  
  if (!category || typeof category !== 'string') {
    return 'fas fa-calendar-alt'; // Default icon
  }
  
  const normalizedCategory = category.toLowerCase();
  return categoryIcons[normalizedCategory] || 'fas fa-calendar-alt';
}

function setDefaultEventImage(imageElement, category) {
  const categoryImages = {
    'concert': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'festival': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'teatru': 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'conferință': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'sport': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'club': 'https://images.unsplash.com/photo-1571266028243-d220c9f3e821?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  };
  
  const normalizedCategory = category && typeof category === 'string' 
    ? category.toLowerCase() 
    : 'concert';
  
  imageElement.src = categoryImages[normalizedCategory] || categoryImages['concert'];
}

// Initialize ticket reservation form
function initializeTicketForm() {
  // No date/time selection needed for events as they have fixed dates
  console.log('Ticket reservation form initialized');
}

// Validate ticket reservation form
function validateTicketForm() {
  const fullName = document.getElementById('fullName').value.trim();
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const email = document.getElementById('email').value.trim();
  const ticketCount = document.getElementById('ticketCount').value;
  const ticketType = document.getElementById('ticketType').value;
  
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
  
  if (!email) {
    errors.push('Introdu adresa de email');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Adresa de email nu este validă');
  }
  
  if (!ticketCount) {
    errors.push('Selectează numărul de bilete');
  }
  
  if (!ticketType) {
    errors.push('Selectează tipul de bilet');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Reserve tickets
window.reserveTickets = async function() {
  const validation = validateTicketForm();
  
  if (!validation.isValid) {
    showPopup(
      'Formular incomplet',
      validation.errors.join('<br>'),
      'fas fa-exclamation-triangle'
    );
    return;
  }
  
  if (!currentEvent) {
    showPopup(
      'Eroare',
      'Datele evenimentului nu sunt disponibile. Te rugăm să reîmprospătezi pagina.',
      'fas fa-exclamation-triangle'
    );
    return;
  }
  
  const fullName = document.getElementById('fullName').value.trim();
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const email = document.getElementById('email').value.trim();
  const ticketCount = document.getElementById('ticketCount').value;
  const ticketType = document.getElementById('ticketType').value;
  
  // Prepare ticket reservation data
  const ticketData = {
    customerName: fullName,
    customerEmail: email,
    customerPhone: phoneNumber,
    numberOfTickets: parseInt(ticketCount),
    ticketType: ticketType,
    eventId: parseInt(currentEvent.id),
    specialRequests: '',
    status: 'Pending'
  };
  
  // Show loading state
  const btn = document.querySelector('.btn-rezerva');
  const originalContent = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '<div class="loading"></div> Se procesează...';
  
  try {
    const reservation = await reserveTickets(ticketData);
    
    btn.disabled = false;
    btn.innerHTML = originalContent;
    
    const eventName = currentEvent.name || currentEvent.Name || 'Eveniment';
    const ticketText = ticketCount === '1' ? 'bilet' : 'bilete';
    
    showPopup(
      'Rezervare confirmată!',
      `Mulțumim, <strong>${fullName}</strong>!<br><br>Rezervarea pentru <strong>${ticketCount} ${ticketText}</strong> la evenimentul <strong>${eventName}</strong> a fost trimisă!<br><br>Vei fi contactat în curând pentru confirmare și detalii de plată.`,
      'fas fa-check-circle',
      true
    );
    
    // Reset form
    document.getElementById('fullName').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('email').value = '';
    document.getElementById('ticketCount').value = '';
    document.getElementById('ticketType').value = '';
    
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
      <i class="${icon}" style="font-size: 3rem; color: ${isSuccess ? 'var(--success-color)' : 'var(--event-color)'}; margin-bottom: 20px; display: block;"></i>
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
window.getDirections = function() {
  const event = getCurrentEvent();
  if (event.location) {
    const encodedLocation = encodeURIComponent(event.location);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    window.open(mapsUrl, '_blank');
  }
};

window.openMaps = function() {
  const event = getCurrentEvent();
  if (event.location) {
    const encodedLocation = encodeURIComponent(event.location);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    window.open(mapsUrl, '_blank');
  }
};

window.shareEvent = function() {
  const event = getCurrentEvent();
  const shareData = {
    title: event.name,
    text: `Descoperă ${event.name} pe AcoomH!`,
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
        'Link-ul către eveniment a fost copiat în clipboard.',
        'fas fa-copy',
        true
      );
    }).catch(() => {
      showPopup(
        'Partajare',
        `Copiază acest link pentru a partaja evenimentul:<br><br><code style="background: var(--bg-dark); padding: 8px; border-radius: 6px; font-size: 0.8rem; word-break: break-all;">${window.location.href}</code>`,
        'fas fa-share-alt'
      );
    });
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
  } else if (input.type === 'email' && value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      isValid = false;
      errorMessage = 'Adresa de email nu este validă';
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

// Helper function to get current event data
function getCurrentEvent() {
  if (currentEvent) {
    let phone = 'N/A';
    if (currentEvent.Contact && currentEvent.Contact.phone) {
      phone = currentEvent.Contact.phone;
    } else if (currentEvent.phone) {
      phone = currentEvent.phone;
    }
    
    return {
      name: currentEvent.name || currentEvent.Name || 'Eveniment',
      location: currentEvent.location || currentEvent.Location || '',
      phone: phone,
      type: currentEvent.category || currentEvent.Category || 'Eveniment'
    };
  }
  return {
    name: 'Eveniment',
    location: '',
    phone: 'N/A',
    type: 'Eveniment'
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
  const animatableElements = document.querySelectorAll('.event-section, .info-section, .reservation-section');
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
}

// Initialize everything when DOM is loaded
function initializeAll() {
  initializeTicketForm();
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

console.log('Events page initialized successfully');