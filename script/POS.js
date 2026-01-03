import config from '../config/config.js';

let cart = [];
let products = [];
let currentCustomer = null;
let discountPercent = 0;
let discountAmount = 0;
let selectedPaymentMethod = 'cash';
let currentUser = null;
let promotions = [];
let taxes = [];
let selectedPromotion = null;
let selectedTax = null;

const productGrid = document.getElementById('productGrid');
const cartItems = document.getElementById('cartItems');
const productSearch = document.getElementById('productSearch');
const customerSearch = document.getElementById('customerSearch');
const clearCartBtn = document.getElementById('clearCart');
const checkoutBtn = document.getElementById('btnCheckout');
const holdBtn = document.getElementById('btnHold');
const filterBtns = document.querySelectorAll('.filter-btn');
const posLogoutBtn = document.getElementById('posLogoutBtn');
const promotionSelect = document.getElementById('promotionSelect');

// Modal elements
const paymentModal = document.getElementById('paymentModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelPaymentBtn = document.getElementById('btnCancelPayment');
const confirmPaymentBtn = document.getElementById('btnConfirmPayment');
const receivedAmountInput = document.getElementById('receivedAmount');
const paymentBtns = document.querySelectorAll('.payment-btn');
const quickAmountBtns = document.querySelectorAll('.quick-amount');

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  loadProducts();
  loadPromotionsAndTaxes();
  setupEventListeners();
});

function initializeApp() {
  // Check authentication
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '../auth/Login.html';
    return;
  }
  
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }
  
  // Load cart from localStorage
  const savedCart = localStorage.getItem('currentCart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    renderCart();
  }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Product search
  productSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterProducts(searchTerm);
  });
  
  // Category filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const category = btn.dataset.category;
      filterByCategory(category);
    });
  });
  
  // Customer search
  customerSearch.addEventListener('input', (e) => {
    // Implement customer search/autocomplete
    searchCustomer(e.target.value);
  });
  
  // Clear cart
  clearCartBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      cart = [];
      saveCart();
      renderCart();
    }
  });
  
  // Checkout
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }
    openPaymentModal();
  });
  
  // Hold order
  holdBtn.addEventListener('click', () => {
    holdOrder();
  });

  if (posLogoutBtn) {
    posLogoutBtn.addEventListener('click', handleLogout);
  }

  if (promotionSelect) {
    promotionSelect.addEventListener('change', handlePromotionChange);
  }
  
  // Discount inputs
  document.getElementById('discountPercent').addEventListener('input', (e) => {
    discountPercent = parseFloat(e.target.value) || 0;
    discountAmount = 0;
    document.getElementById('discountAmount').value = '';
    updateCartSummary();
  });
  
  document.getElementById('discountAmount').addEventListener('input', (e) => {
    discountAmount = parseFloat(e.target.value) || 0;
    discountPercent = 0;
    document.getElementById('discountPercent').value = '';
    updateCartSummary();
  });
  
  // Modal controls
  closeModalBtn.addEventListener('click', closePaymentModal);
  cancelPaymentBtn.addEventListener('click', closePaymentModal);
  confirmPaymentBtn.addEventListener('click', confirmPayment);
  
  // Payment method selection
  paymentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      paymentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPaymentMethod = btn.dataset.method;
    });
  });
  
  // Quick amount buttons
  quickAmountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      receivedAmountInput.value = amount;
      calculateChange();
    });
  });
  
  // Received amount input
  receivedAmountInput.addEventListener('input', calculateChange);
}

// ===== PRODUCT FUNCTIONS =====
async function loadProducts() {
  try {
    const url = config.buildUrlWithQuery(config.endpoints.PRODUCTS, { isActive: true });
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
      ? data
          .filter(p => p && (p.isActive === undefined || p.isActive === true))
          .map(p => ({
            id: p.productId,
            code: p.productCode,
            barcode: p.barcode,
            name: p.productName,
            categoryId: p.categoryId,
            categoryName: p.categoryName,
            category: mapCategoryNameToKey(p.categoryName),
            supplierId: p.supplierId,
            supplierName: p.supplierName,
            unit: p.unit,
            costPrice: p.costPrice,
            price: p.sellingPrice,
            stock: p.stockQuantity,
            minStock: p.minStock,
            image: p.imageUrl,
            isActive: p.isActive,
            createdAt: p.createdAt
          }))
      : [];
    
    renderProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    products = generateMockProducts();
    renderProducts(products);
  }
}

