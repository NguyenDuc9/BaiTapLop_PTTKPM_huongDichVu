import config from '../config/config.js';

let currentUser = {
  name: 'Admin',
  role: 'Quản trị viên',
  isAdmin: true
};

let promotions = [];

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const mobileToggle = document.getElementById('mobileToggle');
const logoutBtn = document.getElementById('logoutBtn');
const currentDateTime = document.getElementById('currentDateTime');
const pageTitle = document.getElementById('pageTitle');

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initPromotionPage();
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

function initPromotionPage() {
  const promotionTableBody = document.getElementById('promotionTableBody');
  if (!promotionTableBody) {
    return;
  }

  const promotionSearchInput = document.getElementById('promotionSearchInput');
  const promotionStatusFilter = document.getElementById('promotionStatusFilter');
  const btnOpenAddPromotionModal = document.getElementById('btnOpenAddPromotionModal');
  const addPromotionModal = document.getElementById('addPromotionModal');
  const promotionDetailModal = document.getElementById('promotionDetailModal');

  if (promotionSearchInput) {
    promotionSearchInput.addEventListener('input', () => {
      renderPromotionTable(promotionTableBody, promotions, promotionSearchInput, promotionStatusFilter);
    });
  }

  if (promotionStatusFilter) {
    promotionStatusFilter.addEventListener('change', () => {
      loadPromotions(promotionTableBody, promotionSearchInput, promotionStatusFilter);
    });
  }

  if (btnOpenAddPromotionModal && addPromotionModal) {
    const closeButtons = addPromotionModal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        addPromotionModal.classList.remove('open');
      });
    });

    btnOpenAddPromotionModal.addEventListener('click', () => {
      resetPromotionForm();
      addPromotionModal.classList.add('open');
    });

    const btnSavePromotion = document.getElementById('btnSavePromotion');
    if (btnSavePromotion) {
      btnSavePromotion.addEventListener('click', async () => {
        await handleSavePromotion(addPromotionModal, promotionTableBody, promotionSearchInput, promotionStatusFilter);
      });
    }
  }

  if (promotionDetailModal) {
    const closeButtons = promotionDetailModal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        promotionDetailModal.classList.remove('open');
      });
    });
  }

  promotionTableBody.addEventListener('click', e => {
    const target = e.target;
    const viewBtn = target.closest('.btn-view');
    if (viewBtn) {
      const id = parseInt(viewBtn.getAttribute('data-id'), 10);
      if (id && promotionDetailModal) {
        openPromotionDetail(id, promotionDetailModal);
      }
    }
  });

  loadPromotions(promotionTableBody, promotionSearchInput, promotionStatusFilter);
}

function buildPromotionQueryParams(statusFilter) {
  const params = {};
  if (statusFilter) {
    if (statusFilter === 'active') {
      params.isActive = true;
    } else if (statusFilter === 'inactive') {
      params.isActive = false;
    }
  }
  return params;
}

async function loadPromotions(tableBody, searchInput, statusFilter) {
  if (!tableBody) {
    return;
  }

  const statusValue = statusFilter ? statusFilter.value : '';
  const params = buildPromotionQueryParams(statusValue);
  const url = config.buildUrlWithQuery(config.endpoints.PROMOTIONS, params);

  tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Đang tải dữ liệu khuyến mãi...</td></tr>';

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
      console.error('Load promotions failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Không tải được danh sách khuyến mãi.';
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center">${message}</td></tr>`;
      return;
    }

    promotions = Array.isArray(rawResult) ? rawResult : [];
    renderPromotionTable(tableBody, promotions, searchInput, statusFilter);
  } catch (error) {
    console.error('Error loading promotions:', error);
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Có lỗi khi tải dữ liệu khuyến mãi.</td></tr>';
  }
}

