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
    eventDescription: document.getElementById('eventDescription'),
    eventDate: document.getElementById('eventDate'),
    eventTime: document.getElementById('eventTime'),
    eventEndTime: document.getElementById('eventEndTime'),
    eventAddress: document.getElementById('eventAddress'),
    eventCity: document.getElementById('eventCity'),
    isActive: document.getElementById('isActive'),
    eventImage: document.getElementById('eventImage'),
    imageUploadArea: document.getElementById('imageUploadArea'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
  removeImage: document.getElementById('removeImage'),
  // Optional/legacy fields (may not exist in simplified modal)
  eventTags: document.getElementById('eventTags'),
  tagsPreview: document.getElementById('tagsPreview'),
  ownLocationRadio: document.getElementById('ownLocationRadio') || document.getElementById('ownLocation'),
  otherLocationRadio: document.getElementById('otherLocationRadio') || document.getElementById('otherLocation'),
  ownLocationSelector: document.getElementById('ownLocationSelector'),
  otherLocationInput: document.getElementById('otherLocationInput'),
  customLocationName: document.getElementById('customLocationName'),
  customLocationAddress: document.getElementById('customLocationAddress')
  };

  // Helpers to unwrap API payloads and resolve company id
  function unwrapList(payload){
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.events)) return payload.events;
    return [];
  }

  async function getActiveCompanyId(){
    // Try profile first (authenticated)
    try {
      if (window.SecureApiService) {
        const resp = await window.SecureApiService.getProfile();
        const data = resp && resp.success ? resp.data : resp;
        const company = data?.company || data;
        const cid = company?.id || company?.Id;
        if (cid) return Number(cid);
      }
    } catch (e) { /* ignore */ }
    // Fallback to sessionStorage snapshot
    try {
      const cRaw = sessionStorage.getItem('company');
      if (cRaw) { const c = JSON.parse(cRaw); if (c?.id || c?.Id) return Number(c.id || c.Id); }
      const uRaw = sessionStorage.getItem('user');
      if (uRaw) { const u = JSON.parse(uRaw); if (u?.id || u?.Id) return Number(u.id || u.Id); }
    } catch(e){ console.warn('Failed to read company/user from storage:', e); }
    return null;
  }

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
      const companyId = await getActiveCompanyId();
      if (companyId && window.SecureApiService) {
        const resp = await window.SecureApiService.get(`/companies/${companyId}/locations`);
        const list = resp && resp.success ? resp.data : resp;
        userLocations = Array.isArray(list) ? list : [];
        populateLocationFilter();
        console.log('✅ Loaded company locations:', userLocations.length);
        return;
      }
      // Fallback (unauthenticated) to generic endpoint or mock
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      if (response.ok) {
        const locations = await response.json();
        userLocations = Array.isArray(locations) ? locations : locations.data || [];
        populateLocationFilter();
        console.log('✅ Loaded user locations (fallback):', userLocations.length);
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

  async function loadBusinessEvents() {
    showLoadingState();
    try {
      const companyId = await getActiveCompanyId();
      if (companyId && window.SecureApiService) {
        // Preferred: company-specific endpoint via FormData
        const fd = new FormData();
        // Send both keys for compatibility
        fd.append('id', String(companyId));
        fd.append('companyId', String(companyId));
        const resp = await window.SecureApiService.post('/companyevents', fd);
        let events = resp && resp.success ? resp.data : resp;
        events = unwrapList(events);

        if (!Array.isArray(events) || events.length === 0) {
          // Fallback: fetch all and client-filter by companyId
          const all = await window.SecureApiService.get('/events');
          let arr = all && all.success ? all.data : all;
          arr = unwrapList(arr);
          const filtered = arr.filter(ev => Number(ev.companyId || ev.CompanyId || ev.company?.id) === Number(companyId));
          allEvents = filtered.map(normalizeEvent);
          filteredEvents = [...allEvents];
        } else {
          allEvents = events.map(normalizeEvent);
          filteredEvents = [...allEvents];
        }
        updateStatistics();
        displayEvents();
        hideLoadingState();
        console.log('✅ Loaded business events:', filteredEvents.length);
        return;
      }

      // Unauthenticated fallback (rare)
      const response = await fetch(`${API_BASE_URL}/events`, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const responseData = await response.json();
  const events = responseData.data || responseData || [];
  if (!Array.isArray(events)) throw new Error('API response is not a valid events array');
  allEvents = events.map(normalizeEvent);
  filteredEvents = [...allEvents];
  updateStatistics();
  displayEvents();
  hideLoadingState();
    } catch (error) {
      console.error('Error loading business events:', error);
      // Prefer empty state over mock in authenticated flows
      allEvents = Array.isArray(allEvents) ? allEvents : [];
      filteredEvents = allEvents;
      displayEvents();
      hideLoadingState();
    }
  }

  async function createEvent(eventData) {
    try {
      const formData = new FormData();
      formData.append('title', eventData.title);
      formData.append('description', eventData.description);
      formData.append('eventDate', eventData.eventDate);
      formData.append('startTime', eventData.startTime);
      formData.append('endTime', eventData.endTime);
      formData.append('address', eventData.address);
      if (eventData.city) formData.append('city', eventData.city);
      if (eventData.companyId) formData.append('companyId', String(eventData.companyId));
      formData.append('isActive', eventData.isActive ? 'true' : 'false');
      if (eventData.imageFile) formData.append('file', eventData.imageFile);

      // Use SecureApiService for auth
      if (window.SecureApiService) {
        const resp = await window.SecureApiService.post('/events', formData);
        if (!(resp && resp.success)) { throw new Error(resp?.error || 'Failed to create event'); }
        const newEvent = resp.data || null;
        console.log('✅ Successfully created event:', newEvent);
        return newEvent;
      }

      // Fallback
      const response = await fetch(`${API_BASE_URL}/events`, { method: 'POST', body: formData });
      if (!response.ok) { const errorText = await response.text(); throw new Error(errorText || 'Failed to create event'); }
      const newEvent = await response.json();
      console.log('✅ Successfully created event (fallback):', newEvent);
      return newEvent;
    } catch (error) { console.error('Error creating event:', error); throw error; }
  }

  async function updateEvent(eventId, eventData) {
    try {
      const formData = new FormData();
      formData.append('title', eventData.title);
      formData.append('description', eventData.description);
      formData.append('eventDate', eventData.eventDate);
      formData.append('startTime', eventData.startTime);
      formData.append('endTime', eventData.endTime);
      formData.append('address', eventData.address);
      if (eventData.city) formData.append('city', eventData.city);
      if (typeof eventData.isActive === 'boolean') formData.append('isActive', eventData.isActive ? 'true' : 'false');
      if (eventData.imageFile) formData.append('file', eventData.imageFile);

      if (window.SecureApiService) {
        const resp = await window.SecureApiService.put(`/events/${eventId}`, formData);
        if (!(resp && resp.success)) { throw new Error(resp?.error || 'Failed to update event'); }
        const updatedEvent = resp.data || null;
        console.log('✅ Successfully updated event:', updatedEvent);
        return updatedEvent;
      }

      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, { method: 'PUT', body: formData });
      if (!response.ok) { const errorText = await response.text(); throw new Error(errorText || 'Failed to update event'); }
      const updatedEvent = await response.json();
      console.log('✅ Successfully updated event (fallback):', updatedEvent);
      return updatedEvent;
    } catch (error) { console.error('Error updating event:', error); throw error; }
  }

  async function deleteEvent(eventId) {
    try {
      if (window.SecureApiService) {
        const resp = await window.SecureApiService.delete(`/events/${eventId}`);
        if (!(resp && resp.success)) throw new Error(resp?.error || `HTTP ${resp?.status}`);
        console.log('✅ Successfully deleted event:', eventId);
        return true;
      }
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('✅ Successfully deleted event (fallback):', eventId);
      return true;
    } catch (error) { console.error('Error deleting event:', error); throw error; }
  }

  // Mock locations generator for demonstration
  function generateMockLocations() {
    return [
      { id: 1, name: 'Central Bistro', address: 'Str. Centrală Nr. 15, București' },
      { id: 2, name: 'Urban Roast', address: 'Bd. Magheru Nr. 28, București' },
      { id: 3, name: 'Garden Lounge', address: 'Str. Florilor Nr. 42, București' }
    ];
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

  // Normalize backend event object to UI shape
  function normalizeEvent(ev) {
    if (!ev || typeof ev !== 'object') return {};
    const id = ev.id || ev.Id || ev.eventId || ev.EventId || ev._id || String(Math.random()).slice(2);
    const name = ev.name || ev.Name || ev.title || 'Eveniment';
    const description = ev.description || ev.Description || '';
    const category = (ev.category || ev.Category || 'altele').toString().toLowerCase();
    const locationId = ev.locationId || ev.LocationId || ev.location?.id || ev.Location?.Id || null;
    const locationName = ev.locationName || ev.LocationName || ev.location?.name || ev.Location?.Name || ev.Location || 'Locație necunoscută';
    const rawDate = ev.eventDate || ev.EventDate || ev.date || ev.Date || '';
    const rawTime = ev.eventTime || ev.EventTime || ev.time || ev.Time || '';
    const eventDate = (typeof rawDate === 'string' && rawDate.includes('-')) ? rawDate : (rawDate ? new Date(rawDate).toISOString().slice(0,10) : '');
    const eventTime = (typeof rawTime === 'string' && rawTime.includes(':')) ? rawTime : (rawTime ? String(rawTime).padStart(4,'0').replace(/(\d{2})(\d{2})/,'$1:$2') : '');
    const duration = ev.duration || ev.Duration || '';
    const capacity = ev.capacity || ev.Capacity || '';
    const isPaid = !!(ev.isPaid || ev.IsPaid || ev.hasPaidTickets || ev.HasPaidTickets);
    const ticketPrice = ev.ticketPrice || ev.Price || ev.price || 0;
    const earlyBirdPrice = ev.earlyBirdPrice || ev.EarlyBirdPrice || null;
    const earlyBirdDeadline = ev.earlyBirdDeadline || ev.EarlyBirdDeadline || null;
    let tags = [];
    if (Array.isArray(ev.tags)) tags = ev.tags.map(t=>String(t));
    else if (typeof ev.tags === 'string') tags = ev.tags.split(',').map(t=>t.trim()).filter(Boolean);
    const specialInstructions = ev.specialInstructions || '';
    const isPromoted = !!(ev.isPromoted || ev.IsPromoted);
    const ticketsSold = ev.ticketsSold || ev.TicketsSold || 0;
    const imageUrl = ev.imageUrl || ev.photoUrl || ev.PhotoUrl || ev.photo || ev.Photo || '';
    const status = ev.status || determineEventStatus(eventDate || '', eventTime || '');

    return {
      id, name, description, category,
      locationId, locationName,
      eventDate, eventTime, duration, capacity,
      isPaid, ticketPrice, earlyBirdPrice, earlyBirdDeadline,
      tags, specialInstructions, isPromoted, ticketsSold,
      imageUrl, status
    };
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
    elements.imageUploadArea.style.display = 'block';
    elements.imagePreview.style.display = 'none';
    elements.previewImg.src = '';
    const today = new Date().toISOString().split('T')[0];
    elements.eventDate.min = today;
  }

  function populateEventForm(event) {
    elements.eventName.value = event.title || event.name || '';
    elements.eventDescription.value = event.description || '';
    elements.eventDate.value = event.eventDate || event.date || '';
    elements.eventTime.value = (event.startTime || event.time || '').toString().slice(0,5);
    elements.eventEndTime.value = (event.endTime || '').toString().slice(0,5);
    elements.eventAddress.value = event.address || '';
    elements.eventCity.value = event.city || '';
    elements.isActive.checked = !!(event.isActive || event.status === 'active');
    if (event.imageUrl || event.photoUrl) {
      elements.previewImg.src = event.imageUrl || event.photoUrl;
      elements.imageUploadArea.style.display = 'none';
      elements.imagePreview.style.display = 'block';
    }
  }

  function validateEventForm() {
    clearFormErrors();
    const errors = [];
    if (!elements.eventName.value.trim()) {
      showFieldError('eventNameError', 'Titlul este obligatoriu');
      errors.push('name');
    }
    if (!elements.eventDescription.value.trim()) {
      showFieldError('eventDescriptionError', 'Descrierea este obligatorie');
      errors.push('desc');
    }
    if (!elements.eventDate.value) {
      showFieldError('eventDateError', 'Data este obligatorie');
      errors.push('date');
    }
    if (!elements.eventTime.value) {
      showFieldError('eventTimeError', 'Ora de început este obligatorie');
      errors.push('stime');
    }
    if (!elements.eventEndTime.value) {
      showFieldError('eventEndTimeError', 'Ora de sfârșit este obligatorie');
      errors.push('etime');
    }
    if (!elements.eventAddress.value.trim()) {
      showFieldError('eventAddressError', 'Adresa este obligatorie');
      errors.push('addr');
    }
    return errors.length === 0;
  }

  // Helper to get active company id
  async function resolveCompanyId() {
    try {
      if (window.SecureApiService) {
        const r = await window.SecureApiService.getProfile();
        const d = r && r.success ? r.data : r;
        const c = d?.company || d;
        return c?.id || c?.Id || null;
      }
    } catch {}
    try {
      const cRaw = sessionStorage.getItem('company');
      if (cRaw) { const c = JSON.parse(cRaw); return c?.id || c?.Id || null; }
    } catch {}
    return null;
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
  const addEventBtn = document.getElementById('addEventBtn');
  if (addEventBtn) addEventBtn.addEventListener('click', () => openEventModal());
  const addFirstEventBtn = document.getElementById('addFirstEventBtn');
  if (addFirstEventBtn) addFirstEventBtn.addEventListener('click', () => openEventModal());

    // Filter tabs
  if (elements.filterTabs) elements.filterTabs.addEventListener('click', (e) => {
      const filterBtn = e.target.closest('.filter-btn');
      if (filterBtn) {
        currentFilter = filterBtn.dataset.filter;
        updateFilterTabs();
        applyFilters();
      }
    });

    // Search
  if (elements.searchInput) elements.searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.trim();
      applyFilters();
    });

    // Location filter
  if (elements.locationFilter) elements.locationFilter.addEventListener('change', (e) => {
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
  if (elements.eventForm) elements.eventForm.addEventListener('submit', handleEventFormSubmit);

    // Tags input
    if (elements.eventTags) {
      elements.eventTags.addEventListener('input', handleTagsInput);
      elements.eventTags.addEventListener('keydown', handleTagsKeydown);
    }

    // Image upload
    if (elements.imageUploadArea && elements.eventImage) {
      elements.imageUploadArea.addEventListener('click', () => elements.eventImage.click());
    }
    if (elements.eventImage) {
      elements.eventImage.addEventListener('change', handleImageUpload);
    }
    if (elements.removeImage) {
      elements.removeImage.addEventListener('click', hideImagePreview);
    }

    // Delete confirmation
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleDeleteEvent);

    // Retry button
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) retryBtn.addEventListener('click', () => { loadBusinessEvents(); });

    // Location type radio buttons
  if (elements.ownLocationRadio) elements.ownLocationRadio.addEventListener('change', handleLocationTypeChange);
  if (elements.otherLocationRadio) elements.otherLocationRadio.addEventListener('change', handleLocationTypeChange);
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

  // Location Type Management
  function handleLocationTypeChange() {
    if (!elements.ownLocationRadio || !elements.otherLocationRadio) return; // Optional fields not present
    const isOwnLocation = elements.ownLocationRadio.checked;
    
    if (isOwnLocation) {
      if (elements.ownLocationSelector) elements.ownLocationSelector.style.display = 'block';
      if (elements.otherLocationInput) elements.otherLocationInput.style.display = 'none';
      
      // Clear custom location fields
  if (elements.customLocationName) elements.customLocationName.value = '';
  if (elements.customLocationAddress) elements.customLocationAddress.value = '';
      
      // Make custom location fields not required
  if (elements.customLocationName) elements.customLocationName.required = false;
  if (elements.customLocationAddress) elements.customLocationAddress.required = false;
    } else {
  if (elements.ownLocationSelector) elements.ownLocationSelector.style.display = 'none';
  if (elements.otherLocationInput) elements.otherLocationInput.style.display = 'block';
      
      // Make custom location required
  if (elements.customLocationName) elements.customLocationName.required = true;
  if (elements.customLocationAddress) elements.customLocationAddress.required = true;
    }
    
    // Clear any existing errors
    clearLocationErrors();
  }

  function clearLocationErrors() {
    const el1 = document.getElementById('eventLocationError');
    if (el1) el1.style.display = 'none';
    const el2 = document.getElementById('customLocationError');
    if (el2) el2.style.display = 'none';
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
    if (!elements.tagsPreview) return;
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

      const companyId = await resolveCompanyId();
      const payload = {
        title: elements.eventName.value.trim(),
        description: elements.eventDescription.value.trim(),
        eventDate: elements.eventDate.value,
        startTime: elements.eventTime.value.length === 5 ? elements.eventTime.value + ':00' : elements.eventTime.value,
        endTime: elements.eventEndTime.value.length === 5 ? elements.eventEndTime.value + ':00' : elements.eventEndTime.value,
        address: elements.eventAddress.value.trim(),
        city: elements.eventCity.value.trim(),
        isActive: !!elements.isActive.checked,
        companyId,
        imageFile: elements.eventImage.files[0] || null
      };

      let result;
      if (editingEvent) {
        console.log('Updating existing event:', editingEvent.id);
        result = await updateEvent(editingEvent.id, payload);
        // Update the event in local array
        const eventIndex = allEvents.findIndex(e => e.id === editingEvent.id);
        if (eventIndex !== -1) {
          allEvents[eventIndex] = { ...allEvents[eventIndex], ...payload, ...result };
        }
        showNotification('Eveniment actualizat cu succes!', 'success');
      } else {
        console.log('Creating new event');
        result = await createEvent(payload);
        // Add new event to local array
        const newEvent = { 
          ...payload, 
          ...result, 
          id: result.id || Date.now(),
          ticketsSold: 0,
          locationName: payload.address
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