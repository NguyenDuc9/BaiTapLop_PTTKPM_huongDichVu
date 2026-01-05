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
  initReportsPage();
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

function initReportsPage() {
  const salesTableBody = document.getElementById('reportSalesTableBody');
  const inventoryTableBody = document.getElementById('reportInventoryTableBody');
  const customerTableBody = document.getElementById('reportCustomerTableBody');
  const salesFromDateInput = document.getElementById('reportSalesFromDate');
  const salesToDateInput = document.getElementById('reportSalesToDate');
  const inventoryAsOfDateInput = document.getElementById('reportInventoryAsOfDate');
  const customerFromDateInput = document.getElementById('reportCustomerFromDate');
  const customerToDateInput = document.getElementById('reportCustomerToDate');

  if (!salesTableBody && !inventoryTableBody && !customerTableBody) {
    return;
  }

  initDefaultDates(salesFromDateInput, salesToDateInput, inventoryAsOfDateInput, customerFromDateInput, customerToDateInput);

  if (salesFromDateInput) {
    salesFromDateInput.addEventListener('change', () => {
      loadSalesReport();
    });
  }

  if (salesToDateInput) {
    salesToDateInput.addEventListener('change', () => {
      loadSalesReport();
    });
  }

  if (inventoryAsOfDateInput) {
    inventoryAsOfDateInput.addEventListener('change', () => {
      loadInventoryReport();
    });
  }

  if (customerFromDateInput) {
    customerFromDateInput.addEventListener('change', () => {
      loadCustomerReport();
    });
  }

  if (customerToDateInput) {
    customerToDateInput.addEventListener('change', () => {
      loadCustomerReport();
    });
  }

  loadSalesReport();
  loadInventoryReport();
  loadCustomerReport();
}