function renderPromotionTable(tableBody, data, searchInput, statusFilter) {
  if (!tableBody) {
    return;
  }

  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const statusValue = statusFilter ? statusFilter.value : '';

  let filtered = Array.isArray(data) ? data.slice() : [];

  if (searchTerm) {
    filtered = filtered.filter(p => {
      const code = (p.promotionCode || '').toLowerCase();
      const name = (p.promotionName || '').toLowerCase();
      return code.includes(searchTerm) || name.includes(searchTerm);
    });
  }

  if (statusValue === 'active') {
    filtered = filtered.filter(p => p.isActive !== false);
  } else if (statusValue === 'inactive') {
    filtered = filtered.filter(p => p.isActive === false);
  }

  if (!filtered.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Không có khuyến mãi nào.</td></tr>';
    return;
  }

  const rows = filtered.map(p => {
    const discountType = formatDiscountType(p.discountType);
    const discountValue = formatDiscountValue(p.discountType, p.discountValue);
    const applyTo = formatApplyTo(p.applyTo);
    const timeRange = formatTimeRange(p.startDate, p.endDate);
    const statusBadge = p.isActive === false
      ? '<span class="status-badge danger">Ngừng áp dụng</span>'
      : '<span class="status-badge success">Đang áp dụng</span>';

    return `
      <tr>
        <td>${p.promotionCode || ''}</td>
        <td>${p.promotionName || ''}</td>
        <td>${discountType}</td>
        <td>${discountValue}</td>
        <td>${applyTo}</td>
        <td>${timeRange}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn-link btn-view" data-id="${p.promotionId || ''}">Xem</button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = rows.join('');
}

function formatDiscountType(type) {
  const t = (type || '').toUpperCase();
  if (t === 'PERCENT') {
    return 'Giảm theo %';
  }
  if (t === 'AMOUNT') {
    return 'Giảm số tiền';
  }
  return t || '';
}

function formatDiscountValue(type, value) {
  const t = (type || '').toUpperCase();
  const v = Number(value) || 0;
  if (t === 'PERCENT') {
    return `${v}%`;
  }
  return formatCurrency(v);
}

function formatApplyTo(applyTo) {
  const a = (applyTo || '').toUpperCase();
  if (a === 'ORDER' || a === 'INVOICE') {
    return 'Đơn hàng';
  }
  if (a === 'CATEGORY') {
    return 'Nhóm hàng';
  }
  if (a === 'PRODUCT') {
    return 'Sản phẩm';
  }
  return a || '';
}

function formatTimeRange(start, end) {
  const startStr = formatDate(start);
  const endStr = end ? formatDate(end) : 'Không giới hạn';
  if (!startStr && !endStr) {
    return '';
  }
  return `${startStr} - ${endStr}`;
}

function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('vi-VN');
}

function formatCurrency(value) {
  const v = Number(value) || 0;
  return v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

function resetPromotionForm() {
  const codeInput = document.getElementById('promotionCode');
  const nameInput = document.getElementById('promotionName');
  const descriptionInput = document.getElementById('promotionDescription');
  const discountTypeSelect = document.getElementById('discountType');
  const discountValueInput = document.getElementById('discountValue');
  const minOrderAmountInput = document.getElementById('minOrderAmount');
  const applyToSelect = document.getElementById('applyTo');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const isActiveInput = document.getElementById('isActive');
  const categoryIdsInput = document.getElementById('categoryIds');
  const productIdsInput = document.getElementById('productIds');

  if (codeInput) codeInput.value = '';
  if (nameInput) nameInput.value = '';
  if (descriptionInput) descriptionInput.value = '';
  if (discountTypeSelect) discountTypeSelect.value = '';
  if (discountValueInput) discountValueInput.value = '';
  if (minOrderAmountInput) minOrderAmountInput.value = '';
  if (applyToSelect) applyToSelect.value = 'ORDER';
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  if (isActiveInput) isActiveInput.checked = true;
  if (categoryIdsInput) categoryIdsInput.value = '';
  if (productIdsInput) productIdsInput.value = '';
}

function parseIdList(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !Number.isNaN(n));
}

async function handleSavePromotion(addPromotionModal, tableBody, searchInput, statusFilter) {
  const codeInput = document.getElementById('promotionCode');
  const nameInput = document.getElementById('promotionName');
  const descriptionInput = document.getElementById('promotionDescription');
  const discountTypeSelect = document.getElementById('discountType');
  const discountValueInput = document.getElementById('discountValue');
  const minOrderAmountInput = document.getElementById('minOrderAmount');
  const applyToSelect = document.getElementById('applyTo');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const isActiveInput = document.getElementById('isActive');
  const categoryIdsInput = document.getElementById('categoryIds');
  const productIdsInput = document.getElementById('productIds');

  const promotionCode = codeInput ? codeInput.value.trim() : '';
  const promotionName = nameInput ? nameInput.value.trim() : '';
  const description = descriptionInput ? descriptionInput.value.trim() : '';
  const discountType = discountTypeSelect ? discountTypeSelect.value : '';
  const discountValue = discountValueInput ? Number(discountValueInput.value) || 0 : 0;
  const minOrderAmount = minOrderAmountInput && minOrderAmountInput.value
    ? Number(minOrderAmountInput.value)
    : null;
  const applyTo = applyToSelect ? applyToSelect.value : 'ORDER';
  const startDate = startDateInput ? startDateInput.value : '';
  const endDate = endDateInput ? endDateInput.value || null : null;
  const isActive = isActiveInput ? isActiveInput.checked : true;
  const categoryIds = parseIdList(categoryIdsInput ? categoryIdsInput.value : '');
  const productIds = parseIdList(productIdsInput ? productIdsInput.value : '');

  if (!promotionCode || !promotionName || !discountType || !discountValue || !applyTo || !startDate) {
    alert('Vui lòng nhập đầy đủ các trường bắt buộc.');
    return;
  }

  const dto = {
    promotionCode,
    promotionName,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    applyTo,
    startDate,
    endDate,
    isActive,
    categoryIds,
    productIds
  };

  const url = config.getUrl(config.endpoints.PROMOTIONS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(dto)
    });

    let rawResult;
    const text = await response.text();
    try {
      rawResult = text ? JSON.parse(text) : null;
    } catch {
      rawResult = text;
    }

    if (!response.ok) {
      console.error('Create promotion failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Tạo khuyến mãi thất bại, vui lòng thử lại.';
      alert(message);
      return;
    }

    alert('Tạo khuyến mãi thành công');
    if (addPromotionModal) {
      addPromotionModal.classList.remove('open');
    }
    await loadPromotions(tableBody, searchInput, statusFilter);
  } catch (error) {
    console.error('Error creating promotion:', error);
    alert('Có lỗi khi tạo khuyến mãi, vui lòng thử lại.');
  }
}

async function openPromotionDetail(id, detailModal) {
  const url = config.getUrl(config.endpoints.PROMOTION_BY_ID, { id });

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
      console.error('Load promotion detail failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Không tải được chi tiết khuyến mãi.';
      alert(message);
      return;
    }

    const promotion = rawResult || {};

    const codeInput = document.getElementById('detailPromotionCode');
    const nameInput = document.getElementById('detailPromotionName');
    const descriptionInput = document.getElementById('detailPromotionDescription');
    const discountTypeInput = document.getElementById('detailDiscountType');
    const discountValueInput = document.getElementById('detailDiscountValue');
    const minOrderAmountInput = document.getElementById('detailMinOrderAmount');
    const applyToInput = document.getElementById('detailApplyTo');
    const timeRangeInput = document.getElementById('detailTimeRange');
    const statusInput = document.getElementById('detailStatus');
    const categoryIdsInput = document.getElementById('detailCategoryIds');
    const productIdsInput = document.getElementById('detailProductIds');

    if (codeInput) codeInput.value = promotion.promotionCode || '';
    if (nameInput) nameInput.value = promotion.promotionName || '';
    if (descriptionInput) descriptionInput.value = promotion.description || '';
    if (discountTypeInput) discountTypeInput.value = formatDiscountType(promotion.discountType);
    if (discountValueInput) discountValueInput.value = formatDiscountValue(promotion.discountType, promotion.discountValue);
    if (minOrderAmountInput) minOrderAmountInput.value = promotion.minOrderAmount != null ? formatCurrency(promotion.minOrderAmount) : '';
    if (applyToInput) applyToInput.value = formatApplyTo(promotion.applyTo);
    if (timeRangeInput) timeRangeInput.value = formatTimeRange(promotion.startDate, promotion.endDate);
    if (statusInput) statusInput.value = promotion.isActive === false ? 'Ngừng áp dụng' : 'Đang áp dụng';
    if (categoryIdsInput) categoryIdsInput.value = Array.isArray(promotion.categoryIds) ? promotion.categoryIds.join(', ') : '';
    if (productIdsInput) productIdsInput.value = Array.isArray(promotion.productIds) ? promotion.productIds.join(', ') : '';

    if (detailModal) {
      detailModal.classList.add('open');
    }
  } catch (error) {
    console.error('Error loading promotion detail:', error);
    alert('Có lỗi khi tải chi tiết khuyến mãi, vui lòng thử lại.');
  }
}

