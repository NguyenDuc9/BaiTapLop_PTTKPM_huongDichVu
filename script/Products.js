import config from '../config/config.js';

let currentUser = {
  name: 'Admin',
  role: 'Quản trị viên',
  isAdmin: true
};

let products = [];
let editingProductId = null;
const DEFAULT_WAREHOUSE_ID = 1;

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const mobileToggle = document.getElementById('mobileToggle');
const logoutBtn = document.getElementById('logoutBtn');
const currentDateTime = document.getElementById('currentDateTime');
const pageTitle = document.getElementById('pageTitle');

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initProductPage();
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

function initProductPage() {
  const productTableBody = document.getElementById('productTableBody');
  const productSearchInput = document.getElementById('productSearchInput');
  const productCategoryFilter = document.getElementById('productCategoryFilter');
  const productStatusFilter = document.getElementById('productStatusFilter');
  const btnOpenAddProductModal = document.getElementById('btnOpenAddProductModal');
  const addProductModal = document.getElementById('addProductModal');
  const productCodeInput = document.getElementById('productCode');
  const productNameInput = document.getElementById('productName');
  const productCategoryInput = document.getElementById('productCategory');
  const productUnitInput = document.getElementById('productUnit');
  const productCostInput = document.getElementById('productCost');
  const productPriceInput = document.getElementById('productPrice');
  const initialStockInput = document.getElementById('initialStock');
  const minStockInput = document.getElementById('minStock');
  const productDescriptionInput = document.getElementById('productDescription');
  const productActiveInput = document.getElementById('productActive');

  if (!productTableBody) {
    return;
  }

  if (productSearchInput) {
    productSearchInput.addEventListener('input', () => {
      const term = productSearchInput.value.toLowerCase();
      filterProductTable(term, productCategoryFilter, productStatusFilter, productTableBody);
    });
  }

  if (productCategoryFilter) {
    productCategoryFilter.addEventListener('change', () => {
      const term = productSearchInput ? productSearchInput.value.toLowerCase() : '';
      filterProductTable(term, productCategoryFilter, productStatusFilter, productTableBody);
    });
  }

  if (productStatusFilter) {
    productStatusFilter.addEventListener('change', () => {
      const term = productSearchInput ? productSearchInput.value.toLowerCase() : '';
      filterProductTable(term, productCategoryFilter, productStatusFilter, productTableBody);
    });
  }

  if (btnOpenAddProductModal && addProductModal) {
    const modalTitle = addProductModal.querySelector('.modal-header h3');
    const saveProductBtn = addProductModal.querySelector('.btn-primary');

    btnOpenAddProductModal.addEventListener('click', () => {
      editingProductId = null;
      if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Thêm sản phẩm mới';
      }
      if (saveProductBtn) {
        saveProductBtn.textContent = 'Lưu sản phẩm';
      }
      if (productCodeInput) productCodeInput.value = '';
      if (productNameInput) productNameInput.value = '';
      if (productCategoryInput) productCategoryInput.value = '';
      if (productUnitInput) productUnitInput.value = '';
      if (productCostInput) productCostInput.value = '';
      if (productPriceInput) productPriceInput.value = '';
      if (initialStockInput) {
        initialStockInput.value = '';
        initialStockInput.disabled = false;
      }
      if (minStockInput) minStockInput.value = '';
      if (productDescriptionInput) productDescriptionInput.value = '';
      if (productActiveInput) productActiveInput.checked = true;
      addProductModal.classList.add('open');
    });

    const closeButtons = addProductModal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        addProductModal.classList.remove('open');
      });
    });

    if (saveProductBtn) {
      saveProductBtn.addEventListener('click', async () => {
        await handleSaveProduct({
          addProductModal,
          productCodeInput,
          productNameInput,
          productCategoryInput,
          productUnitInput,
          productCostInput,
          productPriceInput,
          initialStockInput,
          minStockInput,
          productDescriptionInput,
          productActiveInput,
          productTableBody
        });
      });
    }
  }

  productTableBody.addEventListener('click', e => {
    const target = e.target;
    const editBtn = target.closest('.btn-edit');
    const deleteBtn = target.closest('.btn-delete');

    if (editBtn) {
      const id = parseInt(editBtn.getAttribute('data-id'), 10);
      const product = products.find(p => p.id === id);
      if (!product) {
        return;
      }
      if (addProductModal) {
        const modalTitle = addProductModal.querySelector('.modal-header h3');
        const saveProductBtn = addProductModal.querySelector('.btn-primary');
        editingProductId = product.id;
        if (modalTitle) {
          modalTitle.innerHTML = '<i class="fas fa-edit"></i> Cập nhật sản phẩm';
        }
        if (saveProductBtn) {
          saveProductBtn.textContent = 'Cập nhật';
        }
        if (productCodeInput) productCodeInput.value = product.code || '';
        if (productNameInput) productNameInput.value = product.name || '';
        if (productCategoryInput) productCategoryInput.value = product.categoryKey || '';
        if (productUnitInput) productUnitInput.value = product.unit || '';
        if (productCostInput) productCostInput.value = product.costPrice != null ? product.costPrice : '';
        if (productPriceInput) productPriceInput.value = product.price != null ? product.price : '';
        if (initialStockInput) {
          initialStockInput.value = '';
          initialStockInput.disabled = true;
        }
        if (minStockInput) minStockInput.value = product.minStock != null ? product.minStock : '';
        if (productDescriptionInput) productDescriptionInput.value = product.description || '';
        if (productActiveInput) productActiveInput.checked = product.isActive !== false;
        addProductModal.classList.add('open');
      }
    } else if (deleteBtn) {
      const id = parseInt(deleteBtn.getAttribute('data-id'), 10);
      handleDeleteProduct(id, productTableBody);
    }
  });

  loadProducts(productTableBody);
}

