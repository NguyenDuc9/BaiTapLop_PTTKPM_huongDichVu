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

let productList = [];
let productFilters = {
  q: '',
  category: '',
  status: ''
};

let categories = [];

let inventoryItems = [];
let inventoryFilters = {
  q: '',
  status: ''
};

let taxesData = [];
let taxFilters = {
  q: '',
  isActive: ''
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  loadDashboardData();
  initProductListPage();
  initCategoryPage();
  initInventoryPage();
  initTaxesPage();
  updateDateTime();
  setInterval(updateDateTime, 1000);
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
  document.getElementById('todayRevenue').textContent = formatCurrency(data.todayRevenue);
  document.getElementById('todayOrders').textContent = data.todayOrders;
  document.getElementById('totalProducts').textContent = data.totalProducts;
  document.getElementById('totalCustomers').textContent = data.totalCustomers;
}

async function loadRecentOrders() {
  try {
    const response = await fetch(config.getUrl(config.endpoints.RECENT_ORDERS), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load orders');
    }

    const data = await response.json();
    displayRecentOrders(data);
  } catch (error) {
    console.error('Error loading orders:', error);
    // Use mock data
    displayRecentOrders([
      { id: 'HD001', customer: 'Nguyễn Văn A', total: 250000, status: 'completed' },
      { id: 'HD002', customer: 'Trần Thị B', total: 180000, status: 'pending' },
      { id: 'HD003', customer: 'Lê Văn C', total: 450000, status: 'completed' },
      { id: 'HD004', customer: 'Phạm Thị D', total: 320000, status: 'processing' },
      { id: 'HD005', customer: 'Hoàng Văn E', total: 190000, status: 'completed' }
    ]);
  }
}

function displayRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersTable');
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Không có đơn hàng nào</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.customer}</td>
      <td>${formatCurrency(order.total)}</td>
      <td><span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
    </tr>
  `).join('');
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
  try {
    const response = await fetch(config.getUrl(config.endpoints.TOP_PRODUCTS), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load products');
    }

    const data = await response.json();
    displayTopProducts(data);
  } catch (error) {
    console.error('Error loading products:', error);
    // Use mock data
    displayTopProducts([
      { name: 'Coca Cola 330ml', sold: 145, revenue: 7250000 },
      { name: 'Pepsi 330ml', sold: 128, revenue: 6400000 },
      { name: 'Snack Oishi', sold: 95, revenue: 2375000 },
      { name: 'Bánh Oreo', sold: 87, revenue: 2175000 },
      { name: 'Nước suối Lavie', sold: 76, revenue: 1520000 }
    ]);
  }
}

function displayTopProducts(products) {
  const container = document.getElementById('topProducts');
  
  if (products.length === 0) {
    container.innerHTML = '<div class="text-center">Không có dữ liệu</div>';
    return;
  }

  container.innerHTML = products.map((product, index) => `
    <div class="alert-item" style="border-left-color: var(--success-color);">
      <i class="fas fa-medal" style="color: ${getMedalColor(index)};"></i>
      <div style="flex: 1;">
        <p class="alert-title">${product.name}</p>
        <small style="color: var(--text-secondary);">Đã bán: ${product.sold} - Doanh thu: ${formatCurrency(product.revenue)}</small>
      </div>
    </div>
  `).join('');
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

function initProductListPage() {
  const searchInput = document.getElementById('productSearchInput');
  const categorySelect = document.getElementById('productCategoryFilter');
  const statusSelect = document.getElementById('productStatusFilter');
  const tbody = document.getElementById('productTableBody');
  if (!searchInput || !categorySelect || !statusSelect || !tbody) {
    return;
  }
  searchInput.addEventListener('input', () => {
    productFilters.q = searchInput.value.trim();
    renderProductRows();
  });
  categorySelect.addEventListener('change', () => {
    productFilters.category = categorySelect.value;
    renderProductRows();
  });
  statusSelect.addEventListener('change', () => {
    productFilters.status = statusSelect.value;
    renderProductRows();
  });
  tbody.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) {
      return;
    }
    const row = button.closest('tr');
    if (!row) {
      return;
    }
  });
  loadCategories();
  loadProductsForAdmin();
}

async function loadProductsForAdmin() {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Đang tải dữ liệu sản phẩm...</td></tr>';
  try {
    const url = config.getUrl(config.endpoints.PRODUCTS);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to load products');
    }
    const data = await response.json();
    productList = Array.isArray(data) ? data : [];
    renderProductRows();
  } catch (error) {
    console.error('Error loading products:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không thể tải dữ liệu sản phẩm</td></tr>';
  }
}

function renderProductRows() {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) {
    return;
  }
  if (!Array.isArray(productList) || productList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không có dữ liệu sản phẩm</td></tr>';
    return;
  }
  let items = productList.slice();
  if (productFilters.q) {
    const q = productFilters.q.toLowerCase();
    items = items.filter(item => {
      const code = item.productCode || item.code || '';
      const name = item.productName || item.name || '';
      return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }
  if (productFilters.category) {
    const categoryValue = productFilters.category;
    items = items.filter(item => {
      const categoryName = item.categoryName || item.category || '';
      return String(categoryName).toLowerCase() === String(categoryValue).toLowerCase();
    });
  }
  if (productFilters.status) {
    items = items.filter(item => {
      const status = getProductStatus(item);
      if (productFilters.status === 'low-stock') {
        return status === 'low' || status === 'out';
      }
      return status === productFilters.status;
    });
  }
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không có sản phẩm phù hợp</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(item => {
    const code = item.productCode || item.code || '';
    const name = item.productName || item.name || '';
    const categoryName = item.categoryName || item.category || '';
    const price = item.sellingPrice != null ? item.sellingPrice : item.price != null ? item.price : 0;
    const stock = item.stockQuantity != null ? item.stockQuantity : item.stock != null ? item.stock : 0;
    const minStock = item.minStock != null ? item.minStock : 0;
    const status = getProductStatus(item);
    const statusText = getProductStatusText(status);
    const statusClass = getProductStatusClass(status);
    return `
      <tr>
        <td><strong>${code}</strong></td>
        <td>${name}</td>
        <td><span class="tag-badge">${categoryName}</span></td>
        <td>${formatCurrency(price)}</td>
        <td>${stock}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn-link">Sửa</button>
          <button class="btn-link danger">Xóa</button>
        </td>
      </tr>
    `;
  }).join('');
}

function getProductStatus(item) {
  const isActive = item.isActive !== false;
  const stock = item.stockQuantity != null ? item.stockQuantity : item.stock != null ? item.stock : 0;
  const minStock = item.minStock != null ? item.minStock : 0;
  if (!isActive) {
    return 'inactive';
  }
  if (stock <= 0) {
    return 'out';
  }
  if (minStock && stock < minStock) {
    return 'low';
  }
  return 'active';
}

function getProductStatusText(status) {
  if (status === 'inactive') {
    return 'Ngừng bán';
  }
  if (status === 'out') {
    return 'Hết hàng';
  }
  if (status === 'low') {
    return 'Sắp hết hàng';
  }
  return 'Đang bán';
}

function getProductStatusClass(status) {
  if (status === 'inactive') {
    return 'danger';
  }
  if (status === 'out') {
    return 'danger';
  }
  if (status === 'low') {
    return 'warning';
  }
  return 'success';
}

function initCategoryPage() {
  const nameInput = document.getElementById('categoryName');
  const codeInput = document.getElementById('categoryCode');
  const addBtn = document.querySelector('[data-page="category"] .btn-primary.full-width');
  const tbody = document.getElementById('categoryTableBody');
  if (!nameInput || !codeInput || !addBtn || !tbody) {
    return;
  }
  addBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const code = codeInput.value.trim();
    if (!name || !code) {
      alert('Vui lòng nhập đầy đủ mã và tên danh mục');
      return;
    }
    await createCategory(code, name);
  });
  tbody.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) {
      return;
    }
    const id = button.getAttribute('data-id');
    const action = button.classList.contains('danger') ? 'delete' : 'edit';
    if (!id) {
      return;
    }
    if (action === 'edit') {
      handleEditCategory(id);
    } else {
      handleDeleteCategory(id);
    }
  });
  loadCategories();
}

async function loadCategories() {
  try {
    const response = await fetch(config.getUrl(config.endpoints.CATEGORIES), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to load categories');
    }
    const data = await response.json();
    categories = Array.isArray(data) ? data : [];
    renderCategoryRows();
    populateProductCategoryFilter();
    populateProductCategorySelect();
  } catch (error) {
    console.error('Error loading categories:', error);
    const tbody = document.getElementById('categoryTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không thể tải dữ liệu danh mục</td></tr>';
    }
  }
}

function renderCategoryRows() {
  const tbody = document.getElementById('categoryTableBody');
  if (!tbody) {
    return;
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có dữ liệu danh mục</td></tr>';
    return;
  }
  tbody.innerHTML = categories.map(cat => {
    const id = cat.categoryId != null ? cat.categoryId : cat.id;
    const code = cat.categoryCode || cat.code || '';
    const name = cat.categoryName || cat.name || '';
    const productCount = cat.productCount != null ? cat.productCount : '';
    const isActive = cat.isActive !== false;
    const statusText = isActive ? 'Hoạt động' : 'Ngừng hoạt động';
    const statusClass = isActive ? 'success' : 'danger';
    return `
      <tr>
        <td><strong>${code}</strong></td>
        <td>${name}</td>
        <td>${productCount}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn-link" data-id="${id}">Sửa</button>
          <button class="btn-link danger" data-id="${id}">Xóa</button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateProductCategoryFilter() {
  const select = document.getElementById('productCategoryFilter');
  if (!select) {
    return;
  }
  const current = select.value;
  const options = ['<option value="">Tất cả</option>'].concat(
    categories.map(cat => {
      const name = cat.categoryName || cat.name || cat.categoryCode || '';
      return `<option value="${name}">${name}</option>`;
    })
  );
  select.innerHTML = options.join('');
  if (current) {
    select.value = current;
  }
}

