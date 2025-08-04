// Merchant Requests Admin Page JavaScript - AcoomH

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

// API Configuration
const API_BASE_URL = 'https://api.acoomh.ro';

// Global variables
let allMerchantRequests = [];
let filteredMerchantRequests = [];
let currentSearchTerm = '';
let currentStatusFilter = 'all';
let currentBusinessTypeFilter = 'all';
let currentSortBy = 'newest';
let selectedMerchantRequest = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  try {
    initializeFilters();
    initializeSearch();
    loadMerchantRequests();
    
    // Hide loading overlay after initialization
    setTimeout(() => {
      hideLoadingOverlay();
    }, 800);
    
    // Setup navigation
    setupNavigation();
    
  } catch (error) {
    console.error('Merchant requests page initialization error:', error);
    hideLoadingOverlay();
  }
});

// API Functions
async function loadMerchantRequests() {
  showLoadingState();
  
  try {
    // Simulate API call for now - replace with actual endpoint
    const response = await fetch(`${API_BASE_URL}/merchant-requests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const merchantRequests = await response.json();
    allMerchantRequests = merchantRequests;
    filteredMerchantRequests = merchantRequests;
    
    updateStatistics();
    displayMerchantRequests(filteredMerchantRequests);
    hideLoadingState();
    
    console.log('✅ Successfully loaded merchant requests:', merchantRequests.length);
    
  } catch (error) {
    console.error('Error loading merchant requests:', error);
    
    // Show mock data for development
    loadMockData();
  }
}

// Mock data for development
function loadMockData() {
  const mockMerchantRequests = [
    {
      id: 1,
      businessName: 'Taverna Rustica',
      businessType: 'restaurant',
      status: 'pending',
      ownerName: 'Gheorghe Popescu',
      ownerEmail: 'gheorghe.popescu@email.com',
      ownerPhone: '+40721234567',
      businessAddress: 'Str. Libertății nr. 15, Cluj-Napoca',
      businessDescription: 'Restaurant tradițional cu specific românesc, folosind ingrediente locale și rețete autentice transmise din generație în generație.',
      yearsInBusiness: 8,
      numberOfEmployees: 12,
      averageDailyCustomers: 80,
      businessHours: {
        monday: '10:00-22:00',
        tuesday: '10:00-22:00',
        wednesday: '10:00-22:00',
        thursday: '10:00-22:00',
        friday: '10:00-23:00',
        saturday: '10:00-23:00',
        sunday: '12:00-21:00'
      },
      documents: {
        businessLicense: 'license_taverna_rustica.pdf',
        taxRegistration: 'tax_reg_taverna_rustica.pdf',
        menuCard: 'menu_taverna_rustica.pdf'
      },
      createdAt: '2025-08-03T09:15:00Z',
      updatedAt: '2025-08-03T09:15:00Z'
    },
    {
      id: 2,
      businessName: 'Coffee Corner',
      businessType: 'cafe',
      status: 'approved',
      ownerName: 'Maria Ionescu',
      ownerEmail: 'maria@coffeecorner.ro',
      ownerPhone: '+40733456789',
      businessAddress: 'Bd. Eroilor nr. 42, București',
      businessDescription: 'Cafenea modernă cu cafea specialty, atmosphere relaxantă și WiFi gratuit pentru freelanceri și studenți.',
      yearsInBusiness: 3,
      numberOfEmployees: 6,
      averageDailyCustomers: 120,
      businessHours: {
        monday: '07:00-20:00',
        tuesday: '07:00-20:00',
        wednesday: '07:00-20:00',
        thursday: '07:00-20:00',
        friday: '07:00-22:00',
        saturday: '08:00-22:00',
        sunday: '09:00-19:00'
      },
      documents: {
        businessLicense: 'license_coffee_corner.pdf',
        taxRegistration: 'tax_reg_coffee_corner.pdf',
        menuCard: 'menu_coffee_corner.pdf'
      },
      createdAt: '2025-08-02T14:30:00Z',
      updatedAt: '2025-08-03T10:45:00Z',
      approvedAt: '2025-08-03T10:45:00Z',
      approvedBy: 'admin@acoomh.ro'
    },
    {
      id: 3,
      businessName: 'The Irish Pub',
      businessType: 'pub',
      status: 'rejected',
      ownerName: 'John O\'Connor',
      ownerEmail: 'john@irishpub.ro',
      ownerPhone: '+40744567890',
      businessAddress: 'Str. Republicii nr. 28, Timișoara',
      businessDescription: 'Pub irlandez autentic cu bere la halba, muzică live și atmosphere tradiționaler irlandeză.',
      yearsInBusiness: 5,
      numberOfEmployees: 8,
      averageDailyCustomers: 60,
      businessHours: {
        monday: 'Închis',
        tuesday: '16:00-02:00',
        wednesday: '16:00-02:00',
        thursday: '16:00-02:00',
        friday: '16:00-03:00',
        saturday: '14:00-03:00',
        sunday: '14:00-24:00'
      },
      documents: {
        businessLicense: 'license_irish_pub.pdf',
        taxRegistration: 'tax_reg_irish_pub.pdf'
      },
      createdAt: '2025-08-01T11:20:00Z',
      updatedAt: '2025-08-02T16:15:00Z',
      rejectedAt: '2025-08-02T16:15:00Z',
      rejectedBy: 'admin@acoomh.ro',
      rejectionReason: 'Documentația incompletă - lipsește licența pentru vânzarea de băuturi alcoolice.'
    },
    {
      id: 4,
      businessName: 'Sunset Club',
      businessType: 'club',
      status: 'pending',
      ownerName: 'Alexandra Mihai',
      ownerEmail: 'alex@sunsetclub.ro',
      ownerPhone: '+40755678901',
      businessAddress: 'Calea Victoriei nr. 87, București',
      businessDescription: 'Club de noapte modern cu DJs renumiți, sistemul de sunet de ultimă generație și atmosphere exclusivistă.',
      yearsInBusiness: 2,
      numberOfEmployees: 25,
      averageDailyCustomers: 200,
      businessHours: {
        monday: 'Închis',
        tuesday: 'Închis',
        wednesday: 'Închis',
        thursday: '22:00-06:00',
        friday: '22:00-06:00',
        saturday: '22:00-06:00',
        sunday: 'Închis'
      },
      documents: {
        businessLicense: 'license_sunset_club.pdf',
        taxRegistration: 'tax_reg_sunset_club.pdf',
        soundLicense: 'sound_license_sunset_club.pdf'
      },
      createdAt: '2025-08-03T16:45:00Z',
      updatedAt: '2025-08-03T16:45:00Z'
    },
    {
      id: 5,
      businessName: 'Bella Vista',
      businessType: 'restaurant',
      status: 'approved',
      ownerName: 'Roberto Martinelli',
      ownerEmail: 'roberto@bellavista.ro',
      ownerPhone: '+40766789012',
      businessAddress: 'Str. Kogălniceanu nr. 23, Constanța',
      businessDescription: 'Restaurant italian cu vedere la mare, pizza autentică în cuptor cu lemne și paste făcute în casă.',
      yearsInBusiness: 6,
      numberOfEmployees: 15,
      averageDailyCustomers: 90,
      businessHours: {
        monday: '11:00-23:00',
        tuesday: '11:00-23:00',
        wednesday: '11:00-23:00',
        thursday: '11:00-23:00',
        friday: '11:00-24:00',
        saturday: '11:00-24:00',
        sunday: '11:00-22:00'
      },
      documents: {
        businessLicense: 'license_bella_vista.pdf',
        taxRegistration: 'tax_reg_bella_vista.pdf',
        menuCard: 'menu_bella_vista.pdf'
      },
      createdAt: '2025-08-01T08:30:00Z',
      updatedAt: '2025-08-02T09:20:00Z',
      approvedAt: '2025-08-02T09:20:00Z',
      approvedBy: 'admin@acoomh.ro'
    }
  ];
  
  allMerchantRequests = mockMerchantRequests;
  filteredMerchantRequests = mockMerchantRequests;
  
  updateStatistics();
  displayMerchantRequests(filteredMerchantRequests);
  hideLoadingState();
  
  console.log('✅ Loaded mock merchant requests for development');
}

// Display Functions
function showLoadingState() {
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('requestsContainer').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

function showErrorState(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'flex';
  document.getElementById('requestsContainer').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('errorMessage').textContent = message || 'Nu am putut încărca cererile comercianților.';
}

function hideLoadingState() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
}

function displayMerchantRequests(requests) {
  const requestsGrid = document.getElementById('requestsGrid');
  const requestsContainer = document.getElementById('requestsContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (!requests || requests.length === 0) {
    requestsContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  requestsContainer.style.display = 'block';
  emptyState.style.display = 'none';
  
  requestsGrid.innerHTML = '';
  
  requests.forEach(request => {
    const requestCard = createMerchantRequestCard(request);
    requestsGrid.appendChild(requestCard);
  });
}

function createMerchantRequestCard(request) {
  const card = document.createElement('div');
  card.className = 'merchant-request-card';
  card.onclick = () => openMerchantModal(request);
  
  const formattedDate = new Date(request.createdAt).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  const statusClass = request.status;
  const businessTypeIcon = getBusinessTypeIcon(request.businessType);
  
  card.innerHTML = `
    <div class="request-header">
      <div class="business-info">
        <div class="business-name">${request.businessName}</div>
        <div class="business-type">
          ${businessTypeIcon}
          ${getBusinessTypeText(request.businessType)}
        </div>
      </div>
      <div class="request-status ${statusClass}">${getStatusText(request.status)}</div>
    </div>
    
    <div class="request-details">
      <div class="contact-info">
        <div class="contact-item">
          <i class="fas fa-user"></i>
          <span>${request.ownerName}</span>
        </div>
        <div class="contact-item">
          <i class="fas fa-envelope"></i>
          <span>${request.ownerEmail}</span>
        </div>
        <div class="contact-item">
          <i class="fas fa-phone"></i>
          <span>${request.ownerPhone}</span>
        </div>
        <div class="contact-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${request.businessAddress}</span>
        </div>
      </div>
    </div>
    
    <div class="request-meta">
      <div class="request-id">#${request.id}</div>
      <div class="request-date">${formattedDate}</div>
    </div>
  `;
  
  return card;
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'În Așteptare',
    'approved': 'Aprobat',
    'rejected': 'Respins'
  };
  return statusMap[status] || status;
}

function getBusinessTypeText(type) {
  const typeMap = {
    'restaurant': 'Restaurant',
    'cafe': 'Cafenea',
    'pub': 'Pub',
    'club': 'Club',
    'bar': 'Bar'
  };
  return typeMap[type] || type;
}

function getBusinessTypeIcon(type) {
  const iconMap = {
    'restaurant': '<i class="fas fa-utensils"></i>',
    'cafe': '<i class="fas fa-coffee"></i>',
    'pub': '<i class="fas fa-beer"></i>',
    'club': '<i class="fas fa-music"></i>',
    'bar': '<i class="fas fa-cocktail"></i>'
  };
  return iconMap[type] || '<i class="fas fa-store"></i>';
}

// Statistics
function updateStatistics() {
  const pendingCount = allMerchantRequests.filter(request => request.status === 'pending').length;
  const approvedCount = allMerchantRequests.filter(request => request.status === 'approved').length;
  const rejectedCount = allMerchantRequests.filter(request => request.status === 'rejected').length;
  const totalCount = allMerchantRequests.length;
  
  document.getElementById('pendingRequestsCount').textContent = pendingCount;
  document.getElementById('approvedRequestsCount').textContent = approvedCount;
  document.getElementById('rejectedRequestsCount').textContent = rejectedCount;
  document.getElementById('totalRequestsCount').textContent = totalCount;
}

// Filtering and Search
function initializeFilters() {
  const statusFilter = document.getElementById('statusFilter');
  const businessTypeFilter = document.getElementById('businessTypeFilter');
  const sortBy = document.getElementById('sortBy');
  
  statusFilter.addEventListener('change', function() {
    currentStatusFilter = this.value;
    applyFilters();
  });
  
  businessTypeFilter.addEventListener('change', function() {
    currentBusinessTypeFilter = this.value;
    applyFilters();
  });
  
  sortBy.addEventListener('change', function() {
    currentSortBy = this.value;
    applyFilters();
  });
}

function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function() {
    currentSearchTerm = this.value.trim().toLowerCase();
    applyFilters();
  });
}

function applyFilters() {
  let filtered = [...allMerchantRequests];
  
  // Apply status filter
  if (currentStatusFilter !== 'all') {
    filtered = filtered.filter(request => request.status === currentStatusFilter);
  }
  
  // Apply business type filter
  if (currentBusinessTypeFilter !== 'all') {
    filtered = filtered.filter(request => request.businessType === currentBusinessTypeFilter);
  }
  
  // Apply search filter
  if (currentSearchTerm) {
    filtered = filtered.filter(request =>
      request.businessName.toLowerCase().includes(currentSearchTerm) ||
      request.ownerName.toLowerCase().includes(currentSearchTerm) ||
      request.ownerEmail.toLowerCase().includes(currentSearchTerm) ||
      request.ownerPhone.toLowerCase().includes(currentSearchTerm) ||
      request.businessAddress.toLowerCase().includes(currentSearchTerm)
    );
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (currentSortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name':
        return a.businessName.localeCompare(b.businessName);
      case 'status':
        const statusOrder = { 'pending': 3, 'approved': 2, 'rejected': 1 };
        return statusOrder[b.status] - statusOrder[a.status];
      default:
        return 0;
    }
  });
  
  filteredMerchantRequests = filtered;
  displayMerchantRequests(filteredMerchantRequests);
}

// Modal Functions
function openMerchantModal(request) {
  selectedMerchantRequest = request;
  const modal = document.getElementById('merchantModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const actionButtons = document.getElementById('actionButtons');
  
  modalTitle.textContent = `Cerere Comerciant #${request.id}`;
  
  const formattedDate = new Date(request.createdAt).toLocaleString('ro-RO');
  const updatedDate = new Date(request.updatedAt).toLocaleString('ro-RO');
  
  // Format business hours
  const businessHoursHtml = Object.entries(request.businessHours || {}).map(([day, hours]) => {
    const dayNames = {
      monday: 'Luni',
      tuesday: 'Marți',
      wednesday: 'Miercuri',
      thursday: 'Joi',
      friday: 'Vineri',
      saturday: 'Sâmbătă',
      sunday: 'Duminică'
    };
    return `
      <div class="hour-item">
        <span class="hour-day">${dayNames[day]}:</span>
        <span class="hour-time">${hours}</span>
      </div>
    `;
  }).join('');
  
  // Format documents
  const documentsHtml = request.documents ? Object.entries(request.documents).map(([type, filename]) => {
    const typeNames = {
      businessLicense: 'Licență Comercială',
      taxRegistration: 'Înregistrare Fiscală',
      menuCard: 'Meniu',
      soundLicense: 'Licență Sonorizare'
    };
    return `
      <a href="#" class="document-link" onclick="downloadDocument('${filename}')">
        <i class="fas fa-file-pdf"></i>
        ${typeNames[type] || type}
      </a>
    `;
  }).join('') : 'Nu sunt documente încărcate';
  
  modalBody.innerHTML = `
    <div class="info-grid">
      <div class="info-section">
        <h4><i class="fas fa-store"></i> Informații Business</h4>
        <p><strong>Nume:</strong> ${request.businessName}</p>
        <p><strong>Tip:</strong> ${getBusinessTypeText(request.businessType)}</p>
        <p><strong>Adresă:</strong> ${request.businessAddress}</p>
        <p><strong>Ani în business:</strong> ${request.yearsInBusiness} ani</p>
        <p><strong>Numărul de angajați:</strong> ${request.numberOfEmployees}</p>
        <p><strong>Clienți zilnic (media):</strong> ${request.averageDailyCustomers}</p>
      </div>
      
      <div class="info-section">
        <h4><i class="fas fa-user"></i> Informații Proprietar</h4>
        <p><strong>Nume:</strong> ${request.ownerName}</p>
        <p><strong>Email:</strong> ${request.ownerEmail}</p>
        <p><strong>Telefon:</strong> ${request.ownerPhone}</p>
        <p><strong>Status:</strong> <span class="request-status ${request.status}">${getStatusText(request.status)}</span></p>
      </div>
    </div>
    
    <div class="info-section">
      <h4><i class="fas fa-align-left"></i> Descriere Business</h4>
      <p style="line-height: 1.6; color: var(--text-secondary);">${request.businessDescription}</p>
    </div>
    
    <div class="info-section">
      <h4><i class="fas fa-clock"></i> Program de Lucru</h4>
      <div class="hours-grid">
        ${businessHoursHtml}
      </div>
    </div>
    
    <div class="info-section">
      <h4><i class="fas fa-file"></i> Documente</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${documentsHtml}
      </div>
    </div>
    
    <div class="info-grid">
      <div class="info-section">
        <h4><i class="fas fa-calendar"></i> Creat la</h4>
        <p>${formattedDate}</p>
      </div>
      
      <div class="info-section">
        <h4><i class="fas fa-edit"></i> Ultima actualizare</h4>
        <p>${updatedDate}</p>
      </div>
    </div>
    
    ${request.status === 'approved' ? `
      <div class="info-section" style="background: rgba(16, 185, 129, 0.1); border-color: var(--success-color);">
        <h4 style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Aprobat</h4>
        <p><strong>Aprobat la:</strong> ${new Date(request.approvedAt).toLocaleString('ro-RO')}</p>
        <p><strong>Aprobat de:</strong> ${request.approvedBy}</p>
      </div>
    ` : ''}
    
    ${request.status === 'rejected' ? `
      <div class="info-section" style="background: rgba(239, 68, 68, 0.1); border-color: var(--error-color);">
        <h4 style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Respins</h4>
        <p><strong>Respins la:</strong> ${new Date(request.rejectedAt).toLocaleString('ro-RO')}</p>
        <p><strong>Respins de:</strong> ${request.rejectedBy}</p>
        <p><strong>Motiv:</strong> ${request.rejectionReason}</p>
      </div>
    ` : ''}
  `;
  
  // Show/hide action buttons based on status
  if (request.status === 'pending') {
    actionButtons.style.display = 'flex';
  } else {
    actionButtons.style.display = 'none';
  }
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
}

function closeMerchantModal() {
  const modal = document.getElementById('merchantModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    selectedMerchantRequest = null;
  }, 300);
}

function updateRequestStatus(newStatus) {
  if (!selectedMerchantRequest) return;
  
  if (newStatus === 'rejected') {
    // Show rejection reason modal
    openRejectionModal();
  } else if (newStatus === 'approved') {
    // Approve directly
    performStatusUpdate('approved');
  }
}

function openRejectionModal() {
  const rejectionModal = document.getElementById('rejectionModal');
  document.getElementById('rejectionReason').value = '';
  rejectionModal.style.display = 'flex';
  setTimeout(() => rejectionModal.classList.add('show'), 10);
}

function closeRejectionModal() {
  const rejectionModal = document.getElementById('rejectionModal');
  rejectionModal.classList.remove('show');
  setTimeout(() => {
    rejectionModal.style.display = 'none';
  }, 300);
}

function confirmRejection() {
  const reason = document.getElementById('rejectionReason').value.trim();
  
  if (!reason) {
    showNotification('Te rugăm să specifici un motiv pentru respingere', 'error');
    return;
  }
  
  performStatusUpdate('rejected', reason);
  closeRejectionModal();
}

async function performStatusUpdate(newStatus, rejectionReason = null) {
  if (!selectedMerchantRequest) return;
  
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  
  // Disable buttons
  approveBtn.disabled = true;
  rejectBtn.disabled = true;
  
  const originalApproveText = approveBtn.textContent;
  const originalRejectText = rejectBtn.textContent;
  
  if (newStatus === 'approved') {
    approveBtn.textContent = 'Se aprobă...';
  } else {
    rejectBtn.textContent = 'Se respinge...';
  }
  
  try {
    // Simulate API call - replace with actual endpoint
    const requestData = {
      status: newStatus,
      ...(rejectionReason && { rejectionReason })
    };
    
    const response = await fetch(`${API_BASE_URL}/merchant-requests/${selectedMerchantRequest.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    
    // Update local data
    const requestIndex = allMerchantRequests.findIndex(r => r.id === selectedMerchantRequest.id);
    if (requestIndex !== -1) {
      allMerchantRequests[requestIndex].status = newStatus;
      allMerchantRequests[requestIndex].updatedAt = new Date().toISOString();
      
      if (newStatus === 'approved') {
        allMerchantRequests[requestIndex].approvedAt = new Date().toISOString();
        allMerchantRequests[requestIndex].approvedBy = 'admin@acoomh.ro';
      } else if (newStatus === 'rejected') {
        allMerchantRequests[requestIndex].rejectedAt = new Date().toISOString();
        allMerchantRequests[requestIndex].rejectedBy = 'admin@acoomh.ro';
        allMerchantRequests[requestIndex].rejectionReason = rejectionReason;
      }
    }
    
    updateStatistics();
    applyFilters();
    closeMerchantModal();
    
    showNotification(
      newStatus === 'approved' ? 'Cererea a fost aprobată cu succes!' : 'Cererea a fost respinsă cu succes!',
      'success'
    );
    
  } catch (error) {
    console.error('Error updating request status:', error);
    
    // For development, update locally anyway
    const requestIndex = allMerchantRequests.findIndex(r => r.id === selectedMerchantRequest.id);
    if (requestIndex !== -1) {
      allMerchantRequests[requestIndex].status = newStatus;
      allMerchantRequests[requestIndex].updatedAt = new Date().toISOString();
      
      if (newStatus === 'approved') {
        allMerchantRequests[requestIndex].approvedAt = new Date().toISOString();
        allMerchantRequests[requestIndex].approvedBy = 'admin@acoomh.ro';
      } else if (newStatus === 'rejected') {
        allMerchantRequests[requestIndex].rejectedAt = new Date().toISOString();
        allMerchantRequests[requestIndex].rejectedBy = 'admin@acoomh.ro';
        allMerchantRequests[requestIndex].rejectionReason = rejectionReason;
      }
    }
    
    updateStatistics();
    applyFilters();
    closeMerchantModal();
    
    showNotification(
      `Status actualizat (mod dezvoltare) - ${newStatus === 'approved' ? 'Aprobat' : 'Respins'}`,
      'info'
    );
  } finally {
    // Re-enable buttons
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    approveBtn.textContent = originalApproveText;
    rejectBtn.textContent = originalRejectText;
  }
}

// Document download function
function downloadDocument(filename) {
  // Simulate document download
  showNotification(`Descărcare simulată: ${filename}`, 'info');
  console.log('Download document:', filename);
}

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    font-weight: 600;
    z-index: 10000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 300px;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Navigation Setup
function setupNavigation() {
  const navigationLinks = document.querySelectorAll('a[href*=".html"]');
  
  navigationLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      if (href && href.includes('.html') && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
        e.preventDefault();
        navigateWithLoading(href);
      }
    });
  });
}

// Loading Overlay System
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
}

function navigateWithLoading(url) {
  clearTimeout(window.loadingTimeout);
  showLoadingOverlay();
  window.location.href = url;
}

// Page visibility and navigation handlers
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

// Global functions for HTML onclick handlers
window.loadMerchantRequests = loadMerchantRequests;
window.closeMerchantModal = closeMerchantModal;
window.closeRejectionModal = closeRejectionModal;
window.updateRequestStatus = updateRequestStatus;
window.confirmRejection = confirmRejection;
window.downloadDocument = downloadDocument;