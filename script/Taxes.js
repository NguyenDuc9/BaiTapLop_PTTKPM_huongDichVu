import config from '../config/config.js';

let currentUser = {
  name: 'Admin',
  role: 'Quản trị viên',
  isAdmin: true
};

let taxes = [];
let editingTaxId = null;

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const mobileToggle = document.getElementById('mobileToggle');
const logoutBtn = document.getElementById('logoutBtn');
const currentDateTime = document.getElementById('currentDateTime');

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initTaxesPage();
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

function initTaxesPage() {
  const taxSearch = document.getElementById('taxSearch');
  const taxStatusFilter = document.getElementById('taxStatusFilter');
  const taxesTableBody = document.getElementById('taxesTableBody');
  const btnAddTax = document.getElementById('btnAddTax');

  if (!taxesTableBody) {
    return;
  }

  if (taxSearch) {
    taxSearch.addEventListener('input', () => {
      const term = taxSearch.value.toLowerCase();
      filterTaxesTable(term, taxStatusFilter, taxesTableBody);
    });
  }

  if (taxStatusFilter) {
    taxStatusFilter.addEventListener('change', () => {
      const term = taxSearch ? taxSearch.value.toLowerCase() : '';
      filterTaxesTable(term, taxStatusFilter, taxesTableBody);
    });
  }

  taxesTableBody.addEventListener('click', e => {
    const target = e.target;
    const editBtn = target.closest('.btn-edit-tax');
    const deleteBtn = target.closest('.btn-delete-tax');

    if (editBtn) {
      const id = parseInt(editBtn.getAttribute('data-id'), 10);
      const tax = taxes.find(t => t.id === id);
      if (!tax) {
        return;
      }
      openTaxForm(tax);
    } else if (deleteBtn) {
      const id = parseInt(deleteBtn.getAttribute('data-id'), 10);
      handleDeleteTax(id, taxesTableBody);
    }
  });

  if (btnAddTax) {
    btnAddTax.addEventListener('click', () => {
      openTaxForm(null);
    });
  }

  loadTaxes(taxesTableBody, taxSearch, taxStatusFilter);
}

