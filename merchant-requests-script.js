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
    // Load companies from the actual backend endpoint
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const companies = await response.json();
    
    // Transform company data to merchant request format
    allMerchantRequests = companies.map(company => ({
      id: company.Id,
      businessName: company.Name,
      businessType: mapCategoryToBusinessType(company.Category),
      status: 'approved', // Since companies in the DB are already approved
      ownerName: extractOwnerNameFromEmail(company.Email),
      ownerEmail: company.Email,
      ownerPhone: '+40700000000', // Placeholder since not available in Company model
      businessAddress: 'Adresă nedisponibilă', // Placeholder since not available in Company model
      businessDescription: company.Description || 'Descriere nedisponibilă',
      yearsInBusiness: Math.floor(Math.random() * 10) + 1, // Placeholder data
      numberOfEmployees: Math.floor(Math.random() * 50) + 5, // Placeholder data
      averageDailyCustomers: Math.floor(Math.random() * 100) + 20, // Placeholder data
      businessHours: getDefaultBusinessHours(),
      documents: {
        businessLicense: `license_${company.Name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        taxRegistration: `tax_${company.Cui}.pdf`
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
      updatedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'admin@acoomh.ro',
      cui: company.Cui
    }));
    
    filteredMerchantRequests = allMerchantRequests;
    
    updateStatistics();
    displayMerchantRequests(filteredMerchantRequests);
    hideLoadingState();
    
    console.log('✅ Successfully loaded companies as merchant requests:', allMerchantRequests.length);
    
  } catch (error) {
    console.error('Error loading merchant requests:', error);
    showErrorState('Nu s-au putut încărca datele companiilor. Verificați conexiunea la internet.');
  }
}

// Helper functions for data transformation
function mapCategoryToBusinessType(category) {
  const categoryMap = {
    'restaurant': 'restaurant',
    'cafe': 'cafe',
    'pub': 'pub',
    'club': 'club',
    'bar': 'bar',
    'cafenea': 'cafe',
    'bistro': 'restaurant',
    'pizzerie': 'restaurant'
  };
  
  if (!category) return 'restaurant';
  const lowerCategory = category.toLowerCase();
  return categoryMap[lowerCategory] || 'restaurant';
}

function extractOwnerNameFromEmail(email) {
  if (!email) return 'Nume nedisponibil';
  const localPart = email.split('@')[0];
  // Try to extract readable name from email
  return localPart.split(/[._-]/).map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join(' ');
}

function getDefaultBusinessHours() {
  return {
    monday: '09:00-22:00',
    tuesday: '09:00-22:00',
    wednesday: '09:00-22:00',
    thursday: '09:00-22:00',
    friday: '09:00-23:00',
    saturday: '10:00-23:00',
    sunday: '10:00-21:00'
  };
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
          <i class="fas fa-building"></i>
          <span>CUI: ${request.cui || 'N/A'}</span>
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
  
  modalTitle.textContent = `Companie #${request.id} - ${request.businessName}`;
  
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
        <p><strong>Email:</strong> ${request.ownerEmail}</p>
        <p><strong>CUI:</strong> ${request.cui || 'N/A'}</p>
        <p><strong>Status:</strong> <span class="request-status ${request.status}">${getStatusText(request.status)}</span></p>
      </div>
      
      <div class="info-section">
        <h4><i class="fas fa-user"></i> Informații Contact</h4>
        <p><strong>Nume contact:</strong> ${request.ownerName}</p>
        <p><strong>Email:</strong> ${request.ownerEmail}</p>
        <p><strong>Telefon:</strong> ${request.ownerPhone}</p>
      </div>
    </div>
    
    <div class="info-section">
      <h4><i class="fas fa-align-left"></i> Descriere Business</h4>
      <p style="line-height: 1.6; color: var(--text-secondary);">${request.businessDescription}</p>
    </div>
    
    <div class="info-section">
      <h4><i class="fas fa-clock"></i> Program de Lucru (implicit)</h4>
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
        <h4><i class="fas fa-calendar"></i> Înregistrat la</h4>
        <p>${formattedDate}</p>
      </div>
      
      <div class="info-section">
        <h4><i class="fas fa-edit"></i> Ultima actualizare</h4>
        <p>${updatedDate}</p>
      </div>
    </div>
    
    ${request.status === 'approved' ? `
      <div class="info-section" style="background: rgba(16, 185, 129, 0.1); border-color: var(--success-color);">
        <h4 style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Companie Activă</h4>
        <p><strong>Status:</strong> Compania este activă în sistem</p>
        <p><strong>Înregistrată de:</strong> ${request.approvedBy}</p>
      </div>
    ` : ''}
  `;
  
  // Hide action buttons since companies are already approved
  actionButtons.style.display = 'none';
  
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

// Placeholder functions (not needed for company data but kept for compatibility)
function updateRequestStatus(newStatus) {
  if (!selectedMerchantRequest) return;
  
  showNotification('Companiile din sistem sunt deja aprobate. Nu se pot modifica statusurile.', 'info');
}

function openRejectionModal() {
  showNotification('Companiile din sistem nu pot fi respinse.', 'info');
}

function closeRejectionModal() {
  // No-op
}

function confirmRejection() {
  // No-op
}

async function performStatusUpdate(newStatus, rejectionReason = null) {
  showNotification('Statusul companiilor nu poate fi modificat din această interfață.', 'info');
}

// Document download function
function downloadDocument(filename) {
  showNotification(`Funcția de descărcare nu este disponibilă: ${filename}`, 'info');
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