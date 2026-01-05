import config from '../config/config.js';

let currentUser = {
  name: 'Admin',
  role: 'Quản trị viên',
  isAdmin: true
};

let inventoryItems = [];
let isInventorySubmitting = false;

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const mobileToggle = document.getElementById('mobileToggle');
const logoutBtn = document.getElementById('logoutBtn');
const currentDateTime = document.getElementById('currentDateTime');

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initWarehousePage();
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

function initWarehousePage() {
  const inventoryTableBody = document.getElementById('inventoryTableBody');
  if (!inventoryTableBody) {
    return;
  }

  const inventorySearch = document.getElementById('inventorySearch');
  const inventoryStatusFilter = document.getElementById('inventoryStatusFilter');
  const btnCreateInventory = document.getElementById('btnCreateInventory');
  const btnAdjustInventory = document.getElementById('btnAdjustInventory');
  const btnCreateImportReceipt = document.getElementById('btnCreateImportReceipt');
  const btnCreateExportReceipt = document.getElementById('btnCreateExportReceipt');
  const btnOpenImportModalTop = document.getElementById('btnOpenImportModalTop');
  const btnOpenExportModalTop = document.getElementById('btnOpenExportModalTop');
  const importReceiptModal = document.getElementById('importReceiptModal');
  const exportReceiptModal = document.getElementById('exportReceiptModal');
  const btnSaveImportReceipt = document.getElementById('btnSaveImportReceipt');
  const btnSaveExportReceipt = document.getElementById('btnSaveExportReceipt');

  if (inventorySearch) {
    inventorySearch.addEventListener('input', () => {
      loadInventory(inventoryTableBody, inventorySearch, inventoryStatusFilter);
    });
  }

  if (inventoryStatusFilter) {
    inventoryStatusFilter.addEventListener('change', () => {
      renderInventoryTable(inventoryTableBody, inventoryItems, inventoryStatusFilter);
    });
  }

  inventoryTableBody.addEventListener('click', e => {
    const row = e.target.closest('tr[data-id]');
    if (!row) {
      return;
    }
    const id = parseInt(row.getAttribute('data-id'), 10);
    if (!id) {
      return;
    }
    openInventoryDetail(id);
  });

  if (btnCreateInventory) {
    btnCreateInventory.addEventListener('click', () => {
      handleCreateInventory(inventoryTableBody, inventorySearch, inventoryStatusFilter);
    });
  }

  if (btnAdjustInventory) {
    btnAdjustInventory.addEventListener('click', () => {
      handleAdjustInventory(inventoryTableBody, inventorySearch, inventoryStatusFilter);
    });
  }

  if (importReceiptModal && (btnCreateImportReceipt || btnOpenImportModalTop)) {
    const openImportModal = () => {
      const codeInput = document.getElementById('importReceiptCode');
      const dateInput = document.getElementById('importReceiptDate');
      const supplierInput = document.getElementById('importSupplier');
      const warehouseInput = document.getElementById('importWarehouse');
      const totalInput = document.getElementById('importTotalAmount');
      const noteInput = document.getElementById('importNote');
      const statusSelect = document.getElementById('importStatusSelect');
      if (codeInput) codeInput.value = '';
      if (dateInput) dateInput.value = '';
      if (supplierInput) supplierInput.value = '';
      if (warehouseInput) warehouseInput.value = '';
      if (totalInput) totalInput.value = '';
      if (noteInput) noteInput.value = '';
      if (statusSelect) statusSelect.value = 'draft';
      importReceiptModal.classList.add('open');
    };

    if (btnCreateImportReceipt) {
      btnCreateImportReceipt.addEventListener('click', openImportModal);
    }

    if (btnOpenImportModalTop) {
      btnOpenImportModalTop.addEventListener('click', openImportModal);
    }

    const closeButtons = importReceiptModal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        importReceiptModal.classList.remove('open');
      });
    });
  }

  if (exportReceiptModal && (btnCreateExportReceipt || btnOpenExportModalTop)) {
    const openExportModal = () => {
      const codeInput = document.getElementById('exportReceiptCode');
      const dateInput = document.getElementById('exportReceiptDate');
      const warehouseInput = document.getElementById('exportWarehouse');
      const totalInput = document.getElementById('exportTotalAmount');
      const noteInput = document.getElementById('exportNote');
      const statusSelect = document.getElementById('exportStatusSelect');
      if (codeInput) codeInput.value = '';
      if (dateInput) dateInput.value = '';
      if (warehouseInput) warehouseInput.value = '';
      if (totalInput) totalInput.value = '';
      if (noteInput) noteInput.value = '';
      if (statusSelect) statusSelect.value = 'draft';
      exportReceiptModal.classList.add('open');
    };

    if (btnCreateExportReceipt) {
      btnCreateExportReceipt.addEventListener('click', openExportModal);
    }

    if (btnOpenExportModalTop) {
      btnOpenExportModalTop.addEventListener('click', openExportModal);
    }

    const closeButtons = exportReceiptModal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        exportReceiptModal.classList.remove('open');
      });
    });
  }

  if (btnSaveImportReceipt && importReceiptModal) {
    btnSaveImportReceipt.addEventListener('click', () => {
      importReceiptModal.classList.remove('open');
    });
  }

  if (btnSaveExportReceipt && exportReceiptModal) {
    btnSaveExportReceipt.addEventListener('click', () => {
      exportReceiptModal.classList.remove('open');
    });
  }

  loadInventory(inventoryTableBody, inventorySearch, inventoryStatusFilter);
}