function filterTaxesTable(term, statusSelect, tbody) {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (!rows.length) {
    return;
  }

  const statusValue = statusSelect ? statusSelect.value : '';

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (!cells.length || cells.length < 5) {
      return;
    }

    const codeText = cells[0].textContent.toLowerCase();
    const nameText = cells[1].textContent.toLowerCase();
    const statusText = cells[3].textContent.toLowerCase();

    const matchesSearch = !term || codeText.includes(term) || nameText.includes(term);
    let matchesStatus = true;
    if (statusValue === 'true') {
      matchesStatus = statusText.includes('hoạt động');
    } else if (statusValue === 'false') {
      matchesStatus = statusText.includes('ngừng');
    }

    if (matchesSearch && matchesStatus) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

async function loadTaxes(tbody, searchInput, statusSelect) {
  try {
    const query = {};
    const term = searchInput ? searchInput.value.trim() : '';
    const statusValue = statusSelect ? statusSelect.value : '';

    if (term) {
      query.q = term;
    }
    if (statusValue) {
      query.isActive = statusValue;
    }

    const url = config.buildUrlWithQuery(config.endpoints.TAXES, query);
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
    taxes = Array.isArray(data)
      ? data.map(t => ({
          id: t.taxId || t.id,
          code: t.taxCode || t.code,
          name: t.taxName || t.name,
          rate: t.taxRate != null ? t.taxRate : t.rate,
          isActive: t.isActive !== false
        }))
      : [];

    renderTaxesTable(tbody, taxes);
  } catch (error) {
    console.error('Error loading taxes:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không tải được dữ liệu thuế</td></tr>';
  }
}

function renderTaxesTable(tbody, list) {
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có dữ liệu thuế</td></tr>';
    return;
  }

  const rows = list.map(t => {
    const isActive = t.isActive !== false;
    const statusText = isActive ? 'Hoạt động' : 'Ngừng hoạt động';
    const statusClass = isActive ? 'success' : 'danger';

    return `
      <tr data-id="${t.id}">
        <td>${t.code || ''}</td>
        <td>${t.name || ''}</td>
        <td>${t.rate != null ? formatPercent(t.rate) : ''}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn-small btn-edit-tax" data-id="${t.id}">Sửa</button>
          <button class="btn-small btn-danger btn-delete-tax" data-id="${t.id}">Xóa</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rows.join('');
}

function openTaxForm(tax) {
  const code = prompt('Mã thuế', tax ? tax.code || '' : '');
  if (code === null) {
    editingTaxId = null;
    return;
  }
  const name = prompt('Tên thuế', tax ? tax.name || '' : '');
  if (name === null) {
    editingTaxId = null;
    return;
  }
  const rateInput = prompt('Thuế suất (%)', tax && tax.rate != null ? String(tax.rate) : '');
  if (rateInput === null) {
    editingTaxId = null;
    return;
  }
  const rate = parseFloat(rateInput);
  if (isNaN(rate) || rate < 0) {
    alert('Thuế suất không hợp lệ');
    editingTaxId = null;
    return;
  }

  let isActive = true;
  if (tax) {
    const activeInput = prompt('Trạng thái (1=Hoạt động, 0=Ngừng hoạt động)', tax.isActive !== false ? '1' : '0');
    if (activeInput === null) {
      editingTaxId = null;
      return;
    }
    isActive = activeInput === '1';
  }

  const dto = {
    taxCode: code,
    taxName: name,
    taxRate: rate,
    isActive
  };

  if (tax && tax.id) {
    editingTaxId = tax.id;
  } else {
    editingTaxId = null;
  }

  saveTax(dto);
}

async function saveTax(dto) {
  const isEdit = editingTaxId != null;
  const endpoint = isEdit ? config.endpoints.TAX_BY_ID : config.endpoints.TAXES;
  const method = isEdit ? 'PUT' : 'POST';
  const url = isEdit
    ? config.getUrl(endpoint, { id: editingTaxId })
    : config.getUrl(endpoint);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(dto)
    });

    const text = await response.text();
    let rawResult;
    try {
      rawResult = text ? JSON.parse(text) : null;
    } catch {
      rawResult = text;
    }

    if (!response.ok) {
      console.error('Save tax failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Lưu thuế thất bại, vui lòng thử lại.';
      alert(message);
      editingTaxId = null;
      return;
    }

    alert('Lưu thuế thành công');
    editingTaxId = null;

    const taxesTableBody = document.getElementById('taxesTableBody');
    const taxSearch = document.getElementById('taxSearch');
    const taxStatusFilter = document.getElementById('taxStatusFilter');
    if (taxesTableBody) {
      await loadTaxes(taxesTableBody, taxSearch, taxStatusFilter);
    }
  } catch (error) {
    console.error('Error saving tax:', error);
    alert('Có lỗi khi lưu thuế, vui lòng thử lại.');
    editingTaxId = null;
  }
}

async function handleDeleteTax(id, tbody) {
  if (!id) {
    return;
  }
  if (!confirm('Bạn có chắc muốn xóa thuế này?')) {
    return;
  }

  const url = config.getUrl(config.endpoints.TAX_BY_ID, { id });

  try {
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
      console.error('Delete tax failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Xóa thuế thất bại, vui lòng thử lại.';
      alert(message);
      return;
    }

    alert('Xóa thuế thành công');
    taxes = taxes.filter(t => t.id !== id);
    renderTaxesTable(tbody, taxes);
  } catch (error) {
    console.error('Error deleting tax:', error);
    alert('Có lỗi khi xóa thuế, vui lòng thử lại.');
  }
}

function formatPercent(value) {
  const n = parseFloat(value);
  if (isNaN(n)) {
    return '';
  }
  return n.toFixed(2).replace(/\.?0+$/, '') + '%';
}

