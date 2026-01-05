import config from '../config/config.js';

// ===== DOM ELEMENTS =====
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const mobileToggle = document.getElementById('mobileToggle');
const navItems = document.querySelectorAll('.nav-item a');
const hasSubmenuItems = document.querySelectorAll('.has-submenu');
const logoutBtn = document.getElementById('logoutBtn');
const pageTitle = document.getElementById('pageTitle');
const currentDateTime = document.getElementById('currentDateTime');
const contentArea = document.getElementById('contentArea');

// ===== STATE MANAGEMENT =====
let currentUser = {
  name: 'Admin',
  role: 'Quản trị viên',
  isAdmin: true
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();

  const hasDashboardSection =
    document.getElementById('todayRevenue') ||
    document.getElementById('salesChart') ||
    document.querySelector('.dashboard-home');

  if (hasDashboardSection) {
    loadDashboardData();
  }

  if (currentDateTime) {
    updateDateTime();
    setInterval(updateDateTime, 1000);
  }
});

// ===== INITIALIZE APP =====
function initializeApp() {
  // Load user from localStorage
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateUserInfo();
  } else {
    // Redirect to login if no user
    // window.location.href = '../auth/Login.html';
  }

  // Setup event listeners
  setupEventListeners();
  
  // Check admin permissions
  toggleAdminFeatures();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Sidebar toggle
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  });

  // Mobile toggle
  mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  // Navigation items
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const page = item.getAttribute('data-page');
      if (page) {
        e.preventDefault();
        navigateToPage(page);
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.closest('.nav-item').classList.add('active');
        
        // Close mobile menu
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('mobile-open');
        }
      }
    });
  });

  if (contentArea) {
    contentArea.addEventListener('click', (e) => {
      const target = e.target.closest('[data-page]');
      if (!target) return;
      const page = target.getAttribute('data-page');
      if (!page) return;
      e.preventDefault();
      navigateToPage(page);
    });
  }

  // Submenu toggle
  hasSubmenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (!item.getAttribute('data-page')) {
        e.preventDefault();
        const submenuId = item.getAttribute('data-submenu');
        const submenu = document.getElementById(submenuId);
        
        // Toggle submenu
        submenu.classList.toggle('open');
        item.classList.toggle('active');
        
        // Close other submenus
        hasSubmenuItems.forEach(other => {
          if (other !== item) {
            const otherSubmenuId = other.getAttribute('data-submenu');
            const otherSubmenu = document.getElementById(otherSubmenuId);
            if (otherSubmenu) {
              otherSubmenu.classList.remove('open');
              other.classList.remove('active');
            }
          }
        });
      }
    });
  });

  // Logout
  logoutBtn.addEventListener('click', handleLogout);

  // Restore sidebar state
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
  if (sidebarCollapsed === 'true') {
    sidebar.classList.add('collapsed');
  }

  const taxButton = document.getElementById('btnGoToTaxes');
  if (taxButton) {
    taxButton.addEventListener('click', () => {
      window.location.href = './Taxes.html';
    });
  }
}

// ===== NAVIGATION =====
function navigateToPage(page) {
  console.log(`Navigating to: ${page}`);
  pageTitle.textContent = getPageTitle(page);
  loadPageContent(page);
}

function getPageTitle(page) {
  const titles = {
    'dashboard': 'Dashboard',
    'product-list': 'Danh sách sản phẩm',
    'product-add': 'Thêm sản phẩm',
    'category': 'Danh mục sản phẩm',
    'taxes': 'Quản lý thuế',
    'inventory': 'Quản lý tồn kho',
    'import': 'Phiếu nhập hàng',
    'export': 'Phiếu xuất hàng',
    'pos': 'Bán hàng',
    'invoices': 'Danh sách hóa đơn',
    'print-invoice': 'In hóa đơn',
    'customer-list': 'Danh sách khách hàng',
    'customer-points': 'Tích điểm khách hàng',
    'customer-history': 'Lịch sử mua hàng',
    'report-sales': 'Báo cáo doanh thu',
    'report-inventory': 'Báo cáo tồn kho',
    'report-customer': 'Báo cáo khách hàng',
    'users': 'Quản lý người dùng'
  };
  
  return titles[page] || 'Dashboard';
}

function loadPageContent(page) {
  const sections = document.querySelectorAll('[data-section]');
  if (!sections.length) {
    return;
  }

  let hasSection = false;
  sections.forEach(section => {
    const sectionPage = section.getAttribute('data-page');
    if (sectionPage === page) {
      hasSection = true;
    }
  });

  if (!hasSection) {
    if (page === 'dashboard') {
      loadDashboardData();
    }
    return;
  }

  sections.forEach(section => {
    const sectionPage = section.getAttribute('data-page');
    const display = section.getAttribute('data-display') || 'block';
    if (sectionPage === page) {
      section.style.display = display;
    } else {
      section.style.display = 'none';
    }
  });

  if (page === 'dashboard') {
    loadDashboardData();
  }
}