async function loadPromotionsAndTaxes() {
  try {
    // Load active promotions
    const promoUrl = config.buildUrlWithQuery(config.endpoints.PROMOTIONS, { isActive: true });
    const promoRes = await fetch(promoUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (promoRes.ok) {
      promotions = await promoRes.json();
      renderPromotionOptions(promotions);
    }
    
    // Load active taxes
    const taxUrl = config.buildUrlWithQuery(config.endpoints.TAXES, { isActive: true });
    const taxRes = await fetch(taxUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (taxRes.ok) {
      taxes = await taxRes.json();
      // Optional: choose default tax (first active)
      selectedTax = Array.isArray(taxes) && taxes.length > 0 ? taxes[0] : null;
      updateCartSummary();
    }
  } catch (err) {
    console.error('Error loading promotions/taxes:', err);
  }
}

function renderPromotionOptions(list) {
  if (!promotionSelect) return;
  const options = ['<option value="">Không áp dụng</option>'].concat(
    (Array.isArray(list) ? list : []).map(p => {
      const label = `${p.promotionCode || ''} - ${p.promotionName || ''}`;
      return `<option value="${p.promotionId}">${label}</option>`;
    })
  );
  promotionSelect.innerHTML = options.join('');
}

function handlePromotionChange(e) {
  const id = parseInt(e.target.value) || null;
  selectedPromotion = (Array.isArray(promotions) ? promotions : []).find(p => p.promotionId === id) || null;
  updateCartSummary();
}

function mapCategoryNameToKey(categoryName) {
  const name = (categoryName || "").toLowerCase();
  if (name.includes("beverage") || name.includes("drink") || name.includes("nước") || name.includes("đồ uống")) {
    return "beverage";
  }
  if (name.includes("snack") || name.includes("ăn vặt")) {
    return "snack";
  }
  if (name.includes("food") || name.includes("thực phẩm")) {
    return "food";
  }
  return "other";
}

function generateMockProducts() {
  const categories = ['beverage', 'snack', 'food', 'other'];
  const names = {
    beverage: ['Coca Cola 330ml', 'Pepsi 330ml', 'Nước suối Lavie', 'Trà xanh 0°', 'Sting dâu', 'Red Bull'],
    snack: ['Snack Oishi', 'Bánh Oreo', 'Lay\'s khoai tây', 'Poca', 'Doritos', 'Ruffles'],
    food: ['Mì gói Hảo Hảo', 'Mì tôm', 'Bánh mì sandwich', 'Cơm hộp', 'Bánh bao', 'Xúc xích'],
    other: ['Kẹo cao su', 'Thuốc lá', 'Báo', 'Tạp chí', 'Pin AA', 'Khăn giấy']
  };
  
  const mockProducts = [];
  let id = 1;
  
  categories.forEach(category => {
    names[category].forEach(name => {
      mockProducts.push({
        id: id++,
        name: name,
        price: Math.floor(Math.random() * 50000) + 10000,
        category: category,
        stock: Math.floor(Math.random() * 100) + 1,
        image: null
      });
    });
  });
  
  return mockProducts;
}

function renderProducts(productList) {
  if (productList.length === 0) {
    productGrid.innerHTML = '<div class="loading">Không có sản phẩm nào</div>';
    return;
  }
  
  productGrid.innerHTML = productList.map(product => `
    <div class="product-card" onclick="window.addToCart(${product.id})">
      <div class="product-image">
        ${getProductIcon(product.category)}
      </div>
      <div class="product-name" title="${product.name}">${product.name}</div>
      <div class="product-price">${formatCurrency(product.price)}</div>
      <div class="product-stock ${product.stock < 10 ? 'low' : ''}">
        Kho: ${product.stock}
      </div>
    </div>
  `).join('');
}

function getProductIcon(category) {
  const icons = {
    beverage: '🥤',
    snack: '🍿',
    food: '🍱',
    other: '📦'
  };
  return icons[category] || '📦';
}

function filterProducts(searchTerm) {
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm)
  );
  renderProducts(filtered);
}

function filterByCategory(category) {
  if (category === 'all') {
    renderProducts(products);
  } else {
    const filtered = products.filter(p => p.category === category);
    renderProducts(filtered);
  }
}