function filterProductTable(term, categorySelect, statusSelect, tbody) {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (!rows.length) {
    return;
  }

  const categoryValue = categorySelect ? categorySelect.value : '';
  const statusValue = statusSelect ? statusSelect.value : '';

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (!cells.length || cells.length < 7) {
      return;
    }

    const codeText = cells[0].textContent.toLowerCase();
    const nameText = cells[1].textContent.toLowerCase();
    const categoryText = cells[2].textContent.toLowerCase();
    const statusText = cells[5].textContent.toLowerCase();

    const matchesSearch = !term || codeText.includes(term) || nameText.includes(term);
    const matchesCategory = !categoryValue || categoryText.includes(categoryValue.toLowerCase());
    const matchesStatus = !statusValue || statusText.includes(statusValue.toLowerCase());

    if (matchesSearch && matchesCategory && matchesStatus) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

async function loadProducts(tbody) {
  try {
    const url = config.buildUrlWithQuery(config.endpoints.PRODUCTS, {});
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
    products = Array.isArray(data)
      ? data.map(p => ({
          id: p.productId,
          code: p.productCode,
          name: p.productName,
          categoryId: p.categoryId,
          categoryName: p.categoryName,
          categoryKey: mapCategoryNameToKey(p.categoryName),
          unit: p.unit,
          costPrice: p.costPrice,
          price: p.sellingPrice,
          stock: p.stockQuantity,
          minStock: p.minStock,
          description: p.description,
          isActive: p.isActive
        }))
      : [];

    renderProductTable(tbody, products);
  } catch (error) {
    console.error('Error loading products:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không tải được dữ liệu sản phẩm</td></tr>';
  }
}

function renderProductTable(tbody, list) {
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không có sản phẩm nào</td></tr>';
    return;
  }

  const rows = list.map(p => {
    const stock = p.stock != null ? p.stock : 0;
    const minStock = p.minStock != null ? p.minStock : 0;
    const isActive = p.isActive !== false;
    const isLowStock = isActive && stock > 0 && stock <= minStock;
    const statusText = isActive ? (isLowStock ? 'Sắp hết hàng' : 'Đang bán') : 'Ngừng bán';
    const statusClass = isActive ? (isLowStock ? 'warning' : 'success') : 'danger';

    return `
      <tr data-id="${p.id}">
        <td>${p.code || ''}</td>
        <td>${p.name || ''}</td>
        <td>${p.categoryName || ''}</td>
        <td>${p.price != null ? formatCurrency(p.price) : ''}</td>
        <td class="${isLowStock ? 'text-danger' : ''}">${stock}</td>
        <td>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
          <button class="btn-small btn-edit" data-id="${p.id}">Sửa</button>
          <button class="btn-small btn-danger btn-delete" data-id="${p.id}">Xóa</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rows.join('');
}

async function handleSaveProduct(deps) {
  const {
    addProductModal,
    productCodeInput,
    productNameInput,
    productCategoryInput,
    productUnitInput,
    productCostInput,
    productPriceInput,
    initialStockInput,
    minStockInput,
    productDescriptionInput,
    productActiveInput,
    productTableBody
  } = deps;

  const code = productCodeInput ? productCodeInput.value.trim() : '';
  const name = productNameInput ? productNameInput.value.trim() : '';
  const categoryKey = productCategoryInput ? productCategoryInput.value : '';
  const unit = productUnitInput ? productUnitInput.value.trim() : '';
  const costPrice = parseNumber(productCostInput ? productCostInput.value : '');
  const price = parseNumber(productPriceInput ? productPriceInput.value : '');
  const initialStock = parseInt(initialStockInput ? initialStockInput.value : '', 10) || 0;
  const minStock = parseInt(minStockInput ? minStockInput.value : '', 10) || 0;
  const description = productDescriptionInput ? productDescriptionInput.value.trim() : '';
  const isActive = productActiveInput ? productActiveInput.checked : true;

  if (!code || !name) {
    alert('Vui lòng nhập đầy đủ mã và tên sản phẩm');
    return;
  }

  if (!price || price <= 0) {
    alert('Giá bán phải lớn hơn 0');
    return;
  }

  const dto = {
    productCode: code,
    productName: name,
    categoryKey,
    unit,
    costPrice,
    sellingPrice: price,
    minStock,
    description,
    isActive
  };

  const isEdit = editingProductId != null;
  const endpoint = isEdit ? config.endpoints.PRODUCT_UPDATE : config.endpoints.PRODUCT_CREATE;
  const method = isEdit ? 'PUT' : 'POST';
  const url = isEdit
    ? config.getUrl(endpoint, { id: editingProductId })
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

    let rawResult;
    const text = await response.text();
    try {
      rawResult = text ? JSON.parse(text) : null;
    } catch {
      rawResult = text;
    }

    if (!response.ok) {
      console.error('Save product failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Lưu sản phẩm thất bại, vui lòng thử lại.';
      alert(message);
      return;
    }

    const savedProduct = rawResult || null;
    if (!isEdit && initialStock > 0 && savedProduct) {
      const productId = savedProduct.productId || savedProduct.id;
      if (productId) {
        createInitialInventoryRecord(productId, initialStock, minStock);
      }
    }

    alert('Lưu sản phẩm thành công');
    if (addProductModal) {
      addProductModal.classList.remove('open');
    }
    editingProductId = null;
    await loadProducts(productTableBody);
  } catch (error) {
    console.error('Error saving product:', error);
    alert('Có lỗi khi lưu sản phẩm, vui lòng thử lại.');
  }
}

async function handleDeleteProduct(id, tbody) {
  if (!id) {
    return;
  }
  if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
    return;
  }

  const url = config.getUrl(config.endpoints.PRODUCT_DELETE, { id });

  try {
    const response = await fetch(url, {
      method: 'DELETE',
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
      console.error('Delete product failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Xóa sản phẩm thất bại, vui lòng thử lại.';
      alert(message);
      return;
    }

    alert('Xóa sản phẩm thành công');
    products = products.filter(p => p.id !== id);
    renderProductTable(tbody, products);
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Có lỗi khi xóa sản phẩm, vui lòng thử lại.');
  }
}

async function createInitialInventoryRecord(productId, quantityOnHand, minStock) {
  if (!productId || !quantityOnHand || quantityOnHand <= 0) {
    return;
  }

  const dto = {
    productId,
    warehouseId: DEFAULT_WAREHOUSE_ID,
    quantityOnHand,
    minStock: minStock || 0
  };

  const url = config.getUrl(config.endpoints.INVENTORY);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(dto)
    });

    if (!response.ok) {
      const text = await response.text();
      let rawResult;
      try {
        rawResult = text ? JSON.parse(text) : null;
      } catch {
        rawResult = text;
      }
      console.error('Create inventory record failed', response.status, rawResult);
    }
  } catch (error) {
    console.error('Error creating inventory record:', error);
  }
}

function mapCategoryNameToKey(categoryName) {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('beverage') || name.includes('drink') || name.includes('nước') || name.includes('đồ uống')) {
    return 'beverage';
  }
  if (name.includes('snack') || name.includes('ăn vặt')) {
    return 'snack';
  }
  if (name.includes('food') || name.includes('thực phẩm')) {
    return 'food';
  }
  return 'other';
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (!value) {
    return 0;
  }
  const n = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount || 0);
}