// ===== USER MANAGEMENT =====
function updateUserInfo() {
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.role;
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

// ===== DATETIME =====
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
  currentDateTime.textContent = now.toLocaleDateString('vi-VN', options);
}

// ===== DASHBOARD DATA =====
async function loadDashboardData() {
  try {
    // Load dashboard statistics
    await Promise.all([
      loadStatistics(),
      loadRecentOrders(),
      loadLowStockAlerts(),
      loadTopProducts(),
      loadSalesChart()
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showNotification('Có lỗi khi tải dữ liệu dashboard', 'error');
  }
}

async function loadStatistics() {
  try {
    const response = await fetch(config.getUrl(config.endpoints.DASHBOARD_STATS), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load statistics');
    }

    const data = await response.json();
    updateStatistics(data);
  } catch (error) {
    console.error('Error loading statistics:', error);
    // Use mock data for demonstration
    updateStatistics({
      todayRevenue: 15750000,
      todayOrders: 48,
      totalProducts: 235,
      totalCustomers: 1247
    });
  }
}

function updateStatistics(data) {
  const todayRevenueEl = document.getElementById('todayRevenue');
  const todayOrdersEl = document.getElementById('todayOrders');
  const totalProductsEl = document.getElementById('totalProducts');
  const totalCustomersEl = document.getElementById('totalCustomers');

  if (!todayRevenueEl || !todayOrdersEl || !totalProductsEl || !totalCustomersEl) {
    return;
  }

  todayRevenueEl.textContent = formatCurrency(data.todayRevenue);
  todayOrdersEl.textContent = data.todayOrders;
  totalProductsEl.textContent = data.totalProducts;
  totalCustomersEl.textContent = data.totalCustomers;
}

async function loadRecentOrders() {
  const tbody = document.getElementById('recentOrdersTable');
  if (!tbody) {
    return;
  }

  tbody.innerHTML = '<tr><td colspan="4" class="text-center">Đang tải dữ liệu đơn hàng...</td></tr>';

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const to = formatDateInputValue(today);
  const from = formatDateInputValue(sevenDaysAgo);

  const url = config.buildUrlWithQuery(config.endpoints.INVOICES_COMPLETED, {
    from,
    to
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    let rawResult;
    const text = await response.text();
    try {
      rawResult = text ? JSON.parse(text) : null;
    } catch {
      rawResult = text;
    }

    if (!response.ok) {
      console.error('Failed to load orders', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Không tải được danh sách đơn hàng.';
      tbody.innerHTML = `<tr><td colspan="4" class="text-center">${message}</td></tr>`;
      return;
    }

    displayRecentOrders(rawResult);
  } catch (error) {
    console.error('Error loading orders:', error);
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Có lỗi khi tải dữ liệu đơn hàng.</td></tr>';
  }
}

function displayRecentOrders(data) {
  const tbody = document.getElementById('recentOrdersTable');
  if (!tbody) {
    return;
  }
  
  let orders = [];
  if (Array.isArray(data)) {
    orders = data;
  } else if (data && Array.isArray(data.items)) {
    orders = data.items;
  }

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Không có đơn hàng nào</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const id = order.invoiceNumber || order.invoiceCode || order.code || order.id || '';
    const customerName = order.customerName || order.customer || order.customerFullName || '';
    const total = getNumberValue(order.totalAmount ?? order.total ?? order.grandTotal ?? order.amount);
    const rawStatus = order.status || order.paymentStatus || order.invoiceStatus || '';
    const normalizedStatus = normalizeOrderStatus(rawStatus);

    return `
      <tr>
        <td><strong>${id}</strong></td>
        <td>${customerName}</td>
        <td>${formatCurrency(total)}</td>
        <td><span class="status-badge ${getStatusClass(normalizedStatus)}">${getStatusText(normalizedStatus)}</span></td>
      </tr>
    `;
  }).join('');
}

async function loadLowStockAlerts() {
  try {
    const response = await fetch(config.getUrl(config.endpoints.LOW_STOCK), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load alerts');
    }

    const data = await response.json();
    displayLowStockAlerts(data);
  } catch (error) {
    console.error('Error loading alerts:', error);
    // Use mock data
    displayLowStockAlerts([
      { name: 'Coca Cola 330ml', stock: 5, minStock: 20 },
      { name: 'Bánh Oreo', stock: 3, minStock: 15 },
      { name: 'Nước suối Lavie', stock: 8, minStock: 30 }
    ]);
  }
}

function displayLowStockAlerts(alerts) {
  const container = document.getElementById('lowStockAlerts');
  if (!container) {
    return;
  }
  
  if (alerts.length === 0) {
    container.innerHTML = '<div class="text-center">Không có cảnh báo tồn kho</div>';
    return;
  }

  container.innerHTML = alerts.map(alert => `
    <div class="alert-item">
      <i class="fas fa-exclamation-triangle text-danger"></i>
      <div>
        <p class="alert-title">${alert.name}</p>
        <small style="color: var(--text-secondary);">Còn ${alert.stock} - Tối thiểu: ${alert.minStock}</small>
      </div>
    </div>
  `).join('');
}

async function loadTopProducts() {
  const container = document.getElementById('topProducts');
  if (!container) {
    return;
  }

  container.innerHTML = '<div class="text-center">Đang tải dữ liệu sản phẩm bán chạy...</div>';

  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const to = formatDateInputValue(today);
    const from = formatDateInputValue(sevenDaysAgo);

    const url = config.buildUrlWithQuery(config.endpoints.TOP_PRODUCTS, {
      from,
      to,
      top: 5
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    let rawResult;
    const text = await response.text();
    try {
      rawResult = text ? JSON.parse(text) : null;
    } catch {
      rawResult = text;
    }

    if (!response.ok) {
      console.error('Failed to load products', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Không tải được dữ liệu sản phẩm bán chạy.';
      container.innerHTML = `<div class="text-center">${message}</div>`;
      return;
    }

    displayTopProducts(rawResult);
  } catch (error) {
    console.error('Error loading products:', error);
    container.innerHTML = '<div class="text-center">Có lỗi khi tải dữ liệu sản phẩm bán chạy.</div>';
  }
}

function displayTopProducts(data) {
  const container = document.getElementById('topProducts');
  if (!container) {
    return;
  }

  let products = [];
  if (Array.isArray(data)) {
    products = data;
  } else if (data && Array.isArray(data.items)) {
    products = data.items;
  }

  if (products.length === 0) {
    container.innerHTML = '<div class="text-center">Không có dữ liệu</div>';
    return;
  }

  container.innerHTML = products.map((product, index) => {
    const name = product.productName || product.name || '';
    const sold = getNumberValue(product.totalQuantity ?? product.sold ?? product.quantity);
    const revenue = getNumberValue(product.totalRevenue ?? product.revenue ?? product.amount);

    return `
      <div class="alert-item" style="border-left-color: var(--success-color);">
        <i class="fas fa-medal" style="color: ${getMedalColor(index)};"></i>
        <div style="flex: 1;">
          <p class="alert-title">${name}</p>
          <small style="color: var(--text-secondary);">Đã bán: ${sold} - Doanh thu: ${formatCurrency(revenue)}</small>
        </div>
      </div>
    `;
  }).join('');
}

function getMedalColor(index) {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32', 'var(--info-color)', 'var(--secondary-color)'];
  return colors[index] || 'var(--text-secondary)';
}

async function loadSalesChart() {
  const ctx = document.getElementById('salesChart');
  if (!ctx) return;

  try {
    const response = await fetch(config.getUrl(config.endpoints.SALES_CHART), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load chart data');
    }

    const data = await response.json();
    renderSalesChart(ctx, data);
  } catch (error) {
    console.error('Error loading chart:', error);
    // Use mock data
    const mockData = {
      labels: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      values: [3200000, 4100000, 3800000, 5200000, 4600000, 5800000, 6200000]
    };
    renderSalesChart(ctx, mockData);
  }
}

function renderSalesChart(ctx, data) {
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Doanh thu (VNĐ)',
        data: data.values,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value, true);
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}
function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function getNumberValue(value) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    return 0;
  }
  return n;
}

function normalizeOrderStatus(status) {
  if (!status) {
    return '';
  }
  const s = String(status).toLowerCase().trim();

  if (['completed', 'complete', 'done', 'success', 'successful', 'paid'].includes(s)) {
    return 'completed';
  }
  if (['processing', 'in_progress', 'in progress'].includes(s)) {
    return 'processing';
  }
  if (['pending', 'new', 'awaiting_payment', 'unpaid', 'waiting'].includes(s)) {
    return 'pending';
  }
  if (['cancelled', 'canceled', 'void', 'rejected'].includes(s)) {
    return 'cancelled';
  }
  return s;
}

function formatCurrency(amount, short = false) {
  if (short && amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M đ';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function getStatusClass(status) {
  const classes = {
    'completed': 'success',
    'processing': 'warning',
    'pending': 'warning',
    'cancelled': 'danger'
  };
  return classes[status] || 'neutral';
}

function getStatusText(status) {
  const texts = {
    'completed': 'Hoàn thành',
    'processing': 'Đang xử lý',
    'pending': 'Chờ xử lý',
    'cancelled': 'Đã hủy'
  };
  return texts[status] || status;
}

function showNotification(message, type = 'info') {
  // Simple notification - you can enhance this with a library
  console.log(`[${type.toUpperCase()}] ${message}`);
  alert(message);
}

// ===== EXPORT FOR EXTERNAL USE =====
window.dashboardApp = {
  loadDashboardData,
  navigateToPage,
  currentUser
};