async function fetchInventoryList(params = {}) {
  const url = config.buildUrlWithQuery(config.endpoints.INVENTORY, params);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  if (!response.ok) {
    const text = await response.text();
    let rawResult;
    try {
      rawResult = text ? JSON.parse(text) : null;
    } catch {
      rawResult = text;
    }
    throw new Error(rawResult && rawResult.message ? rawResult.message : 'Không tải được dữ liệu tồn kho');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function fetchInventoryDetail(id) {
  const url = config.getUrl(config.endpoints.INVENTORY_BY_ID, { id });
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  const text = await response.text();
  let rawResult;
  try {
    rawResult = text ? JSON.parse(text) : null;
  } catch {
    rawResult = text;
  }
  if (!response.ok) {
    throw new Error(rawResult && rawResult.message ? rawResult.message : 'Không tải được chi tiết tồn kho');
  }
  return rawResult;
}

async function createInventory(payload) {
  const url = config.getUrl(config.endpoints.INVENTORY);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let rawResult;
  try {
    rawResult = text ? JSON.parse(text) : null;
  } catch {
    rawResult = text;
  }
  if (!response.ok) {
    throw new Error(rawResult && rawResult.message ? rawResult.message : 'Tạo tồn kho thất bại');
  }
  return rawResult;
}

async function updateInventory(id, payload) {
  const url = config.getUrl(config.endpoints.INVENTORY_BY_ID, { id });
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let rawResult;
  try {
    rawResult = text ? JSON.parse(text) : null;
  } catch {
    rawResult = text;
  }
  if (!response.ok) {
    throw new Error(rawResult && rawResult.message ? rawResult.message : 'Cập nhật tồn kho thất bại');
  }
  return rawResult;
}

async function deleteInventoryRecord(id) {
  const url = config.getUrl(config.endpoints.INVENTORY_BY_ID, { id });
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  const text = await response.text();
  let rawResult;
  try {
    rawResult = text ? JSON.parse(text) : null;
  } catch {
    rawResult = text;
  }
  if (!response.ok) {
    throw new Error(rawResult && rawResult.message ? rawResult.message : 'Xóa tồn kho thất bại');
  }
  return rawResult;
}

async function loadInventory(tbody, searchInput, statusSelect) {
  if (!tbody) {
    return;
  }
  const query = {};
  const term = searchInput ? searchInput.value.trim() : '';
  if (term) {
    query.q = term;
  }
  try {
    const list = await fetchInventoryList(query);
    inventoryItems = list.map(item => ({
      id: item.inventoryId || item.id,
      productId: item.productId,
      productCode: item.productCode || item.code,
      productName: item.productName || item.name,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseName || '',
      quantityOnHand: item.quantityOnHand != null ? item.quantityOnHand : 0,
      minStock: item.minStock != null ? item.minStock : 0,
      status: item.status || ''
    }));
    renderInventoryTable(tbody, inventoryItems, statusSelect);
  } catch (error) {
    console.error('Error loading inventory:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không tải được dữ liệu tồn kho</td></tr>';
  }
}

function renderInventoryTable(tbody, items, statusSelect) {
  if (!Array.isArray(items) || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có dữ liệu tồn kho</td></tr>';
    return;
  }

  const statusFilter = statusSelect ? statusSelect.value : '';

  const rows = items
    .filter(item => {
      const quantity = item.quantityOnHand || 0;
      const minStock = item.minStock || 0;
      let computedStatus = 'normal';
      if (quantity <= 0) {
        computedStatus = 'out';
      } else if (minStock > 0 && quantity <= minStock) {
        computedStatus = 'low';
      }
      if (!statusFilter) {
        return true;
      }
      return computedStatus === statusFilter;
    })
    .map(item => {
      const quantity = item.quantityOnHand || 0;
      const minStock = item.minStock || 0;
      const statusTextLower = (item.status || '').toLowerCase();
      const isLocked = statusTextLower.includes('lock');
      let displayStatusText = '';
      let displayStatusClass = '';
      if (isLocked) {
        displayStatusText = 'Khoá';
        displayStatusClass = 'neutral';
      } else if (quantity <= 0) {
        displayStatusText = 'Hết hàng';
        displayStatusClass = 'danger';
      } else if (minStock > 0 && quantity <= minStock) {
        displayStatusText = 'Sắp hết hàng';
        displayStatusClass = 'warning';
      } else {
        displayStatusText = 'Bình thường';
        displayStatusClass = 'success';
      }

      return `
        <tr data-id="${item.id}">
          <td>${item.productCode || ''}</td>
          <td>${item.productName || ''}</td>
          <td>${item.warehouseName || ''}</td>
          <td>${quantity}</td>
          <td>${minStock}</td>
          <td><span class="status-badge ${displayStatusClass}">${displayStatusText}</span></td>
        </tr>
      `;
    });

  tbody.innerHTML = rows.join('');
}

async function openInventoryDetail(id) {
  try {
    const detail = await fetchInventoryDetail(id);
    const productName = detail.productName || detail.name || '';
    const warehouseName = detail.warehouseName || '';
    const quantityOnHand = detail.quantityOnHand != null ? detail.quantityOnHand : 0;
    const quantityReserved = detail.quantityReserved != null ? detail.quantityReserved : 0;
    const minStock = detail.minStock != null ? detail.minStock : 0;
    const status = detail.status || '';
    const lines = [];
    lines.push('Chi tiết tồn kho');
    lines.push('ID: ' + id);
    if (productName) {
      lines.push('Sản phẩm: ' + productName);
    }
    if (warehouseName) {
      lines.push('Kho: ' + warehouseName);
    }
    lines.push('Tồn hiện tại: ' + quantityOnHand);
    if (quantityReserved) {
      lines.push('Đã giữ: ' + quantityReserved);
    }
    if (minStock) {
      lines.push('Tồn tối thiểu: ' + minStock);
    }
    if (status) {
      lines.push('Trạng thái: ' + status);
    }
    alert(lines.join('\n'));
  } catch (error) {
    console.error('Error loading inventory detail:', error);
    alert(error.message || 'Không tải được chi tiết tồn kho');
  }
}

async function handleCreateInventory(tbody, searchInput, statusSelect) {
  if (isInventorySubmitting) {
    return;
  }
  const productIdInput = prompt('Nhập productId cho tồn kho mới');
  if (productIdInput === null) {
    return;
  }
  const productId = parseInt(productIdInput, 10);
  if (!productId) {
    alert('productId không hợp lệ');
    return;
  }
  const warehouseIdInput = prompt('Nhập warehouseId');
  if (warehouseIdInput === null) {
    return;
  }
  const warehouseId = parseInt(warehouseIdInput, 10);
  if (!warehouseId) {
    alert('warehouseId không hợp lệ');
    return;
  }
  const quantityInput = prompt('Nhập quantityOnHand ban đầu');
  if (quantityInput === null) {
    return;
  }
  const quantityOnHand = parseInt(quantityInput, 10);
  if (isNaN(quantityOnHand) || quantityOnHand < 0) {
    alert('Số lượng không hợp lệ');
    return;
  }
  const minStockInput = prompt('Nhập tồn tối thiểu (có thể bỏ trống)', '');
  let minStock = 0;
  if (minStockInput !== null && minStockInput.trim() !== '') {
    const parsed = parseInt(minStockInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      minStock = parsed;
    }
  }

  const payload = {
    productId,
    warehouseId,
    quantityOnHand,
    minStock
  };

  try {
    isInventorySubmitting = true;
    await createInventory(payload);
    alert('Tạo tồn kho thành công');
    await loadInventory(tbody, searchInput, statusSelect);
  } catch (error) {
    console.error('Error creating inventory:', error);
    alert(error.message || 'Tạo tồn kho thất bại');
  } finally {
    isInventorySubmitting = false;
  }
}

async function handleAdjustInventory(tbody, searchInput, statusSelect) {
  if (isInventorySubmitting) {
    return;
  }
  const idInput = prompt('Nhập ID dòng tồn kho cần điều chỉnh/xóa');
  if (idInput === null) {
    return;
  }
  const id = parseInt(idInput, 10);
  if (!id) {
    alert('ID không hợp lệ');
    return;
  }
  try {
    const detail = await fetchInventoryDetail(id);
    const statusText = (detail.status || '').toLowerCase();
    const isLocked = statusText.includes('lock');
    if (isLocked) {
      alert('Record tồn kho đang ở trạng thái khoá, không thể chỉnh sửa/xóa.');
      return;
    }
    const action = prompt('Chọn thao tác: 1=Điều chỉnh số lượng, 2=Xóa record', '1');
    if (action === null) {
      return;
    }
    if (action === '2') {
      if (!confirm('Bạn có chắc muốn xóa record tồn kho này?')) {
        return;
      }
      isInventorySubmitting = true;
      await deleteInventoryRecord(id);
      alert('Xóa tồn kho thành công');
      await loadInventory(tbody, searchInput, statusSelect);
      return;
    }
    const currentQuantity = detail.quantityOnHand != null ? detail.quantityOnHand : 0;
    const currentMinStock = detail.minStock != null ? detail.minStock : 0;
    const quantityInput = prompt('Nhập quantityOnHand mới', String(currentQuantity));
    if (quantityInput === null) {
      return;
    }
    const quantityOnHand = parseInt(quantityInput, 10);
    if (isNaN(quantityOnHand) || quantityOnHand < 0) {
      alert('Số lượng không hợp lệ');
      return;
    }
    const minStockInput = prompt('Nhập tồn tối thiểu mới (có thể bỏ trống)', String(currentMinStock));
    let minStock = currentMinStock;
    if (minStockInput !== null && minStockInput.trim() !== '') {
      const parsed = parseInt(minStockInput, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        minStock = parsed;
      }
    }
    const payload = Object.assign({}, detail, {
      quantityOnHand,
      minStock
    });
    isInventorySubmitting = true;
    await updateInventory(id, payload);
    alert('Cập nhật tồn kho thành công');
    await loadInventory(tbody, searchInput, statusSelect);
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    alert(error.message || 'Điều chỉnh tồn kho thất bại');
  } finally {
    isInventorySubmitting = false;
  }
}