function populateProductCategorySelect() {
  const select = document.getElementById('productCategory');
  if (!select) {
    return;
  }
  const current = select.value;
  const options = ['<option value="">Chọn danh mục</option>'].concat(
    categories.map(cat => {
      const name = cat.categoryName || cat.name || cat.categoryCode || '';
      return `<option value="${name}">${name}</option>`;
    })
  );
  select.innerHTML = options.join('');
  if (current) {
    select.value = current;
  }
}

async function createCategory(code, name) {
  try {
    const payload = {
      categoryCode: code,
      categoryName: name,
      isActive: true
    };
    const response = await fetch(config.getUrl(config.endpoints.CATEGORY_CREATE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryCode').value = '';
    await loadCategories();
  } catch (error) {
    console.error('Error creating category:', error);
    alert('Không thể tạo danh mục mới');
  }
}

async function handleEditCategory(id) {
  const cat = categories.find(item => {
    const catId = item.categoryId != null ? item.categoryId : item.id;
    return String(catId) === String(id);
  });
  if (!cat) {
    return;
  }
  const currentCode = cat.categoryCode || cat.code || '';
  const currentName = cat.categoryName || cat.name || '';
  const currentActive = cat.isActive !== false;
  const code = prompt('Cập nhật mã danh mục', currentCode);
  if (!code) {
    return;
  }
  const name = prompt('Cập nhật tên danh mục', currentName);
  if (!name) {
    return;
  }
  const isActive = confirm(currentActive ? 'Giữ trạng thái hoạt động cho danh mục này?' : 'Kích hoạt danh mục này?');
  const payload = {
    categoryCode: code.trim(),
    categoryName: name.trim(),
    isActive
  };
  try {
    const url = config.getUrl(config.endpoints.CATEGORY_UPDATE, { id });
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Failed to update category');
    }
    await loadCategories();
  } catch (error) {
    console.error('Error updating category:', error);
    alert('Không thể cập nhật danh mục');
  }
}

async function handleDeleteCategory(id) {
  if (!confirm('Bạn có chắc muốn xóa danh mục này?')) {
    return;
  }
  try {
    const url = config.getUrl(config.endpoints.CATEGORY_DELETE, { id });
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to delete category');
    }
    await loadCategories();
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('Không thể xóa danh mục');
  }
}

