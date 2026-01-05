import config from '../config/config.js';

let currentUser = {
  name: 'Admin',
  role: 'Quản trị viên',
  isAdmin: true
};

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const mobileToggle = document.getElementById('mobileToggle');
const logoutBtn = document.getElementById('logoutBtn');
const currentDateTime = document.getElementById('currentDateTime');

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initUsersPage();
});

function initializeApp() {
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateUserInfo();
  }

  setupLayoutEventListeners();
  toggleAdminFeatures();

  if (currentDateTime) {
    updateDateTime();
    setInterval(updateDateTime, 1000);
  }
}

function setupLayoutEventListeners() {
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
  }

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  if (sidebar) {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true') {
      sidebar.classList.add('collapsed');
    }
  }
}

function updateUserInfo() {
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');

  if (userNameEl) {
    userNameEl.textContent = currentUser.name;
  }
  if (userRoleEl) {
    userRoleEl.textContent = currentUser.role;
  }
}

function toggleAdminFeatures() {
  const adminOnlyItems = document.querySelectorAll('.admin-only');
  if (!currentUser.isAdmin) {
    adminOnlyItems.forEach(item => {
      item.style.display = 'none';
    });
  }
}

function handleLogout() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = '../auth/Login.html';
  }
}

function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  if (currentDateTime) {
    currentDateTime.textContent = now.toLocaleDateString('vi-VN', options);
  }
}

function initUsersPage() {
  const usersTableBody = document.getElementById('usersTableBody');
  const userSearch = document.getElementById('userSearch');
  const userRoleFilter = document.getElementById('userRoleFilter');

  if (!usersTableBody) {
    return;
  }

  if (userSearch) {
    userSearch.addEventListener('input', () => {});
  }

  if (userRoleFilter) {
    userRoleFilter.addEventListener('change', () => {});
  }
}

