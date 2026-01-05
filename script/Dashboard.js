import config from '../config/config.js';

// ========================
// CONSTANTS & CONFIG
// ========================
const REFRESH_INTERVAL = 300000; // 5 minutes
const DATETIME_UPDATE_INTERVAL = 1000; // 1 second
const PAGE_TITLES = {
  'dashboard': 'Dashboard',
  'product-list': 'Danh sách sản phẩm',
  'product-add': 'Thêm sản phẩm',
  'category': 'Danh mục sản phẩm',
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

// ========================
// SALES CHART MANAGER
// ========================
class SalesChartManager {
  constructor(apiService) {
    this.api = apiService;
    this.chart = null;
    this.canvas = document.getElementById('salesChart');
  }

  /**
   * Lấy dữ liệu biểu đồ từ API
   */
  async fetchChartData(date) {
    try {
      // Thêm endpoint vào config.js của bạn: REVENUE_CHART: '/revenue/chart'
      const url = `${config.getUrl(config.endpoints.REVENUE_CHART)}?date=${encodeURIComponent(date)}`;
      const result = await this.api.fetch(url);
      return result;
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  }


  /**
   * Format tiền VND cho tooltip
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Khởi tạo biểu đồ
   */
  initChart(data) {
    if (!this.canvas) {
      console.error('Canvas element not found');
      return;
    }

    // Hủy biểu đồ cũ nếu có
    if (this.chart) {
      this.chart.destroy();
    }

    const chartData = data.chart;
    const ctx = this.canvas.getContext('2d');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: chartData.datasets[0].label || 'Doanh thu',
          data: chartData.datasets[0].data,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#4f46e5',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 13,
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => {
                return 'Doanh thu: ' + this.formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                }
                return value.toLocaleString('vi-VN');
              },
              font: {
                size: 12
              },
              padding: 8
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            }
          },
          x: {
            ticks: {
              font: {
                size: 12
              },
              padding: 8
            },
            grid: {
              display: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  /**
   * Hiển thị loading state
   */
  showLoading() {
    const cardBody = this.canvas?.parentElement;
    if (!cardBody) return;

    cardBody.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
        <div style="text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #4f46e5;"></i>
          <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">Đang tải dữ liệu...</p>
        </div>
      </div>
    `;
  }

  /**
   * Hiển thị lỗi
   */
  showError(message) {
    const cardBody = this.canvas?.parentElement;
    if (!cardBody) return;

    cardBody.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
        <div style="text-align: center; color: #dc2626;">
          <i class="fas fa-exclamation-triangle" style="font-size: 32px;"></i>
          <p style="margin-top: 16px; font-size: 14px;">${message}</p>
            Thử lại
        </div>
      </div>
    `;
  }

  /**
   * Load và hiển thị biểu đồ
   */
  async load(date) {
    try {
      const formattedDate = typeof date === 'string' ? date : Utils.formatDate(date);
      // Reset canvas
      const cardBody = this.canvas?.parentElement;
      if (cardBody) {
        cardBody.innerHTML = '<canvas id="salesChart"></canvas>';
        this.canvas = document.getElementById('salesChart');
      }

      // Lấy dữ liệu
      const result = await this.fetchChartData(formattedDate);

      // Kiểm tra kết quả
      if (result.success && result.data) {
        this.initChart(result.data);
      } else {
        this.showError("Vui lòng tính doanh thu ngày trước");
        throw new Error('Không có bất kì bản ghi doanh thu nào');
      }

    } catch (error) {
      console.error('Error loading chart:', error);
      this.showError('Không thể tải biểu đồ. Vui lòng thử lại sau.');
    }
  }

  /**
   * Reload biểu đồ
   */
  async reload(date) {
    await this.load(date);
  }

  /**
   * Destroy biểu đồ
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

// ========================
// INVENTORY WARNING MANAGER
// ========================
class InventoryWarningManager {
  constructor(apiService) {
    this.api = apiService;
    this.tableBody = document.getElementById('hangTon');
    this.currentPage = 1;

    this.createPaginationControls();
  }

  /* ======================
     PAGINATION UI
  ====================== */
  createPaginationControls() {
    const card = this.tableBody?.closest('.dashboard-card');
    if (!card) return;

    const div = document.createElement('div');
    div.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 12px;
    `;

    div.innerHTML = `
      <button id="prevPage">Prev</button>
      <span id="pageInfo">Page 1</span>
      <button id="nextPage">Next</button>
    `;

    card.appendChild(div);

    this.paginationDiv = div;
    this.prevBtn = div.querySelector('#prevPage');
    this.nextBtn = div.querySelector('#nextPage');
    this.pageInfo = div.querySelector('#pageInfo');

    this.prevBtn.onclick = () => this.load(this.currentPage - 1);
    this.nextBtn.onclick = () => this.load(this.currentPage + 1);
  }

  /* ======================
     API
  ====================== */
  async fetchInventoryWarnings(page) {
    const url = `${config.getUrl(config.endpoints.INVENTORY_WARNINGS)}?pageNumber=${page}`;
    try {
      return await this.api.fetch(url);
    } catch (err) {
      return {
        error: true,
        message: err.message || 'Không tìm thấy sản phẩm tồn kho'
      };
    }
  }

  /* ======================
     RENDER
  ====================== */
  renderTable(data) {
    this.tableBody.innerHTML = '';

    if (data?.error || !Array.isArray(data) || data.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:red">
            ${data?.message || 'Không có sản phẩm tồn kho thấp'}
          </td>
        </tr>
      `;
      return;
    }

    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.productId}</td>
        <td>${item.productName}</td>
        <td>${item.categoryName}</td>
        <td>${item.quantity}</td>
        <td>${new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
      `;
      this.tableBody.appendChild(row);
    });
  }

  /* ======================
     LOAD
  ====================== */
  async load(page = 1) {
    if (page < 1) return;

    const data = await this.fetchInventoryWarnings(page);

    this.currentPage = page;
    this.renderTable(data);

    const hasData = Array.isArray(data) && data.length > 0;

    this.paginationDiv.style.display = 'flex';
    this.pageInfo.textContent = `Page ${this.currentPage}`;
    this.prevBtn.disabled = this.currentPage === 1;
    this.nextBtn.disabled = !hasData;
  }
}

// ========================
// TOP PRODUCT MANAGER
// ========================
class TopProductManager {
  constructor(apiService) {
    this.api = apiService;
    this.tableBody = document.getElementById('topProducts');
  }

  /* ======================
     API
  ====================== */
  async fetchTopProducts() {
    const url = config.getUrl(config.endpoints.TOP_PRODUCTS);
    try {
      return await this.api.fetch(url);
    } catch (err) {
      return {
        error: true,
        message: err.message || 'Không tìm thấy sản phẩm bán chạy'
      };
    }
  }

  /* ======================
     RENDER
  ====================== */
  renderTable(data) {
    this.tableBody.innerHTML = '';

    // TRƯỜNG HỢP LỖI / KHÔNG CÓ DỮ LIỆU
    if (data?.error || !Array.isArray(data) || data.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:red">
            ${data?.message || 'Không có dữ liệu'}
          </td>
        </tr>
      `;
      return;
    }

    // HIỂN THỊ ĐÚNG THỨ TỰ SERVER TRẢ VỀ
    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.productId}</td>
        <td>${item.productName}</td>
        <td>${item.categoryName}</td>
        <td>${item.quantity}</td>
        <td>${new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
      `;
      this.tableBody.appendChild(row);
    });
  }

  /* ======================
     LOAD
  ====================== */
  async load() {
    const data = await this.fetchTopProducts();
    this.renderTable(data);
  }
}




// ========================
// STATE MANAGEMENT
// ========================
class AppState {
  constructor() {
    this.currentUser = {
      id: 3,
      name: 'Admin',
      role: 'Quản trị viên',
      isAdmin: true
    };
    this.currentPage = 1;
    this.notificationPage = 1;
  }

  loadUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
    return this.currentUser;
  }

  saveUser(user) {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  clearUser() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }
}

// ========================
// DOM MANAGER
// ========================
class DOMManager {
  constructor() {
    this.elements = {
      sidebar: document.getElementById('sidebar'),
      toggleBtn: document.getElementById('toggleSidebar'),
      mobileToggle: document.getElementById('mobileToggle'),
      navItems: document.querySelectorAll('.nav-item a'),
      hasSubmenuItems: document.querySelectorAll('.has-submenu'),
      logoutBtn: document.getElementById('logoutBtn'),
      pageTitle: document.getElementById('pageTitle'),
      currentDateTime: document.getElementById('currentDateTime'),
      notificationBtn: document.querySelector('.notification-btn'),
      notificationDropdown: document.getElementById('notification-dropdown'),
      notificationBadge: document.querySelector('.badge'),
      notificationList: document.getElementById('notification-list'),
      nextBtn: document.getElementById('nextBtn'),
      prevBtn: document.getElementById('prevBtn'),
      selectPeriod: document.querySelector('[data-role="select-period"]'),
      rebuildBtn: document.querySelector('[data-role="btn-rebuild"]'),
      inputs: {
        day: document.querySelector('[data-role="input-day"]'),
        week: document.querySelector('[data-role="input-week"]'),
        month: document.querySelector('[data-role="input-month"]'),
        year: document.querySelector('[data-role="input-year"]')
      }
    };
  }

  hideElement(element) {
    if (element) element.hidden = true;
  }

  showElement(element) {
    if (element) element.hidden = false;
  }

  updateText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = text;
  }
}

// ========================
// API SERVICE
// ========================
class APIService {
  constructor(authToken) {
    this.authToken = authToken;
  }

  async fetch(url, options = {}) {
    try {
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      };

      const response = await fetch(url, { ...defaultOptions, ...options });
      const result = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: result.message || 'Unknown server error'
        };
      }

      return result;
    } catch (error) {
      // Nếu là lỗi network hoặc parse JSON
      if (error instanceof TypeError) {
        throw {
          status: 0,
          message: 'Lỗi kết nối mạng'
        };
      }
      // Re-throw lỗi từ server
      throw error;
    }
  }

  async getStatisticsByDay(date) {
    const url = `${config.getUrl(config.endpoints.DASHBOARD_DAY)}?date=${encodeURIComponent(date)}`;
    return this.fetch(url);
  }

  async getStatisticsByWeek(week, year) {
    const url = `${config.getUrl(config.endpoints.DASHBOARD_WEEK)}?weekNumber=${encodeURIComponent(week)}&year=${encodeURIComponent(year)}`;
    return this.fetch(url);
  }

  async getStatisticsByMonth(month) {
    const url = `${config.getUrl(config.endpoints.DASHBOARD_MONTH)}?monthNumber=${encodeURIComponent(month)}`;
    return this.fetch(url);
  }

  async getNotifications(receiverID, pageNumber) {
    const url = `${config.getUrl(config.endpoints.SELECTED_NOTIFICATIONS)}?receiverID=${encodeURIComponent(receiverID)}&pageNumber=${encodeURIComponent(pageNumber)}`;
    return this.fetch(url);
  }

  async deleteNotification(notificationId) {
    const url = `${config.getUrl(config.endpoints.DELETED_NOTIFICATION)}?id=${encodeURIComponent(notificationId)}`;
    return this.fetch(url, { method: 'DELETE' });
  }

  async calculateRevenueChange(type, lastPeriod, currentPeriod, year = null) {
    let url;
    if (type === 'day') {
      url = `${config.getUrl(config.endpoints.CalculateRevenueOfDay)}?type=${encodeURIComponent(type)}&lastDate=${encodeURIComponent(lastPeriod)}&currentDate=${encodeURIComponent(currentPeriod)}`;
    } else {
      url = `${config.getUrl(config.endpoints.CalculateRevenueOfWeekAndMonth)}?type=${encodeURIComponent(type)}&lastDate=${encodeURIComponent(lastPeriod)}&currentDate=${encodeURIComponent(currentPeriod)}&year=${encodeURIComponent(year)}`;
    }
    const response = await fetch(url);
    return response.json();
  }
}

// ========================
// UTILITY FUNCTIONS
// ========================
class Utils {
  static formatCurrency(amount, short = false) {
    if (short && amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M đ';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  static formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
      throw new Error('Invalid Date');
    }
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  }

  static formatDateTime(date) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return date.toLocaleDateString('vi-VN', options);
  }

  static getPreviousDate(date) {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    return prev;
  }
}

// ========================
// UI MANAGER
// ========================
class UIManager {
  constructor(domManager) {
    this.dom = domManager;
  }

  updateStatistics(data) {
    alert("Dữ liệu mới được cập nhập");
    this.dom.updateText('todayRevenue', Utils.formatCurrency(data.revenue));
    this.dom.updateText('todayOrders', data.orderQuantity);
    this.dom.updateText('totalProducts', data.totalProducts);
    this.dom.updateText('totalCustomers', data.customers);
  }

  updateRevenueChange(data) {
    const changeElement = document.querySelector('.stat-change');
    if (!changeElement) return;

    // Nếu data có message (lỗi)
    if (data && data.message) {
      changeElement.innerHTML = data.message;
      changeElement.className = 'stat-change';
      return;
    }

    // Lấy giá trị: hoặc từ percentChange hoặc trực tiếp từ data
    let value;
    if (typeof data === 'number') {
      value = data; // API trả về trực tiếp số
    } else if (data && data.percentChange !== undefined) {
      value = data.percentChange; // API trả về object
    } else {
      changeElement.innerHTML = '0';
      changeElement.className = 'stat-change';
      return;
    }


    // Hiển thị giá trị
    if (value > 0) {
      changeElement.innerHTML = `<i class="fas fa-arrow-up"></i> +${value}`;
      changeElement.className = 'stat-change positive';
    } else if (value < 0) {
      changeElement.innerHTML = `<i class="fas fa-arrow-down"></i> ${"Cần tính doanh thu ngày hôm qua"}`;
      changeElement.className = 'stat-change negative';
    } else {
      changeElement.innerHTML = `<i class="fas fa-minus"></i> 0`;
      changeElement.className = 'stat-change';
    }
  }

  updateNotifications(result) {
    const { notificationList, notificationBadge, nextBtn, prevBtn } = this.dom.elements;

    notificationList.innerHTML = '';

    // Kiểm tra nếu có message lỗi hoặc không phải array
    if (result.message || !Array.isArray(result)) {
      notificationBadge.textContent = '0';
      nextBtn.style.display = 'none';
      prevBtn.style.display = 'none';

      // Hiển thị thông báo lỗi trong dropdown
      const noDataItem = document.createElement('li');
      noDataItem.textContent = result.message || 'Không có thông báo';
      noDataItem.style.textAlign = 'center';
      noDataItem.style.color = 'var(--text-secondary)';
      noDataItem.style.padding = '1rem';
      notificationList.appendChild(noDataItem);
      return;
    }

    // Nếu không có thông báo
    if (result.length === 0) {
      notificationBadge.textContent = '0';
      const noDataItem = document.createElement('li');
      noDataItem.textContent = 'Không có thông báo mới';
      noDataItem.style.textAlign = 'center';
      noDataItem.style.color = 'var(--text-secondary)';
      noDataItem.style.padding = '1rem';
      notificationList.appendChild(noDataItem);
      return;
    }

    // Hiển thị số lượng thông báo
    notificationBadge.textContent = result.length;

    // Render từng thông báo
    result.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.content;
      li.dataset.notificationId = item.id;
      li.classList.add('notification-item');
      notificationList.appendChild(li);
    });
  }

  showError(message) {
    console.error(message);
    alert(message);
  }

  updateDateTime() {
    const { currentDateTime } = this.dom.elements;
    if (currentDateTime) {
      currentDateTime.textContent = Utils.formatDateTime(new Date());
    }
  }

  updatePageTitle(page) {
    const { pageTitle } = this.dom.elements;
    if (pageTitle) {
      pageTitle.textContent = PAGE_TITLES[page] || 'Dashboard';
    }
  }

  toggleSidebar() {
    const { sidebar } = this.dom.elements;
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }

  openMobileSidebar() {
    this.dom.elements.sidebar.classList.toggle('mobile-open');
  }

  closeMobileSidebar() {
    this.dom.elements.sidebar.classList.remove('mobile-open');
  }

  restoreSidebarState() {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true') {
      this.dom.elements.sidebar.classList.add('collapsed');
    }
  }

  hideAllPeriodInputs() {
    Object.values(this.dom.elements.inputs).forEach(input => {
      this.dom.hideElement(input);
    });
  }

  showPeriodInputs(period) {
    const { inputs } = this.dom.elements;

    this.hideAllPeriodInputs();

    switch (period) {
      case 'day':
        this.dom.showElement(inputs.day);
        break;
      case 'week':
        this.dom.showElement(inputs.week);
        this.dom.showElement(inputs.year);
        break;
      case 'month':
        this.dom.showElement(inputs.month);
        break;
    }
  }
}

// ========================
// NOTIFICATION MANAGER
// ========================
class NotificationManager {
  constructor(apiService, uiManager, state) {
    this.api = apiService;
    this.ui = uiManager;
    this.state = state;
    this.isOpen = false;
  }

  async load() {
    try {
      const result = await this.api.getNotifications(
        this.state.currentUser.id,
        this.state.notificationPage
      );
      this.ui.updateNotifications(result);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Hiển thị message lỗi từ API hoặc message mặc định
      this.ui.updateNotifications({
        message: error.message || 'Không thể tải thông báo'
      });
    }
  }

  async delete(notificationId, liElement) {
    try {
      await this.api.deleteNotification(notificationId);
      liElement.remove();

      const badge = this.ui.dom.elements.notificationBadge;
      badge.textContent = Number(badge.textContent) - 1;
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  toggle() {
    const { notificationDropdown, nextBtn, prevBtn } = this.ui.dom.elements;

    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      notificationDropdown.classList.remove('hidden');
      nextBtn.style.display = 'inline-block';
      prevBtn.style.display = 'inline-block';
      this.state.notificationPage = 1;
      this.load();
    } else {
      this.close();
    }
  }

  close() {
    const { notificationDropdown, nextBtn, prevBtn } = this.ui.dom.elements;
    notificationDropdown.classList.add('hidden');
    nextBtn.style.display = 'none';
    prevBtn.style.display = 'none';
    this.isOpen = false;
  }

  nextPage() {
    this.state.notificationPage++;
    this.load();
  }

  prevPage() {
    if (this.state.notificationPage > 1) {
      this.state.notificationPage--;
      this.load();
    }
  }
}

// ========================
// DASHBOARD MANAGER
// ========================
class DashboardManager {
  constructor(apiService, uiManager, salesChartManager) {
    this.api = apiService;
    this.ui = uiManager;
    this.chart = salesChartManager;
  }

  async loadByDay(date) {
    try {
      const formattedDate = typeof date === 'string' ? date : Utils.formatDate(date);
      const result = await this.api.getStatisticsByDay(formattedDate);
      this.ui.updateStatistics(result);

      const yesterday = Utils.getPreviousDate(new Date(formattedDate));
      const yesterdayFormatted = Utils.formatDate(yesterday);
      await this.loadRevenueChange('day', yesterdayFormatted, formattedDate);
    } catch (error) {
      console.error('Error loading day statistics:', error);
      this.ui.showError("Không thể tính được ngày trong tương lai");
    }
  }

  async loadByWeek(week, year) {
    try {
      const result = await this.api.getStatisticsByWeek(week, year);
      this.ui.updateStatistics(result);
      await this.loadRevenueChange('week', week - 1, week, year);
    } catch (error) {
      console.error('Error loading week statistics:', error);
      this.ui.showError("Không thể tính được tuần trong tương lai");
    }
  }

  async loadByMonth(month) {
    try {
      const result = await this.api.getStatisticsByMonth(month);
      this.ui.updateStatistics(result);

      const currentYear = new Date().getFullYear();
      await this.loadRevenueChange('month', month - 1, month, currentYear);
    } catch (error) {
      console.error('Error loading month statistics:', error);
      this.ui.showError("Không thể tính được tháng trong tương lai");
    }
  }

  async loadRevenueChange(type, lastPeriod, currentPeriod, year = null) {
    try {
      const data = await this.api.calculateRevenueChange(type, lastPeriod, currentPeriod, year);
      this.ui.updateRevenueChange(data);
    } catch (error) {
      console.error('Error calculating revenue change:', error);
    }
  }

  async loadDefault() {
    try {
      const today = Utils.formatDate(new Date());
      await this.loadByDay(today);
      await this.chart.reload(today);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.ui.showError('Có lỗi khi tải dữ liệu dashboard');
    }
  }
}

// ========================
// EVENT HANDLER
// ========================
class EventHandler {
  constructor(domManager, uiManager, state, dashboardManager, notificationManager, salesChartManager) {
    this.dom = domManager;
    this.ui = uiManager;
    this.state = state;
    this.dashboard = dashboardManager;
    this.notification = notificationManager;
    this.chart = salesChartManager;
  }

  setupAll() {
    this.setupSidebar();
    this.setupNavigation();
    this.setupSubmenu();
    this.setupLogout();
    this.setupNotifications();
    this.setupPeriodSelector();
    this.setupRebuild();
  }

  setupSidebar() {
    const { toggleBtn, mobileToggle } = this.dom.elements;

    toggleBtn.addEventListener('click', () => this.ui.toggleSidebar());
    mobileToggle.addEventListener('click', () => this.ui.openMobileSidebar());
  }

  setupNavigation() {
    const { navItems } = this.dom.elements;

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const page = item.getAttribute('data-page');
        if (page) {
          e.preventDefault();
          this.navigateToPage(page, item);

          if (window.innerWidth <= 768) {
            this.ui.closeMobileSidebar();
          }
        }
      });
    });
  }

  navigateToPage(page, item) {
    console.log(`Navigating to: ${page}`);
    this.ui.updatePageTitle(page);

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    item.closest('.nav-item').classList.add('active');
  }

  setupSubmenu() {
    const { hasSubmenuItems } = this.dom.elements;

    hasSubmenuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (!item.getAttribute('data-page')) {
          e.preventDefault();
          const submenuId = item.getAttribute('data-submenu');
          const submenu = document.getElementById(submenuId);

          submenu.classList.toggle('open');
          item.classList.toggle('active');

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
  }

  setupLogout() {
    const { logoutBtn } = this.dom.elements;

    logoutBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đăng xuất?')) {
        this.state.clearUser();
        window.location.href = '../auth/Login.html';
      }
    });
  }

  setupNotifications() {
    const { notificationBtn, notificationDropdown, nextBtn, prevBtn, notificationList } = this.dom.elements;

    notificationDropdown.classList.add('hidden');
    nextBtn.style.display = 'none';
    prevBtn.style.display = 'none';

    notificationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.notification.toggle();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.notification.nextPage();
    });

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.notification.prevPage();
    });

    notificationList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) {
        const notificationId = li.dataset.notificationId;
        this.notification.delete(notificationId, li);
      }
    });

    document.addEventListener('click', (e) => {
      if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
        this.notification.close();
      }
    });
  }

  setupPeriodSelector() {
    const { selectPeriod } = this.dom.elements;

    this.ui.hideAllPeriodInputs();

    selectPeriod.addEventListener('change', () => {
      this.ui.showPeriodInputs(selectPeriod.value);
    });
  }

  setupRebuild() {
    const { rebuildBtn } = this.dom.elements;

    rebuildBtn.addEventListener('click', () => {
      this.handleRebuild();
    });
  }

  handleRebuild() {
    try {
      const { selectPeriod, inputs } = this.dom.elements;
      const type = selectPeriod.value;

      if (!type) {
        throw new Error('Chưa chọn loại thống kê');
      }

      if (type === 'day') {
        const day = inputs.day.value;
        if (!day) throw new Error('Vui lòng chọn ngày');
        this.dashboard.loadByDay(day);
        this.chart.reload(day);

      } else if (type === 'week') {
        const week = inputs.week.value;
        const year = inputs.year.value;
        if (!week || !year) throw new Error('Vui lòng nhập đầy đủ tuần và năm');
        this.dashboard.loadByWeek(week, year);
      } else if (type === 'month') {
        const month = inputs.month.value;
        if (!month) throw new Error('Vui lòng chọn tháng');
        this.dashboard.loadByMonth(month);
      } else {
        throw new Error('Loại thống kê không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi rebuild thống kê:', error);
      alert(error.message);
    }
  }
}

// ========================
// APPLICATION MAIN
// ========================
class DashboardApp {
  constructor() {
    this.state = new AppState();
    this.domManager = new DOMManager();
    this.apiService = new APIService(this.state.getAuthToken());
    this.uiManager = new UIManager(this.domManager);

    // Create SalesChartManager FIRST
    this.salesChartManager = new SalesChartManager(this.apiService);

    // Then create DashboardManager (which needs salesChartManager)
    this.dashboardManager = new DashboardManager(
      this.apiService,
      this.uiManager,
      this.salesChartManager
    );

    this.notificationManager = new NotificationManager(
      this.apiService,
      this.uiManager,
      this.state
    );

    this.inventoryWarningManager = new InventoryWarningManager(this.apiService);
    this.topProductManager = new TopProductManager(this.apiService);

    this.eventHandler = new EventHandler(
      this.domManager,
      this.uiManager,
      this.state,
      this.dashboardManager,
      this.notificationManager,
      this.salesChartManager
    );
  }

  init() {
    // Load user
    this.state.loadUser();
    this.updateUserInfo();
    this.toggleAdminFeatures();

    // Setup UI
    this.uiManager.restoreSidebarState();
    this.eventHandler.setupAll();

    // Load data
    this.dashboardManager.loadDefault();
    setInterval(() => this.dashboardManager.loadDefault(), REFRESH_INTERVAL);
    this.inventoryWarningManager.load();
    this.topProductManager.load();

    // Update datetime
    this.uiManager.updateDateTime();
    setInterval(() => this.uiManager.updateDateTime(), DATETIME_UPDATE_INTERVAL);
  }

  updateUserInfo() {
    this.domManager.updateText('userName', this.state.currentUser.name);
    this.domManager.updateText('userRole', this.state.currentUser.role);
  }

  toggleAdminFeatures() {
    if (!this.state.currentUser.isAdmin) {
      document.querySelectorAll('.admin-only').forEach(item => {
        item.style.display = 'none';
      });
    }
  }
}

// ========================
// INITIALIZATION
// ========================
document.addEventListener('DOMContentLoaded', () => {
  const app = new DashboardApp();
  app.init();

  // Export for external use
  window.dashboardApp = {
    loadDashboardData: () => app.dashboardManager.loadDefault(),
    navigateToPage: (page) => app.eventHandler.navigateToPage(page),
    currentUser: app.state.currentUser,
    chartManager: app.salesChartManager,
    inventoryWarningManager: app.inventoryWarningManager,
    topProductManager: app.topProductManager
  };
});