function initInventoryPage() {
  const searchInput = document.getElementById('inventorySearch');
  const statusSelect = document.getElementById('inventoryStatusFilter');
  const tbody = document.getElementById('inventoryTableBody');
  if (!searchInput || !statusSelect || !tbody) {
    return;
  }
  searchInput.addEventListener('input', () => {
    inventoryFilters.q = searchInput.value.trim();
    loadInventory();
  });
  statusSelect.addEventListener('change', () => {
    inventoryFilters.status = statusSelect.value;
    renderInventoryRows();
  });
  loadInventory();
}

async function loadInventory() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải dữ liệu tồn kho...</td></tr>';
  try {
    const params = {};
    if (inventoryFilters.q) {
      params.q = inventoryFilters.q;
    }
    const url = config.buildUrlWithQuery(config.endpoints.INVENTORY, params);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to load inventory');
    }
    const data = await response.json();
    inventoryItems = Array.isArray(data) ? data : [];
    renderInventoryRows();
  } catch (error) {
    console.error('Error loading inventory:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không thể tải dữ liệu tồn kho</td></tr>';
  }
}

function renderInventoryRows() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) {
    return;
  }
  if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có dữ liệu tồn kho</td></tr>';
    return;
  }
  let items = inventoryItems.slice();
  if (inventoryFilters.status) {
    items = items.filter(item => getInventoryStatus(item) === inventoryFilters.status);
  }
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có dữ liệu tồn kho phù hợp</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(item => {
    const code = item.productCode || item.code || '';
    const name = item.productName || item.name || '';
    const warehouse = item.warehouseName || item.warehouse || 'Kho chính';
    const quantity = item.currentStock != null
      ? item.currentStock
      : item.stockQuantity != null
        ? item.stockQuantity
        : item.quantity != null
          ? item.quantity
          : 0;
    const minStock = item.minStock != null ? item.minStock : 0;
    const status = getInventoryStatus(item);
    const statusLabel = getInventoryStatusLabel(status);
    const statusClass = getInventoryStatusClass(status);
    return `
      <tr>
        <td><strong>${code}</strong></td>
        <td>${name}</td>
        <td>${warehouse}</td>
        <td>${quantity}</td>
        <td>${minStock}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
      </tr>
    `;
  }).join('');
}

function getInventoryStatus(item) {
  const quantity = item.currentStock != null
    ? item.currentStock
    : item.stockQuantity != null
      ? item.stockQuantity
      : item.quantity != null
        ? item.quantity
        : 0;
  const minStock = item.minStock != null ? item.minStock : 0;
  if (quantity <= 0) {
    return 'out';
  }
  if (minStock && quantity < minStock) {
    return 'low';
  }
  return 'normal';
}

function getInventoryStatusLabel(status) {
  if (status === 'out') {
    return 'Hết hàng';
  }
  if (status === 'low') {
    return 'Sắp hết';
  }
  return 'Đủ hàng';
}

function getInventoryStatusClass(status) {
  if (status === 'out') {
    return 'danger';
  }
  if (status === 'low') {
    return 'warning';
  }
  return 'success';
}

function initTaxesPage() {
  const searchInput = document.getElementById('taxSearch');
  const statusSelect = document.getElementById('taxStatusFilter');
  const addBtn = document.getElementById('btnAddTax');
  const tbody = document.getElementById('taxesTableBody');
  if (!searchInput || !statusSelect || !addBtn || !tbody) {
    return;
  }
  searchInput.addEventListener('input', () => {
    taxFilters.q = searchInput.value.trim();
    loadTaxes();
  });
  statusSelect.addEventListener('change', () => {
    taxFilters.isActive = statusSelect.value;
    loadTaxes();
  });
  addBtn.addEventListener('click', handleAddTax);
  tbody.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) {
      return;
    }
    const id = button.getAttribute('data-id');
    const action = button.getAttribute('data-action');
    if (!id || !action) {
      return;
    }
    if (action === 'edit') {
      handleEditTax(id);
    } else if (action === 'delete') {
      handleDeleteTax(id);
    }
  });
  loadTaxes();
}

