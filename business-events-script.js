// Business Events Management Script - AcoomH API Integration
document.addEventListener('DOMContentLoaded', () => {
  // CRITICAL: Show loading overlay immediately
  document.body.classList.add('loading');
  
  // API Configuration
  const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const API_BASE_URL = isLocalDev ? '/api' : 'https://api.acoomh.ro';

  // Global state
  let allEvents = [];
  let filteredEvents = [];
  let userLocations = [];
  let currentFilter = 'all';
  let currentSearchTerm = '';
  let currentLocationFilter = 'all';
  let editingEvent = null;
  let currentTags = [];

  // DOM Elements
  const elements = {
    statsRow: document.getElementById('statsRow'),
    filterTabs: document.getElementById('filterTabs'),
    searchInput: document.getElementById('searchInput'),
    locationFilter: document.getElementById('locationFilter'),
    eventsGrid: document.getElementById('eventsGrid'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    emptyState: document.getElementById('emptyState'),
    
    // Modal elements
    eventModal: document.getElementById('eventModal'),
    eventForm: document.getElementById('eventForm'),
    modalTitle: document.getElementById('modalTitle'),
    deleteModal: document.getElementById('deleteModal'),
    deleteEventName: document.getElementById('deleteEventName'),
    
    // Form elements
    eventName: document.getElementById('eventName'),
    ownLocationRadio: document.getElementById('ownLocation'),
    otherLocationRadio: document.getElementById('otherLocation'),
    ownLocationSelector: document.getElementById('ownLocationSelector'),
    otherLocationInput: document.getElementById('otherLocationInput'),
    customLocationName: document.getElementById('customLocationName'),
    customLocationAddress: document.getElementById('customLocationAddress'),
    eventCategory: document.getElementById('eventCategory'),
    eventDescription: document.getElementById('eventDescription'),
    eventDate: document.getElementById('eventDate'),
    eventTime: document.getElementById('eventTime'),
    eventDuration: document.getElementById('eventDuration'),
    eventCapacity: document.getElementById('eventCapacity'),
    hasPaidTickets: document.getElementById('hasPaidTickets'),
    ticketPrice: document.getElementById('ticketPrice'),
    earlyBirdPrice: document.getElementById('earlyBirdPrice'),
    earlyBirdDeadline: document.getElementById('earlyBirdDeadline'),
    eventTags: document.getElementById('eventTags'),
    eventImage: document.getElementById('eventImage'),
    specialInstructions: document.getElementById('specialInstructions'),
    isPromoted: document.getElementById('isPromoted'),
    tagsPreview: document.getElementById('tagsPreview'),
    imageUploadArea: document.getElementById('imageUploadArea'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    removeImage: document.getElementById('removeImage'),
    ticketPricing: document.getElementById('ticketPricing')
  };

  // Initialize the page
  async function initialize() {
    try {
      setupEventListeners();
      await loadUserLocations();
      await loadBusinessEvents();
      updateStatistics();
      hideLoadingOverlay();
    } catch (error) {
      console.error('Error initializing business events page:', error);
      showErrorState('Nu s-au putut încărca datele. Încearcă din nou.');
      hideLoadingOverlay();
    }
  }

  // API Functions
  async function loadUserLocations() {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const locations = await response.json();
        userLocations = Array.isArray(locations) ? locations : locations.data || [];
        populateLocationFilter();
        console.log('✅ Successfully loaded user locations:', userLocations.length);
      } else {
        console.warn('Could not load user locations, using fallback mock data');
        userLocations = generateMockLocations();
        populateLocationFilter();
      }
    } catch (error) {
      console.error('Error loading user locations:', error);
      console.warn('Using fallback mock locations for demonstration');
      userLocations = generateMockLocations();
      populateLocationFilter();
    }
  }

  // Mock locations generator for demonstration
  function generateMockLocations() {
    return [
      { id: 1, name: 'Central Bistro', address: 'Str. Centrală Nr. 15, București' },
      { id: 2, name: 'Urban Roast', address: 'Bd. Magheru Nr. 28, București' },
      { id: 3, name: 'Garden Lounge', address: 'Str. Florilor Nr. 42, București' }
    ];
  }

  async function loadBusinessEvents() {
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
      const events = responseData.data || responseData || [];

      if (!Array.isArray(events)) {
        throw new Error('API response is not a valid events array');
      }

      allEvents = events;
      filteredEvents = events;
      
      displayEvents();
      hideLoadingState();
      
      console.log('✅ Successfully loaded business events:', events.length);
      
    } catch (error) {
      console.error('Error loading business events:', error);
      
      // Fallback to mock data for demonstration
      allEvents = generateMockEvents();
      filteredEvents = allEvents;
      displayEvents();
      hideLoadingState();
      
      console.log('🔄 Using mock data for demonstration');
    }
  }

  async function createEvent(eventData) {
    try {
      const formData = new FormData();
      
      // Basic information
      formData.append('name', eventData.name);
      formData.append('description', eventData.description);
      formData.append('category', eventData.category);
      formData.append('locationId', eventData.locationId.toString());
      
      // Date and time
      formData.append('eventDate', eventData.eventDate);
      formData.append('eventTime', eventData.eventTime);
      formData.append('duration', eventData.duration || '2');
      formData.append('capacity', eventData.capacity || '50');
      
      // Pricing
      formData.append('isPaid', eventData.isPaid ? 'true' : 'false');
      if (eventData.isPaid) {
        formData.append('ticketPrice', eventData.ticketPrice.toString());
        if (eventData.earlyBirdPrice) {
          formData.append('earlyBirdPrice', eventData.earlyBirdPrice.toString());
        }
        if (eventData.earlyBirdDeadline) {
          formData.append('earlyBirdDeadline', eventData.earlyBirdDeadline);
        }
      }
      
      // Additional info
      if (eventData.tags && eventData.tags.length > 0) {
        formData.append('tags', JSON.stringify(eventData.tags));
      }
      if (eventData.specialInstructions) {
        formData.append('specialInstructions', eventData.specialInstructions);
      }
      formData.append('isPromoted', eventData.isPromoted ? 'true' : 'false');
      
      // Image
      if (eventData.imageFile) {
        formData.append('eventImage', eventData.imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create event');
      }

      const newEvent = await response.json();
      console.log('✅ Successfully created event:', newEvent);
      return newEvent;
      
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async function updateEvent(eventId, eventData) {
    try {
      const formData = new FormData();
      
      // Add all the same fields as createEvent
      formData.append('name', eventData.name);
      formData.append('description', eventData.description);
      formData.append('category', eventData.category);
      formData.append('locationId', eventData.locationId.toString());
      formData.append('eventDate', eventData.eventDate);
      formData.append('eventTime', eventData.eventTime);
      formData.append('duration', eventData.duration || '2');
      formData.append('capacity', eventData.capacity || '50');
      formData.append('isPaid', eventData.isPaid ? 'true' : 'false');
      
      if (eventData.isPaid) {
        formData.append('ticketPrice', eventData.ticketPrice.toString());
        if (eventData.earlyBirdPrice) {
          formData.append('earlyBirdPrice', eventData.earlyBirdPrice.toString());
        }
        if (eventData.earlyBirdDeadline) {
          formData.append('earlyBirdDeadline', eventData.earlyBirdDeadline);
        }
      }
      
      if (eventData.tags && eventData.tags.length > 0) {
        formData.append('tags', JSON.stringify(eventData.tags));
      }
      if (eventData.specialInstructions) {
        formData.append('specialInstructions', eventData.specialInstructions);
      }
      formData.append('isPromoted', eventData.isPromoted ? 'true' : 'false');
      
      if (eventData.imageFile) {
        formData.append('eventImage', eventData.imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update event');
      }

      const updatedEvent = await response.json();
      console.log('✅ Successfully updated event:', updatedEvent);
      return updatedEvent;
      
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async function deleteEvent(eventId) {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Successfully deleted event:', eventId);
      return true;
      
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Mock data generator for demonstration
  function generateMockEvents() {
    const mockLocations = userLocations.length > 0 ? userLocations : [
      { id: 1, name: 'Central Bistro' },
      { id: 2, name: 'Urban Roast' },
      { id: 3, name: 'Garden Lounge' }
    ];

    return [
      {
        id: 1,
        name: 'Jazz Night Live',
        description: 'O seară de jazz autentic cu muzicieni locali și internațional. Atmosferă intimă și cocktailuri speciale.',
        category: 'concert',
        locationId: mockLocations[0]?.id || 1,
        locationName: mockLocations[0]?.name || 'Central Bistro',
        eventDate: '2025-09-15',
        eventTime: '20:00',
        duration: '3',
        capacity: '80',
        isPaid: true,
        ticketPrice: 35,
        earlyBirdPrice: 25,
        earlyBirdDeadline: '2025-09-10',
        tags: ['jazz', 'live music', 'cocktails', 'weekend'],
        specialInstructions: 'Cod vestimentar smart casual recomandat',
        isPromoted: true,
        status: 'upcoming',
        ticketsSold: 23,
        imageUrl: 'https://picsum.photos/seed/jazz1/400/300'
      },
      {
        id: 2,
        name: 'Degustare de Vinuri',
        description: 'Descoperiți cele mai fine vinuri românești într-o degustare ghidată de experți sommelieri.',
        category: 'degustare',
        locationId: mockLocations[1]?.id || 2,
        locationName: mockLocations[1]?.name || 'Urban Roast',
        eventDate: '2025-09-20',
        eventTime: '19:00',
        duration: '2',
        capacity: '30',
        isPaid: true,
        ticketPrice: 50,
        tags: ['vin', 'degustare', 'sommelier'],
        isPromoted: true,
        status: 'upcoming',
        ticketsSold: 15,
        imageUrl: 'https://picsum.photos/seed/wine1/400/300'
      },
      {
        id: 3,
        name: 'Karaoke Night',
        description: 'Săptămânal în fiecare vineri! Cântă hiturile tale preferate într-o atmosferă relaxată.',
        category: 'karaoke',
        locationId: mockLocations[2]?.id || 3,
        locationName: mockLocations[2]?.name || 'Garden Lounge',
        eventDate: '2025-09-06',
        eventTime: '21:00',
        duration: '4',
        capacity: '60',
        isPaid: false,
        tags: ['karaoke', 'weekend', 'fun'],
        isPromoted: false,
        status: 'past',
        ticketsSold: 0,
        imageUrl: 'https://picsum.photos/seed/karaoke1/400/300'
      }
    ];
  }

  // Display Functions
  function showLoadingState() {
    elements.loadingState.style.display = 'flex';
    elements.errorState.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.eventsGrid.style.display = 'none';
  }

  function showErrorState(message) {
    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'flex';
    elements.emptyState.style.display = 'none';
    elements.eventsGrid.style.display = 'none';
    document.getElementById('errorMessage').textContent = message;
  }

  function hideLoadingState() {
    elements.loadingState.style.display = 'none';
  }

  function displayEvents() {
    const events = getFilteredEvents();
    
    if (events.length === 0) {
      elements.loadingState.style.display = 'none';
      elements.errorState.style.display = 'none';
      elements.emptyState.style.display = 'flex';
      elements.eventsGrid.style.display = 'none';
      return;
    }

    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.eventsGrid.style.display = 'grid';

    // Clear and populate events grid
    elements.eventsGrid.innerHTML = '';
    events.forEach(event => {
      const eventCard = createEventCard(event);
      elements.eventsGrid.appendChild(eventCard);
    });
  }

  function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-event-id', event.id);

    const statusClass = getStatusClass(event.status);
    const statusLabel = getStatusLabel(event.status);
    const eventDateTime = formatEventDateTime(event.eventDate, event.eventTime);
    const tags = event.tags || [];

    card.innerHTML = `
      <div class="event-image">
        <img src="${event.imageUrl || getDefaultEventImage(event.category)}" alt="${event.name}" loading="lazy" />
        <div class="event-status-badge ${statusClass}">${statusLabel}</div>
      </div>
      <div class="event-content">
        <div class="event-header">
          <h3 class="event-name">${event.name}</h3>
          <div class="event-location">
            <i class="fas fa-location-dot"></i>
            <span>${event.locationName || 'Locație necunoscută'}</span>
          </div>
          <div class="event-date">
            <i class="fas fa-calendar"></i>
            <span>${eventDateTime}</span>
          </div>
        </div>
        
        ${tags.length > 0 ? `
          <div class="event-tags">
            ${tags.slice(0, 3).map(tag => `<span class="event-tag">${tag}</span>`).join('')}
            ${tags.length > 3 ? `<span class="event-tag">+${tags.length - 3}</span>` : ''}
          </div>
        ` : ''}
        
        <div class="event-stats">
          <div class="event-stat">
            <i class="fas fa-users"></i>
            <span>${event.capacity || 'N/A'} max</span>
          </div>
          <div class="event-stat">
            <i class="fas fa-ticket-alt"></i>
            <span>${event.ticketsSold || 0} vândute</span>
          </div>
          <div class="event-stat">
            <i class="fas fa-euro-sign"></i>
            <span>${event.isPaid ? (event.ticketPrice + ' RON') : 'Gratuit'}</span>
          </div>
        </div>
        
        <div class="event-actions">
          <button class="btn-view" onclick="viewEventDetails('${event.id}')">
            <i class="fas fa-eye"></i> Vezi
          </button>
          <button class="btn-icon edit" onclick="editEvent('${event.id}')" title="Editează">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn-icon delete" onclick="confirmDeleteEvent('${event.id}')" title="Șterge">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;

    return card;
  }

  // Utility Functions
  function getStatusClass(status) {
    const statusMap = {
      'upcoming': 'status-upcoming',
      'active': 'status-active',
      'past': 'status-past',
      'draft': 'status-draft'
    };
    return statusMap[status] || 'status-upcoming';
  }

  function getStatusLabel(status) {
    const labelMap = {
      'upcoming': 'Viitor',
      'active': 'Activ',
      'past': 'Trecut',
      'draft': 'Draft'
    };
    return labelMap[status] || 'Viitor';
  }

  function formatEventDateTime(date, time) {
    try {
      const eventDate = new Date(date + 'T' + time);
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return eventDate.toLocaleDateString('ro-RO', options);
    } catch (error) {
      return `${date} la ${time}`;
    }
  }

  function getDefaultEventImage(category) {
    const seed = category || 'event';
    return `https://picsum.photos/seed/${seed}/400/300`;
  }

  function determineEventStatus(eventDate, eventTime) {
    const now = new Date();
    const eventDateTime = new Date(eventDate + 'T' + eventTime);
    
    if (eventDateTime > now) {
      return 'upcoming';
    } else if (eventDateTime.toDateString() === now.toDateString()) {
      return 'active';
    } else {
      return 'past';
    }
  }

  // Filtering and Search
  function getFilteredEvents() {
    let filtered = [...allEvents];

    // Apply status filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(event => event.status === currentFilter);
    }

    // Apply location filter
    if (currentLocationFilter !== 'all') {
      filtered = filtered.filter(event => event.locationId.toString() === currentLocationFilter);
    }

    // Apply search filter
    if (currentSearchTerm) {
      const searchTerm = currentSearchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.category.toLowerCase().includes(searchTerm) ||
        (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    return filtered;
  }

  function updateStatistics() {
    const stats = {
      total: allEvents.length,
      active: allEvents.filter(e => e.status === 'active').length,
      upcoming: allEvents.filter(e => e.status === 'upcoming').length,
      ticketsSold: allEvents.reduce((sum, e) => sum + (e.ticketsSold || 0), 0)
    };

    document.getElementById('totalEvents').textContent = stats.total;
    document.getElementById('activeEvents').textContent = stats.active;
    document.getElementById('upcomingEvents').textContent = stats.upcoming;
    document.getElementById('ticketsSold').textContent = stats.ticketsSold;
  }

  function populateLocationFilter() {
    const locationSelect = elements.locationFilter;
    locationSelect.innerHTML = '<option value="all">Toate locațiile</option>';
    
    userLocations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.id;
      option.textContent = location.name || location.Name || `Locația ${location.id}`;
      locationSelect.appendChild(option);
    });
  }

  // Modal Functions
  function openEventModal(event = null) {
    editingEvent = event;
    
    if (event) {
      elements.modalTitle.textContent = 'Editează Eveniment';
      populateEventForm(event);
    } else {
      elements.modalTitle.textContent = 'Adaugă Eveniment';
      resetEventForm();
    }
    
    elements.eventModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeEventModal() {
    elements.eventModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetEventForm();
    editingEvent = null;
  }

  function resetEventForm() {
    elements.eventForm.reset();
    currentTags = [];
    updateTagsPreview();
    hideImagePreview();
    elements.ticketPricing.style.display = 'none';
    clearFormErrors();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    elements.eventDate.min = today;
  }

  function populateEventForm(event) {
    elements.eventName.value = event.name || '';
    elements.eventCategory.value = event.category || '';
    elements.eventDescription.value = event.description || '';
    elements.eventDate.value = event.eventDate || '';
    elements.eventTime.value = event.eventTime || '';
    elements.eventDuration.value = event.duration || '';
    elements.eventCapacity.value = event.capacity || '';
    elements.hasPaidTickets.checked = event.isPaid || false;
    elements.ticketPrice.value = event.ticketPrice || '';
    elements.earlyBirdPrice.value = event.earlyBirdPrice || '';
    elements.earlyBirdDeadline.value = event.earlyBirdDeadline || '';
    elements.specialInstructions.value = event.specialInstructions || '';
    elements.isPromoted.checked = event.isPromoted || false;
    
    // Handle location selection based on whether it's a user location or custom
    if (event.locationId && userLocations.find(l => l.id === event.locationId)) {
      // Event uses one of user's locations - select "Locația ta"
      elements.ownLocationRadio.checked = true;
      elements.otherLocationRadio.checked = false;
      
      // Set up automatic location display
      const selectedLocation = userLocations.find(l => l.id === event.locationId);
      if (selectedLocation) {
        // Create and show the location display
        createLocationDisplay(selectedLocation);
      }
      
      // Show/hide appropriate sections
      elements.ownLocationSelector.style.display = 'block';
      elements.otherLocationInput.style.display = 'none';
    } else {
      // Event uses custom location - select "Altă locație"
      elements.ownLocationRadio.checked = false;
      elements.otherLocationRadio.checked = true;
      
      // Populate custom location fields
      elements.customLocationName.value = event.customLocationName || event.locationName || '';
      elements.customLocationAddress.value = event.customLocationAddress || '';
      
      // Show/hide appropriate sections
      elements.ownLocationSelector.style.display = 'none';
      elements.otherLocationInput.style.display = 'block';
    }
    
    // Handle tags
    currentTags = event.tags || [];
    updateTagsPreview();
    
    // Handle image
    if (event.imageUrl) {
      showImagePreview(event.imageUrl);
    }
    
    // Show/hide ticket pricing
    toggleTicketPricing();
  }

  // Helper function to create location display for editing
  function createLocationDisplay(location) {
    const ownLocationSelector = elements.ownLocationSelector;
    
    // Clear existing content
    ownLocationSelector.innerHTML = '';
    
    // Create the display element
    const displayElement = document.createElement('div');
    displayElement.className = 'selected-location-display';
    displayElement.dataset.locationId = location.id;
    displayElement.innerHTML = `
      <div class="location-info">
        <i class="fas fa-location-dot"></i>
        <span>${location.name}</span>
      </div>
      <div class="location-note">Evenimentul va fi organizat la această locație</div>
    `;
    
    ownLocationSelector.appendChild(displayElement);
  }

  function validateEventForm() {
    clearFormErrors();
    const errors = [];

    console.log('🔍 Starting form validation...');

    // Required fields validation
    if (!elements.eventName.value.trim()) {
      console.log('❌ Event name is missing');
      showFieldError('eventNameError', 'Numele evenimentului este obligatoriu');
      errors.push('name');
    } else {
      console.log('✅ Event name is valid:', elements.eventName.value.trim());
    }

    // Location validation based on type
    const isOwnLocation = elements.ownLocationRadio.checked;
    console.log('📍 Location type - Own location:', isOwnLocation);
    
    if (isOwnLocation) {
      // For own location, check multiple ways to find a valid location
      let hasValidLocation = false;
      
      // Method 1: Check if we have a location display element
      const locationDisplay = elements.ownLocationSelector.querySelector('.selected-location-display');
      if (locationDisplay && locationDisplay.dataset.locationId) {
        hasValidLocation = true;
        console.log('✅ Found location display with ID:', locationDisplay.dataset.locationId);
      }
      
      // Method 2: If editing and we have the original event, check its location
      if (!hasValidLocation && editingEvent && editingEvent.locationId) {
        const originalLocation = userLocations.find(l => l.id === editingEvent.locationId);
        if (originalLocation) {
          hasValidLocation = true;
          console.log('✅ Using original event location:', editingEvent.locationId);
        }
      }
      
      // Method 3: If we have only one user location, that's valid
      if (!hasValidLocation && userLocations.length === 1) {
        hasValidLocation = true;
        console.log('✅ Using single user location:', userLocations[0].id);
      }
      
      if (!hasValidLocation) {
        console.log('❌ No valid location found for own location option');
        console.log('User locations:', userLocations);
        console.log('Editing event:', editingEvent);
        showFieldError('eventLocationError', 'Selectează o locație sau adaugă o locație în secțiunea Locații');
        errors.push('location');
      }
    } else {
      // Custom location validation
      if (!elements.customLocationName.value.trim()) {
        console.log('❌ Custom location name is missing');
        showFieldError('customLocationError', 'Numele locației este obligatoriu');
        errors.push('customLocationName');
      } else {
        console.log('✅ Custom location name is valid:', elements.customLocationName.value.trim());
      }
      
      if (!elements.customLocationAddress.value.trim()) {
        console.log('❌ Custom location address is missing');
        showFieldError('customLocationError', 'Adresa locației este obligatorie');
        errors.push('customLocationAddress');
      } else {
        console.log('✅ Custom location address is valid:', elements.customLocationAddress.value.trim());
      }
    }

    if (!elements.eventCategory.value) {
      console.log('❌ Event category is missing');
      showFieldError('eventCategoryError', 'Selectează o categorie');
      errors.push('category');
    } else {
      console.log('✅ Event category is valid:', elements.eventCategory.value);
    }

    if (!elements.eventDescription.value.trim()) {
      console.log('❌ Event description is missing');
      showFieldError('eventDescriptionError', 'Descrierea este obligatorie');
      errors.push('description');
    } else {
      console.log('✅ Event description is valid');
    }

    if (!elements.eventDate.value) {
      console.log('❌ Event date is missing');
      showFieldError('eventDateError', 'Data evenimentului este obligatorie');
      errors.push('date');
    } else {
      console.log('✅ Event date is valid:', elements.eventDate.value);
    }

    if (!elements.eventTime.value) {
      console.log('❌ Event time is missing');
      showFieldError('eventTimeError', 'Ora de început este obligatorie');
      errors.push('time');
    } else {
      console.log('✅ Event time is valid:', elements.eventTime.value);
    }

    // Paid event validation
    if (elements.hasPaidTickets.checked) {
      if (!elements.ticketPrice.value || parseFloat(elements.ticketPrice.value) <= 0) {
        console.log('❌ Ticket price is invalid for paid event');
        showFieldError('ticketPriceError', 'Prețul biletului este obligatoriu pentru evenimente cu plată');
        errors.push('ticketPrice');
      } else {
        console.log('✅ Ticket price is valid:', elements.ticketPrice.value);
      }
    }

    // Date validation
    if (elements.eventDate.value) {
      const eventDate = new Date(elements.eventDate.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        console.log('❌ Event date is in the past');
        showFieldError('eventDateError', 'Data evenimentului nu poate fi în trecut');
        errors.push('pastDate');
      }
    }

    const isValid = errors.length === 0;
    console.log('🎯 Validation result:', isValid ? 'PASSED' : 'FAILED');
    if (!isValid) {
      console.log('❌ Validation errors:', errors);
    }

    return isValid;
  }

  function showFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  function clearFormErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(element => {
      element.style.display = 'none';
      element.textContent = '';
    });
  }

  // Event Handlers
  function setupEventListeners() {
    // Navigation
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Sigur te deconectezi?')) {
          window.location.href = 'business-auth.html';
        }
      });
    });

    // Add event buttons
    document.getElementById('addEventBtn').addEventListener('click', () => openEventModal());
    document.getElementById('addFirstEventBtn').addEventListener('click', () => openEventModal());

    // Filter tabs
    elements.filterTabs.addEventListener('click', (e) => {
      const filterBtn = e.target.closest('.filter-btn');
      if (filterBtn) {
        currentFilter = filterBtn.dataset.filter;
        updateFilterTabs();
        applyFilters();
      }
    });

    // Search
    elements.searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.trim();
      applyFilters();
    });

    // Location filter
    elements.locationFilter.addEventListener('change', (e) => {
      currentLocationFilter = e.target.value;
      applyFilters();
    });

    // Modal close handlers
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', closeEventModal);
    });

    document.querySelectorAll('[data-close-delete]').forEach(btn => {
      btn.addEventListener('click', closeDeleteModal);
    });

    // Form submission
    elements.eventForm.addEventListener('submit', handleEventFormSubmit);

    // Paid tickets toggle
    elements.hasPaidTickets.addEventListener('change', toggleTicketPricing);

    // Tags input
    elements.eventTags.addEventListener('input', handleTagsInput);
    elements.eventTags.addEventListener('keydown', handleTagsKeydown);

    // Image upload
    elements.imageUploadArea.addEventListener('click', () => elements.eventImage.click());
    elements.eventImage.addEventListener('change', handleImageUpload);
    elements.removeImage.addEventListener('click', hideImagePreview);

    // Delete confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', handleDeleteEvent);

    // Retry button
    document.getElementById('retryBtn').addEventListener('click', () => {
      loadBusinessEvents();
    });

    // Location type radio buttons
    elements.ownLocationRadio.addEventListener('change', handleLocationTypeChange);
    elements.otherLocationRadio.addEventListener('change', handleLocationTypeChange);
  }

  function updateFilterTabs() {
    elements.filterTabs.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === currentFilter);
    });
  }

  function applyFilters() {
    filteredEvents = getFilteredEvents();
    displayEvents();
  }

  function toggleTicketPricing() {
    const isChecked = elements.hasPaidTickets.checked;
    elements.ticketPricing.style.display = isChecked ? 'block' : 'none';
    
    if (!isChecked) {
      elements.ticketPrice.value = '';
      elements.earlyBirdPrice.value = '';
      elements.earlyBirdDeadline.value = '';
    }
  }

  // Location Type Management
  function handleLocationTypeChange() {
    const isOwnLocation = elements.ownLocationRadio.checked;
    
    if (isOwnLocation) {
      elements.ownLocationSelector.style.display = 'block';
      elements.otherLocationInput.style.display = 'none';
      
      // Clear custom location fields
      elements.customLocationName.value = '';
      elements.customLocationAddress.value = '';
      
      // Make custom location fields not required
      elements.customLocationName.required = false;
      elements.customLocationAddress.required = false;
    } else {
      elements.ownLocationSelector.style.display = 'none';
      elements.otherLocationInput.style.display = 'block';
      
      // Make custom location required
      elements.customLocationName.required = true;
      elements.customLocationAddress.required = true;
    }
    
    // Clear any existing errors
    clearLocationErrors();
  }

  function clearLocationErrors() {
    document.getElementById('eventLocationError').style.display = 'none';
    document.getElementById('customLocationError').style.display = 'none';
  }

  // Tags Management
  function handleTagsInput(e) {
    const value = e.target.value;
    if (value.includes(',')) {
      const newTags = value.split(',').map(tag => tag.trim()).filter(Boolean);
      newTags.forEach(tag => {
        if (tag && !currentTags.includes(tag) && currentTags.length < 10) {
          currentTags.push(tag);
        }
      });
      e.target.value = '';
      updateTagsPreview();
    }
  }

  function handleTagsKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !currentTags.includes(value) && currentTags.length < 10) {
        currentTags.push(value);
        e.target.value = '';
        updateTagsPreview();
      }
    }
    
    if (e.key === 'Backspace' && !e.target.value && currentTags.length > 0) {
      currentTags.pop();
      updateTagsPreview();
    }
  }

  function updateTagsPreview() {
    elements.tagsPreview.innerHTML = currentTags.map(tag => `
      <span class="tag-chip">
        ${tag}
        <button type="button" onclick="removeTag('${tag}')">×</button>
      </span>
    `).join('');
  }

  // Image Management
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        showImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function showImagePreview(src) {
    elements.previewImg.src = src;
    elements.imageUploadArea.style.display = 'none';
    elements.imagePreview.style.display = 'block';
  }

  function hideImagePreview() {
    elements.imageUploadArea.style.display = 'block';
    elements.imagePreview.style.display = 'none';
    elements.eventImage.value = '';
  }

  // Form Submission
  async function handleEventFormSubmit(e) {
    e.preventDefault();
    
    console.log('Form submission started...');
    
    if (!validateEventForm()) {
      console.log('Form validation failed');
      return;
    }

    const submitBtn = document.getElementById('saveEventBtn');
    const originalText = submitBtn.innerHTML;
    
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvare...';

      const isOwnLocation = elements.ownLocationRadio.checked;
      
      const eventData = {
        name: elements.eventName.value.trim(),
        description: elements.eventDescription.value.trim(),
        category: elements.eventCategory.value,
        eventDate: elements.eventDate.value,
        eventTime: elements.eventTime.value,
        duration: elements.eventDuration.value || '2',
        capacity: elements.eventCapacity.value || '50',
        isPaid: elements.hasPaidTickets.checked,
        ticketPrice: elements.hasPaidTickets.checked ? parseFloat(elements.ticketPrice.value) : 0,
        earlyBirdPrice: elements.earlyBirdPrice.value ? parseFloat(elements.earlyBirdPrice.value) : null,
        earlyBirdDeadline: elements.earlyBirdDeadline.value || null,
        tags: currentTags,
        specialInstructions: elements.specialInstructions.value.trim(),
        isPromoted: elements.isPromoted.checked,
        imageFile: elements.eventImage.files[0] || null
      };

      // Handle location based on type
      if (isOwnLocation) {
        // For own location, check multiple ways to get the location ID
        let locationId = null;
        let locationName = '';
        
        // Method 1: Check if we have a location display element
        const locationDisplay = elements.ownLocationSelector.querySelector('.selected-location-display');
        if (locationDisplay && locationDisplay.dataset.locationId) {
          locationId = parseInt(locationDisplay.dataset.locationId);
          locationName = locationDisplay.querySelector('.location-info span')?.textContent || '';
        }
        
        // Method 2: If editing and we have the original event, use its location
        if (!locationId && editingEvent && editingEvent.locationId) {
          locationId = editingEvent.locationId;
          const originalLocation = userLocations.find(l => l.id === editingEvent.locationId);
          if (originalLocation) {
            locationName = originalLocation.name || originalLocation.Name || '';
          }
        }
        
        // Method 3: If we still don't have a location, check if there's only one user location
        if (!locationId && userLocations.length === 1) {
          locationId = userLocations[0].id;
          locationName = userLocations[0].name || userLocations[0].Name || '';
        }
        
        if (!locationId) {
          throw new Error('Te rugăm să selectezi o locație sau să adaugi o locație în secțiunea Locații');
        }
        
        eventData.locationId = locationId;
        eventData.locationName = locationName;
        eventData.isCustomLocation = false;
        
        console.log('Using own location:', locationId, locationName);
      } else {
        // Custom location
        eventData.customLocationName = elements.customLocationName.value.trim();
        eventData.customLocationAddress = elements.customLocationAddress.value.trim();
        eventData.locationName = eventData.customLocationName;
        eventData.locationId = null; // No existing location ID for custom locations
        eventData.isCustomLocation = true;
        
        console.log('Using custom location:', eventData.customLocationName);
      }

      // Determine status based on date
      eventData.status = determineEventStatus(eventData.eventDate, eventData.eventTime);

      console.log('Event data prepared:', eventData);

      let result;
      if (editingEvent) {
        console.log('Updating existing event:', editingEvent.id);
        result = await updateEvent(editingEvent.id, eventData);
        // Update the event in local array
        const eventIndex = allEvents.findIndex(e => e.id === editingEvent.id);
        if (eventIndex !== -1) {
          allEvents[eventIndex] = { ...allEvents[eventIndex], ...eventData, ...result };
        }
        showNotification('Eveniment actualizat cu succes!', 'success');
      } else {
        console.log('Creating new event');
        result = await createEvent(eventData);
        // Add new event to local array
        const newEvent = { 
          ...eventData, 
          ...result, 
          id: result.id || Date.now(),
          ticketsSold: 0,
          locationName: eventData.locationName
        };
        allEvents.unshift(newEvent);
        showNotification('Eveniment creat cu succes!', 'success');
      }

      closeEventModal();
      updateStatistics();
      applyFilters();
      
    } catch (error) {
      console.error('Error saving event:', error);
      showNotification('Eroare la salvarea evenimentului: ' + error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  // Delete Functions
  function openDeleteModal(eventId) {
    const event = allEvents.find(e => e.id.toString() === eventId.toString());
    if (event) {
      elements.deleteEventName.textContent = event.name;
      elements.deleteModal.style.display = 'flex';
      elements.deleteModal.dataset.eventId = eventId;
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDeleteModal() {
    elements.deleteModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    delete elements.deleteModal.dataset.eventId;
  }

  async function handleDeleteEvent() {
    const eventId = elements.deleteModal.dataset.eventId;
    if (!eventId) return;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    
    try {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ștergere...';

      await deleteEvent(eventId);
      
      // Remove from local array
      allEvents = allEvents.filter(e => e.id.toString() !== eventId.toString());
      
      closeDeleteModal();
      updateStatistics();
      applyFilters();
      showNotification('Eveniment șters cu succes!', 'success');
      
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification('Eroare la ștergerea evenimentului: ' + error.message, 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalText;
    }
  }

  // Global Functions (called from HTML)
  window.viewEventDetails = function(eventId) {
    // Navigate to public event page
    window.open(`event.html?id=${eventId}`, '_blank');
  };

  window.editEvent = function(eventId) {
    const event = allEvents.find(e => e.id.toString() === eventId.toString());
    if (event) {
      openEventModal(event);
    }
  };

  window.confirmDeleteEvent = function(eventId) {
    openDeleteModal(eventId);
  };

  window.removeTag = function(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    updateTagsPreview();
  };

  // Notification System
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add notification styles if not already present
    if (!document.querySelector('.notification-styles')) {
      const style = document.createElement('style');
      style.className = 'notification-styles';
      style.textContent = `
        .notification {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 10000;
          padding: 16px 20px;
          border-radius: 12px;
          color: #fff;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          animation: slideInRight 0.3s ease;
        }
        .notification.success { background: var(--success); }
        .notification.error { background: var(--danger); }
        .notification.info { background: var(--info); }
        .notification-content { display: flex; align-items: center; gap: 10px; }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Loading Overlay Functions
  function hideLoadingOverlay() {
    const overlay = document.getElementById('pageLoadingOverlay') || document.getElementById('immediateLoadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => {
        document.body.classList.add('loaded');
        document.body.classList.remove('loading');
      }, 300);
    }
  }

  // Initialize everything
  initialize();
});