function initDefaultDates(salesFrom, salesTo, inventoryAsOf, customerFrom, customerTo) {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const todayStr = formatDateInputValue(today);
  const sevenDaysAgoStr = formatDateInputValue(sevenDaysAgo);

  if (salesFrom && !salesFrom.value) {
    salesFrom.value = sevenDaysAgoStr;
  }
  if (salesTo && !salesTo.value) {
    salesTo.value = todayStr;
  }
  if (inventoryAsOf && !inventoryAsOf.value) {
    inventoryAsOf.value = todayStr;
  }
  if (customerFrom && !customerFrom.value) {
    customerFrom.value = sevenDaysAgoStr;
  }
  if (customerTo && !customerTo.value) {
    customerTo.value = todayStr;
  }
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function loadSalesReport() {
  const tableBody = document.getElementById('reportSalesTableBody');
  const totalEl = document.getElementById('reportSalesTotal');
  const ordersEl = document.getElementById('reportSalesOrders');
  const fromInput = document.getElementById('reportSalesFromDate');
  const toInput = document.getElementById('reportSalesToDate');

  if (!tableBody) {
    return;
  }

  const params = {};
  if (fromInput && fromInput.value) {
    params.fromDate = fromInput.value;
  }
  if (toInput && toInput.value) {
    params.toDate = toInput.value;
  }

  const url = config.buildUrlWithQuery(config.endpoints.REPORT_SALES, params);

  tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Đang tải dữ liệu báo cáo doanh thu...</td></tr>';

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
      console.error('Load sales report failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Không tải được báo cáo doanh thu.';
      tableBody.innerHTML = `<tr><td colspan="3" class="text-center">${message}</td></tr>`;
      if (totalEl) {
        totalEl.textContent = formatCurrency(0);
      }
      if (ordersEl) {
        ordersEl.textContent = '0';
      }
      return;
    }

    let items = [];
    let totalRevenue = 0;
    let totalOrders = 0;

    if (Array.isArray(rawResult)) {
      items = rawResult;
    } else if (rawResult && Array.isArray(rawResult.items)) {
      items = rawResult.items;
      if (typeof rawResult.totalRevenue === 'number') {
        totalRevenue = rawResult.totalRevenue;
      }
      if (typeof rawResult.totalOrders === 'number') {
        totalOrders = rawResult.totalOrders;
      }
    }

    if (!items.length) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Chưa có dữ liệu báo cáo</td></tr>';
      if (totalEl) {
        totalEl.textContent = formatCurrency(totalRevenue);
      }
      if (ordersEl) {
        ordersEl.textContent = String(totalOrders);
      }
      return;
    }

    if (!totalRevenue || !totalOrders) {
      items.forEach(item => {
        const orders = getNumberValue(item.orderCount ?? item.orders ?? item.totalOrders);
        const revenue = getNumberValue(item.revenue ?? item.totalAmount ?? item.amount);
        totalOrders += orders;
        totalRevenue += revenue;
      });
    }

    const rows = items.map(item => {
      const date = item.date || item.day || item.dateString || '';
      const orders = getNumberValue(item.orderCount ?? item.orders ?? item.totalOrders);
      const revenue = getNumberValue(item.revenue ?? item.totalAmount ?? item.amount);
      return `
        <tr>
          <td>${formatDisplayDate(date)}</td>
          <td>${orders}</td>
          <td>${formatCurrency(revenue)}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = rows.join('');

    if (totalEl) {
      totalEl.textContent = formatCurrency(totalRevenue);
    }
    if (ordersEl) {
      ordersEl.textContent = String(totalOrders);
    }
  } catch (error) {
    console.error('Error loading sales report:', error);
    tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Có lỗi khi tải dữ liệu báo cáo.</td></tr>';
    if (totalEl) {
      totalEl.textContent = formatCurrency(0);
    }
    if (ordersEl) {
      ordersEl.textContent = '0';
    }
  }
}

async function loadInventoryReport() {
  const tableBody = document.getElementById('reportInventoryTableBody');
  const asOfInput = document.getElementById('reportInventoryAsOfDate');

  if (!tableBody) {
    return;
  }

  const params = {};
  if (asOfInput && asOfInput.value) {
    params.asOfDate = asOfInput.value;
  }

  const url = config.buildUrlWithQuery(config.endpoints.REPORT_INVENTORY, params);

  tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Đang tải dữ liệu báo cáo tồn kho...</td></tr>';

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
      console.error('Load inventory report failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Không tải được báo cáo tồn kho.';
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center">${message}</td></tr>`;
      return;
    }

    const items = Array.isArray(rawResult) ? rawResult : Array.isArray(rawResult.items) ? rawResult.items : [];

    if (!items.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có dữ liệu báo cáo tồn kho</td></tr>';
      return;
    }

    const rows = items.map(item => {
      const code = item.productCode || item.code || '';
      const name = item.productName || item.name || '';
      const stock = getNumberValue(item.quantity ?? item.stock ?? item.onHand);
      const minStock = getNumberValue(item.minStock ?? item.minQuantity ?? item.minimumStock);
      const status = stock <= 0
        ? '<span class="status-badge danger">Hết hàng</span>'
        : stock < minStock
          ? '<span class="status-badge warning">Sắp hết hàng</span>'
          : '<span class="status-badge success">Đủ hàng</span>';

      return `
        <tr>
          <td>${code}</td>
          <td>${name}</td>
          <td>${stock}</td>
          <td>${minStock}</td>
          <td>${status}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = rows.join('');
  } catch (error) {
    console.error('Error loading inventory report:', error);
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Có lỗi khi tải dữ liệu báo cáo tồn kho.</td></tr>';
  }
}

async function loadCustomerReport() {
  const tableBody = document.getElementById('reportCustomerTableBody');
  const fromInput = document.getElementById('reportCustomerFromDate');
  const toInput = document.getElementById('reportCustomerToDate');

  if (!tableBody) {
    return;
  }

  const params = {};
  if (fromInput && fromInput.value) {
    params.fromDate = fromInput.value;
  }
  if (toInput && toInput.value) {
    params.toDate = toInput.value;
  }

  const url = config.buildUrlWithQuery(config.endpoints.REPORT_CUSTOMER, params);

  tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Đang tải dữ liệu báo cáo khách hàng...</td></tr>';

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
      console.error('Load customer report failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Không tải được báo cáo khách hàng.';
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center">${message}</td></tr>`;
      return;
    }

    const items = Array.isArray(rawResult) ? rawResult : Array.isArray(rawResult.items) ? rawResult.items : [];

    if (!items.length) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Chưa có dữ liệu báo cáo khách hàng</td></tr>';
      return;
    }

    const rows = items.map(item => {
      const code = item.customerCode || item.code || '';
      const name = item.customerName || item.name || '';
      const orders = getNumberValue(item.orderCount ?? item.orders ?? item.totalOrders);
      const revenue = getNumberValue(item.totalRevenue ?? item.revenue ?? item.amount);

      return `
        <tr>
          <td>${code}</td>
          <td>${name}</td>
          <td>${orders}</td>
          <td>${formatCurrency(revenue)}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = rows.join('');
  } catch (error) {
    console.error('Error loading customer report:', error);
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Có lỗi khi tải dữ liệu báo cáo khách hàng.</td></tr>';
  }
}

function getNumberValue(value) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    return 0;
  }
  return n;
}

function formatCurrency(value) {
  const v = Number(value) || 0;
  return v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

function formatDisplayDate(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('vi-VN');
    }
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('vi-VN');
  }

  return String(value);
}