// ===== CART FUNCTIONS =====
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  if (product.stock <= 0) {
    alert('Sản phẩm đã hết hàng!');
    return;
  }
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      alert('Không đủ hàng trong kho!');
      return;
    }
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      maxStock: product.stock
    });
  }
  
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  renderCart();
}

function updateQuantity(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  
  const newQuantity = item.quantity + change;
  
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }
  
  if (newQuantity > item.maxStock) {
    alert('Không đủ hàng trong kho!');
    return;
  }
  
  item.quantity = newQuantity;
  saveCart();
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Giỏ hàng trống</p>
        <small>Vui lòng chọn sản phẩm</small>
      </div>
    `;
    updateCartSummary();
    return;
  }
  
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-price">${formatCurrency(item.price)}</div>
      </div>
      <div class="item-controls">
        <div class="quantity-control">
          <button class="quantity-btn" onclick="window.updateQuantity(${item.id}, -1)">-</button>
          <span class="quantity-value">${item.quantity}</span>
          <button class="quantity-btn" onclick="window.updateQuantity(${item.id}, 1)">+</button>
        </div>
        <div class="item-total">${formatCurrency(item.price * item.quantity)}</div>
        <button class="btn-remove-item" onclick="window.removeFromCart(${item.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  updateCartSummary();
}

function updateCartSummary() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let manualDiscount = 0;
  if (discountPercent > 0) {
    manualDiscount = subtotal * (discountPercent / 100);
  } else if (discountAmount > 0) {
    manualDiscount = discountAmount;
  }

  let promoDiscount = 0;
  if (selectedPromotion && selectedPromotion.isActive !== false) {
    const applyToOrder = selectedPromotion.applyTo === 'order' || selectedPromotion.applyTo === 'invoice' || !selectedPromotion.applyTo;
    const meetsMin = !selectedPromotion.minOrderAmount || subtotal >= selectedPromotion.minOrderAmount;
    if (applyToOrder && meetsMin) {
      const type = (selectedPromotion.discountType || '').toLowerCase();
      const value = selectedPromotion.discountValue || 0;
      if (type === 'percent' || type === 'percentage') {
        promoDiscount = subtotal * (value / 100);
      } else {
        promoDiscount = value;
      }
    }
  }

  const discount = manualDiscount + promoDiscount;

  let taxAmount = 0;
  if (selectedTax && selectedTax.isActive !== false) {
    const rate = selectedTax.taxRate || 0;
    const taxableBase = Math.max(0, subtotal - discount);
    taxAmount = taxableBase * (rate / 100);
  }

  const total = Math.max(0, subtotal - discount + taxAmount);

  document.getElementById('subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('discount').textContent = formatCurrency(discount);
  const taxEl = document.getElementById('taxAmount');
  if (taxEl) {
    taxEl.textContent = formatCurrency(taxAmount);
  }
  document.getElementById('total').textContent = formatCurrency(total);
}

function saveCart() {
  localStorage.setItem('currentCart', JSON.stringify(cart));
}

function clearCart() {
  cart = [];
  discountPercent = 0;
  discountAmount = 0;
  document.getElementById('discountPercent').value = '';
  document.getElementById('discountAmount').value = '';
  saveCart();
  renderCart();
}

// ===== PAYMENT FUNCTIONS =====
function openPaymentModal() {
  const total = calculateTotal();
  document.getElementById('modalTotal').textContent = formatCurrency(total);
  receivedAmountInput.value = '';
  document.getElementById('changeAmount').textContent = '0 đ';
  paymentModal.classList.add('active');
  receivedAmountInput.focus();
}

function closePaymentModal() {
  paymentModal.classList.remove('active');
}

function calculateTotal() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let manualDiscount = 0;
  if (discountPercent > 0) {
    manualDiscount = subtotal * (discountPercent / 100);
  } else if (discountAmount > 0) {
    manualDiscount = discountAmount;
  }

  let promoDiscount = 0;
  if (selectedPromotion && selectedPromotion.isActive !== false) {
    const applyToOrder = selectedPromotion.applyTo === 'order' || selectedPromotion.applyTo === 'invoice' || !selectedPromotion.applyTo;
    const meetsMin = !selectedPromotion.minOrderAmount || subtotal >= selectedPromotion.minOrderAmount;
    if (applyToOrder && meetsMin) {
      const type = (selectedPromotion.discountType || '').toLowerCase();
      const value = selectedPromotion.discountValue || 0;
      if (type === 'percent' || type === 'percentage') {
        promoDiscount = subtotal * (value / 100);
      } else {
        promoDiscount = value;
      }
    }
  }

  const discount = manualDiscount + promoDiscount;

  let taxAmount = 0;
  if (selectedTax && selectedTax.isActive !== false) {
    const rate = selectedTax.taxRate || 0;
    const taxableBase = Math.max(0, subtotal - discount);
    taxAmount = taxableBase * (rate / 100);
  }

  const total = Math.max(0, subtotal - discount + taxAmount);
  return total;
}

function calculateChange() {
  const total = calculateTotal();
  const received = parseFloat(receivedAmountInput.value) || 0;
  const change = received - total;
  
  document.getElementById('changeAmount').textContent = formatCurrency(Math.max(0, change));
  document.getElementById('changeAmount').style.color = change >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
}

async function confirmPayment() {
  const total = calculateTotal();
  const received = parseFloat(receivedAmountInput.value) || 0;
  
  if (selectedPaymentMethod === 'cash' && received < total) {
    alert('Số tiền nhận không đủ!');
    return;
  }
  
  try {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let manualDiscount = 0;
    if (discountPercent > 0) {
      manualDiscount = subtotal * (discountPercent / 100);
    } else if (discountAmount > 0) {
      manualDiscount = discountAmount;
    }

    const discountValue = manualDiscount;

    const paymentMethodMap = {
      cash: 'Cash',
      card: 'Card',
      transfer: 'Bank'
    };

    const invoiceData = {
      invoiceNumber: null,
      customerId: currentCustomer?.id || null,
      userId: currentUser?.id || null,
      discount: discountValue,
      promotionId: selectedPromotion?.promotionId || null,
      promotionCode: selectedPromotion?.promotionCode || null,
      paidAmount: received,
      paymentMethod: paymentMethodMap[selectedPaymentMethod] || 'Cash',
      notes: 'Bán lẻ tại quầy',
      details: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: 0
      }))
    };
    
    const response = await fetch(config.getUrl(config.endpoints.CREATE_INVOICE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(invoiceData)
    });
    
    let rawResult;
    const text = await response.text();
    try {
      rawResult = text ? JSON.parse(text) : null;
    } catch {
      rawResult = text;
    }

    if (!response.ok) {
      console.error('Create invoice failed', response.status, rawResult);
      const message = rawResult && rawResult.message ? rawResult.message : 'Thanh toán thất bại, vui lòng thử lại.';
      alert(message);
      return;
    }
    
    const invoice = rawResult;
    
    alert(`Thanh toán thành công!\nMã hóa đơn: ${invoice.invoiceNumber || invoice.invoiceId || 'INV-' + Date.now()}`);
    
    // Print invoice option
    if (confirm('Bạn có muốn in hóa đơn?')) {
      printInvoice(invoice);
    }
    
    // Clear cart and close modal
    clearCart();
    closePaymentModal();
    
  } catch (error) {
    console.error('Payment error:', error);
    alert('Thanh toán thất bại, vui lòng thử lại.');
  }
}

function printInvoice(invoice) {
  // This would open print dialog or redirect to print page
  console.log('Printing invoice:', invoice);
  // window.open(`../pages/PrintInvoice.html?id=${invoice.id}`, '_blank');
}

function holdOrder() {
  if (cart.length === 0) {
    alert('Giỏ hàng trống!');
    return;
  }
  
  const heldOrders = JSON.parse(localStorage.getItem('heldOrders') || '[]');
  const orderId = 'HOLD' + Date.now();
  
  heldOrders.push({
    id: orderId,
    cart: [...cart],
    customer: currentCustomer,
    discount: { percent: discountPercent, amount: discountAmount },
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem('heldOrders', JSON.stringify(heldOrders));
  
  alert(`Đơn hàng đã được tạm giữ!\nMã: ${orderId}`);
  
  clearCart();
}

function handleLogout() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = '../auth/Login.html';
  }
}

// ===== CUSTOMER FUNCTIONS =====
function searchCustomer(query) {
  // Implement customer search
  console.log('Searching customer:', query);
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// ===== EXPORT FUNCTIONS TO WINDOW =====
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;

