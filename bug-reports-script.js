// Bug Reports Admin Page JavaScript - AcoomH

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

// API Configuration - Updated to match backend
const API_BASE_URL = 'https://api.acoomh.ro';

// Global variables
let allBugReports = [];
let filteredBugReports = [];
let currentSearchTerm = '';
let currentStatusFilter = 'all';
let currentPriorityFilter = 'all';
let currentSortBy = 'newest';
let selectedBugReport = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('🚀 Initializing bug reports page...');
    initializeFilters();
    initializeSearch();
    loadBugReports();
    
    // Hide loading overlay after initialization
    setTimeout(() => {
      hideLoadingOverlay();
    }, 800);
    
    // Setup navigation
    setupNavigation();
    
  } catch (error) {
    console.error('Bug reports page initialization error:', error);
    hideLoadingOverlay();
    showErrorState('Eroare la inițializarea paginii');
  }
});

// API Functions - Updated to match backend endpoints
async function loadBugReports() {
  console.log('📡 Loading bug reports from API...');
  showLoadingState();
  
  try {
    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Use actual backend endpoint
    const response = await fetch(`${API_BASE_URL}/api/BugReport?pageSize=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const bugReports = result.data || result; // Handle both paginated and direct response
    
    console.log('✅ Successfully loaded bug reports from API:', bugReports.length);
    
    // Transform backend data to frontend format
    allBugReports = bugReports.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      status: report.isResolved ? 'resolved' : 'open',
      priority: determinePriority(report.title, report.description),
      userEmail: 'N/A',
      userName: report.username,
      createdAt: report.createdAt,
      updatedAt: report.createdAt,
      deviceInfo: report.deviceInfo || 'N/A',
      appVersion: extractAppVersion(report.deviceInfo),
      deviceType: report.deviceType,
      adminNotes: report.adminNotes
    }));
    
    filteredBugReports = allBugReports;
    
    updateStatistics();
    displayBugReports(filteredBugReports);
    hideLoadingState();
    
  } catch (error) {
    console.error('❌ Error loading bug reports from API:', error);
    console.log('🔄 Falling back to mock data...');
    
    // Always fall back to mock data if API fails
    loadMockData();
  }
}

// Helper function to determine priority based on content
function determinePriority(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('crash') || content.includes('închide') || content.includes('eroare critică')) {
    return 'critical';
  } else if (content.includes('nu funcționează') || content.includes('problema') || content.includes('bug')) {
    return 'high';
  } else if (content.includes('lent') || content.includes('încărcare')) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Helper function to extract app version from device info
function extractAppVersion(deviceInfo) {
  if (!deviceInfo) return 'N/A';
  
  // Try to find version patterns like "1.2.0" or "v1.2.0"
  const versionMatch = deviceInfo.match(/v?(\d+\.\d+\.\d+)/);
  return versionMatch ? versionMatch[1] : 'N/A';
}

// Mock data for development - keeping for fallback
function loadMockData() {
  console.log('📋 Loading mock bug reports data...');
  
  const mockBugReports = [
    {
      id: 1,
      title: 'Aplicația se închide când încerc să fac rezervare',
      description: 'De fiecare dată când încerc să completez formularul de rezervare, aplicația se închide brusc. Acest lucru se întâmplă pe iPhone 12 Pro cu iOS 15.6.',
      status: 'open',
      priority: 'critical',
      userEmail: 'user1@example.com',
      userName: 'Alexandru Popescu',
      createdAt: '2025-08-03T10:30:00Z',
      updatedAt: '2025-08-03T10:30:00Z',
      deviceInfo: 'iPhone 12 Pro, iOS 15.6',
      appVersion: '1.2.0',
      deviceType: 'ios'
    },
    {
      id: 2,
      title: 'Imaginile restaurantelor nu se încarcă',
      description: 'Pe pagina de rezervări, imaginile restaurantelor apar ca fiind rupte. Am încercat să reîncarc pagina dar problema persistă.',
      status: 'open',
      priority: 'medium',
      userEmail: 'maria.ionescu@gmail.com',
      userName: 'Maria Ionescu',
      createdAt: '2025-08-02T14:15:00Z',
      updatedAt: '2025-08-03T09:20:00Z',
      deviceInfo: 'Samsung Galaxy S21, Android 12',
      appVersion: '1.2.0',
      deviceType: 'android'
    },
    {
      id: 3,
      title: 'Problema cu autentificarea',
      description: 'Nu pot să mă loghez în aplicație. Îmi spune că parola este greșită, dar sunt sigur că este corectă.',
      status: 'resolved',
      priority: 'high',
      userEmail: 'ion.vasile@example.com',
      userName: 'Ion Vasile',
      createdAt: '2025-08-01T16:45:00Z',
      updatedAt: '2025-08-02T10:30:00Z',
      deviceInfo: 'Huawei P30, Android 10',
      appVersion: '1.1.9',
      deviceType: 'android'
    },
    {
      id: 4,
      title: 'Încărcare lentă a paginii principale',
      description: 'Pagina principală se încarcă foarte lent, durează peste 10 secunde să apară conținutul.',
      status: 'open',
      priority: 'low',
      userEmail: 'ana.popescu@gmail.com',
      userName: 'Ana Popescu',
      createdAt: '2025-07-30T11:20:00Z',
      updatedAt: '2025-07-30T11:20:00Z',
      deviceInfo: 'iPhone 13, iOS 16.1',
      appVersion: '1.2.0',
      deviceType: 'ios'
    },
    {
      id: 5,
      title: 'Notificările nu funcționează',
      description: 'Nu primesc notificări pentru confirmările de rezervare, deși am activat notificările în setări.',
      status: 'open',
      priority: 'medium',
      userEmail: 'george.stan@example.com',
      userName: 'George Stan',
      createdAt: '2025-07-28T09:15:00Z',
      updatedAt: '2025-07-29T14:20:00Z',
      deviceInfo: 'OnePlus 9, Android 11',
      appVersion: '1.1.8',
      deviceType: 'android'
    }
  ];
  
  allBugReports = mockBugReports;
  filteredBugReports = mockBugReports;
  
  updateStatistics();
  displayBugReports(filteredBugReports);
  hideLoadingState();
  
  console.log('✅ Successfully loaded mock bug reports:', mockBugReports.length);
}

// Display Functions
function showLoadingState() {
  console.log('⏳ Showing loading state...');
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('reportsContainer').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

function showErrorState(message) {
  console.log('❌ Showing error state:', message);
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'flex';
  document.getElementById('reportsContainer').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('errorMessage').textContent = message || 'Nu am putut încărca rapoartele de bug-uri.';
}

function hideLoadingState() {
  console.log('✅ Hiding loading state...');
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
}

function displayBugReports(reports) {
  const reportsGrid = document.getElementById('reportsGrid');
  const reportsContainer = document.getElementById('reportsContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (!reports || reports.length === 0) {
    reportsContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  reportsContainer.style.display = 'block';
  emptyState.style.display = 'none';
  
  reportsGrid.innerHTML = '';
  
  reports.forEach(report => {
    const reportCard = createBugReportCard(report);
    reportsGrid.appendChild(reportCard);
  });
}

function createBugReportCard(report) {
  const card = document.createElement('div');
  card.className = 'bug-report-card';
  card.onclick = () => openBugModal(report);
  
  const formattedDate = new Date(report.createdAt).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  const priorityClass = report.priority;
  const statusClass = report.status;
  
  card.innerHTML = `
    <div class="bug-priority ${priorityClass}"></div>
    <div class="bug-header">
      <div>
        <div class="bug-title">${report.title}</div>
        <div class="bug-id">#${report.id}</div>
      </div>
      <div class="bug-status ${statusClass}">${getStatusText(report.status)}</div>
    </div>
    <div class="bug-description">${report.description}</div>
    <div class="bug-meta">
      <div class="bug-user">
        <i class="fas fa-user"></i>
        <span>${report.userName}</span>
      </div>
      <div class="bug-date">${formattedDate}</div>
    </div>
  `;
  
  return card;
}

function getStatusText(status) {
  const statusMap = {
    'open': 'Deschis',
    'resolved': 'Rezolvat'
  };
  return statusMap[status] || status;
}

function getPriorityText(priority) {
  const priorityMap = {
    'low': 'Scăzută',
    'medium': 'Medie',
    'high': 'Înaltă',
    'critical': 'Critică'
  };
  return priorityMap[priority] || priority;
}

// Statistics - Updated for backend data structure
function updateStatistics() {
  const openCount = allBugReports.filter(report => report.status === 'open').length;
  const resolvedCount = allBugReports.filter(report => report.status === 'resolved').length;
  
  document.getElementById('openBugsCount').textContent = openCount;
  document.getElementById('inProgressBugsCount').textContent = 0; // Backend doesn't have in-progress
  document.getElementById('resolvedBugsCount').textContent = resolvedCount;
}

// Filtering and Search - Updated for simplified status
function initializeFilters() {
  const statusFilter = document.getElementById('statusFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const sortBy = document.getElementById('sortBy');
  
  statusFilter.addEventListener('change', function() {
    currentStatusFilter = this.value;
    applyFilters();
  });
  
  priorityFilter.addEventListener('change', function() {
    currentPriorityFilter = this.value;
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
  let filtered = [...allBugReports];
  
  // Apply status filter
  if (currentStatusFilter !== 'all') {
    filtered = filtered.filter(report => report.status === currentStatusFilter);
  }
  
  // Apply priority filter
  if (currentPriorityFilter !== 'all') {
    filtered = filtered.filter(report => report.priority === currentPriorityFilter);
  }
  
  // Apply search filter
  if (currentSearchTerm) {
    filtered = filtered.filter(report =>
      report.title.toLowerCase().includes(currentSearchTerm) ||
      report.description.toLowerCase().includes(currentSearchTerm) ||
      report.userName.toLowerCase().includes(currentSearchTerm)
    );
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (currentSortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'priority':
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'status':
        const statusOrder = { 'open': 2, 'resolved': 1 };
        return statusOrder[b.status] - statusOrder[a.status];
      default:
        return 0;
    }
  });
  
  filteredBugReports = filtered;
  displayBugReports(filteredBugReports);
}

// Modal Functions - Updated for backend data
function openBugModal(report) {
  selectedBugReport = report;
  const modal = document.getElementById('bugModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  
  modalTitle.textContent = `Bug Report #${report.id}`;
  
  const formattedDate = new Date(report.createdAt).toLocaleString('ro-RO');
  
  modalBody.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h3 style="color: var(--text-primary); margin-bottom: 10px;">${report.title}</h3>
      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <span class="bug-status ${report.status}">${getStatusText(report.status)}</span>
        <span style="background: rgba(139, 92, 246, 0.1); color: var(--primary-color); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
          Prioritate ${getPriorityText(report.priority)}
        </span>
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4 style="color: var(--text-primary); margin-bottom: 8px;">Descriere:</h4>
      <p style="color: var(--text-secondary); line-height: 1.6;">${report.description}</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div>
        <h4 style="color: var(--text-primary); margin-bottom: 8px;">Utilizator:</h4>
        <p style="color: var(--text-secondary);">${report.userName}</p>
      </div>
      <div>
        <h4 style="color: var(--text-primary); margin-bottom: 8px;">Detalii tehnice:</h4>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Dispozitiv: ${report.deviceInfo || 'N/A'}</p>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Tip: ${report.deviceType || 'N/A'}</p>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Versiune app: ${report.appVersion || 'N/A'}</p>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
      <div>
        <h4 style="color: var(--text-primary); margin-bottom: 8px;">Creat la:</h4>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${formattedDate}</p>
      </div>
    </div>
    
    ${report.adminNotes ? `
      <div style="margin-top: 20px;">
        <h4 style="color: var(--text-primary); margin-bottom: 8px;">Note admin:</h4>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${report.adminNotes}</p>
      </div>
    ` : ''}
    
    <div style="margin-top: 20px;">
      <h4 style="color: var(--text-primary); margin-bottom: 8px;">Actualizează status:</h4>
      <select id="modalStatusSelect" style="width: 100%; padding: 10px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
        <option value="open" ${report.status === 'open' ? 'selected' : ''}>Deschis</option>
        <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Rezolvat</option>
      </select>
    </div>
  `;
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
}

function closeBugModal() {
  const modal = document.getElementById('bugModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    selectedBugReport = null;
  }, 300);
}

// Note: Backend doesn't support status updates, so this is a placeholder
async function updateBugStatus() {
  if (!selectedBugReport) return;
  
  const newStatus = document.getElementById('modalStatusSelect').value;
  const updateBtn = document.getElementById('updateStatusBtn');
  const originalText = updateBtn.textContent;
  
  updateBtn.disabled = true;
  updateBtn.textContent = 'Se actualizează...';
  
  try {
    // Backend doesn't have status update endpoint yet
    // This would be the API call when backend supports it:
    // await fetch(`${API_BASE_URL}/api/BugReport/${selectedBugReport.id}/status`, {...})
    
    // For now, update locally
    const reportIndex = allBugReports.findIndex(r => r.id === selectedBugReport.id);
    if (reportIndex !== -1) {
      allBugReports[reportIndex].status = newStatus;
    }
    
    updateStatistics();
    applyFilters();
    closeBugModal();
    
    showNotification('Status actualizat local (backend nu suportă încă)', 'info');
    
  } catch (error) {
    console.error('Error updating bug status:', error);
    showNotification('Eroare la actualizarea statusului', 'error');
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = originalText;
  }
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
  }, 3000);
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
window.loadBugReports = loadBugReports;
window.closeBugModal = closeBugModal;
window.updateBugStatus = updateBugStatus;