async function loadTaxes() {
  const tbody = document.getElementById('taxesTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '<tr><td colspan="5" class="text-center">Đang tải dữ liệu thuế...</td></tr>';
  try {
    const params = {};
    if (taxFilters.q) {
      params.q = taxFilters.q;
    }
    if (taxFilters.isActive === 'true' || taxFilters.isActive === 'false') {
      params.isActive = taxFilters.isActive;
    }
    const url = config.buildUrlWithQuery(config.endpoints.TAXES, params);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to load taxes');
    }
    const data = await response.json();
    taxesData = Array.isArray(data) ? data : [];
    renderTaxes(taxesData);
  } catch (error) {
    console.error('Error loading taxes:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không thể tải dữ liệu thuế</td></tr>';
  }
}

function renderTaxes(list) {
  const tbody = document.getElementById('taxesTableBody');
  if (!tbody) {
    return;
  }
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có dữ liệu thuế</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(tax => {
    const id = tax.taxId != null ? tax.taxId : tax.id;
    const code = tax.taxCode || tax.code || '';
    const name = tax.taxName || tax.name || '';
    const rate = tax.taxRate != null ? tax.taxRate : tax.rate != null ? tax.rate : 0;
    const isActive = tax.isActive !== false;
    const statusText = isActive ? 'Hoạt động' : 'Ngừng hoạt động';
    const statusClass = isActive ? 'success' : 'danger';
    return `
      <tr>
        <td><strong>${code}</strong></td>
        <td>${name}</td>
        <td>${rate}%</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn-link" data-action="edit" data-id="${id}">Sửa</button>
          <button class="btn-link danger" data-action="delete" data-id="${id}">Xóa</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleAddTax() {
  const code = prompt('Nhập mã thuế');
  if (!code) {
    return;
  }
  const name = prompt('Nhập tên thuế');
  if (!name) {
    return;
  }
  const rateInput = prompt('Nhập thuế suất (%)');
  const rate = parseFloat(rateInput);
  if (isNaN(rate)) {
    alert('Thuế suất không hợp lệ');
    return;
  }
  const payload = {
    taxCode: code.trim(),
    taxName: name.trim(),
    taxRate: rate,
    isActive: true
  };
  try {
    const response = await fetch(config.getUrl(config.endpoints.TAXES), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Failed to create tax');
    }
    await loadTaxes();
  } catch (error) {
    console.error('Error creating tax:', error);
    alert('Không thể tạo thuế mới');
  }
}

async function handleEditTax(id) {
  const tax = taxesData.find(item => {
    const taxId = item.taxId != null ? item.taxId : item.id;
    return String(taxId) === String(id);
  });
  if (!tax) {
    return;
  }
  const currentCode = tax.taxCode || tax.code || '';
  const currentName = tax.taxName || tax.name || '';
  const currentRate = tax.taxRate != null ? tax.taxRate : tax.rate != null ? tax.rate : 0;
  const currentActive = tax.isActive !== false;
  const code = prompt('Cập nhật mã thuế', currentCode);
  if (!code) {
    return;
  }
  const name = prompt('Cập nhật tên thuế', currentName);
  if (!name) {
    return;
  }
  const rateInput = prompt('Cập nhật thuế suất (%)', String(currentRate));
  const rate = parseFloat(rateInput);
  if (isNaN(rate)) {
    alert('Thuế suất không hợp lệ');
    return;
  }
  const isActive = confirm(currentActive ? 'Giữ trạng thái hoạt động cho thuế này?' : 'Kích hoạt thuế này?');
  const payload = {
    taxCode: code.trim(),
    taxName: name.trim(),
    taxRate: rate,
    isActive
  };
  try {
    const url = config.getUrl(config.endpoints.TAX_BY_ID, { id });
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Failed to update tax');
    }
    await loadTaxes();
  } catch (error) {
    console.error('Error updating tax:', error);
    alert('Không thể cập nhật thuế');
  }
}

async function handleDeleteTax(id) {
  if (!confirm('Bạn có chắc muốn xóa thuế này?')) {
    return;
  }
  try {
    const url = config.getUrl(config.endpoints.TAX_BY_ID, { id });
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to delete tax');
    }
    await loadTaxes();
  } catch (error) {
    console.error('Error deleting tax:', error);
    alert('Không thể xóa thuế');
  }
}

// ===== UTILITY FUNCTIONS =====
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

