// Business Dashboard Script
document.addEventListener('DOMContentLoaded', () => {
  // Fără localStorage: afișăm direct dashboard-ul activ (simplificare)
  const pendingRoot = document.getElementById('pendingRoot');
  const activeRoot = document.getElementById('activeRoot');
  const welcomeNameEls = document.querySelectorAll('[data-company-name]');
  welcomeNameEls.forEach(el => el.textContent = 'Business');
  // Ascundem complet secțiunea pending și arătăm activul
  pendingRoot.style.display = 'none';
  activeRoot.style.display = 'block';
  // Statistici demo
  const locationsEl = document.getElementById('statLocations');
  const eventsEl = document.getElementById('statEvents');
  locationsEl.textContent = '3';
  eventsEl.textContent = '2';
  // Navigare către noua pagină de locații
  document.querySelectorAll('[data-nav="locations"]').forEach(btn => btn.addEventListener('click', () => {
    window.location.href = 'business-locations.html';
  }));
  document.querySelectorAll('[data-nav="events"]').forEach(btn => btn.addEventListener('click', () => alert('Secțiunea Evenimente (demo)')));
  // Logout = redirect simplu
  document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', () => {
    if(confirm('Sigur te deconectezi?')) window.location.href = 'business-auth.html';
  }));
});
