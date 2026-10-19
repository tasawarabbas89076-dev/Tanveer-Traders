/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Admin Dashboard & Authentication Script for Tanveer Traders
 */

const TOKEN_KEY = 'tanveer_admin_token';

function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAdminToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function showAdminToast(message, type = 'info') {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:all 0.2s ease;max-width:380px;';
    document.body.appendChild(toast);
  }
  toast.style.display = 'block';
  if (type === 'error') {
    toast.style.backgroundColor = '#FDF2F2';
    toast.style.color = '#991B1B';
    toast.style.border = '1px solid #FECACA';
  } else if (type === 'success') {
    toast.style.backgroundColor = '#EBF7EE';
    toast.style.color = '#14532D';
    toast.style.border = '1px solid #BBF7D0';
  } else {
    toast.style.backgroundColor = '#174A35';
    toast.style.color = '#FFFFFF';
    toast.style.border = '1px solid #103526';
  }
  toast.textContent = message;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

// ============================================================
// LOGIN PAGE LOGIC
// ============================================================
function initLoginPage() {
  const loginForm = document.getElementById('admin-login-form');
  const alertEl = document.getElementById('login-alert');

  if (!loginForm) return;

  // If already logged in, redirect to dashboard
  const token = getAdminToken();
  if (token) {
    window.location.href = '/admin';
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = (document.getElementById('admin-password').value || '').trim();
    const submitBtn = document.getElementById('login-submit-btn');

    if (alertEl) alertEl.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';
    }

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        sessionStorage.removeItem('logged_out');
        setAdminToken(data.token);
        window.location.href = '/admin';
      } else {
        throw new Error(data.error || 'Invalid credentials');
      }
    } catch (err) {
      if (alertEl) {
        alertEl.textContent = err.message || 'Login failed. Please check your credentials.';
        alertEl.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In to Dashboard';
      }
    }
  });
}

// ============================================================
// DASHBOARD LOGIC
// ============================================================
let adminProducts = [];
let adminOrders = [];
let adminSettings = {};

async function initDashboard() {
  let token = getAdminToken();

  // If no token and user hasn't explicitly logged out in this session, auto-authenticate for seamless demo experience
  if (!token && sessionStorage.getItem('logged_out') !== 'true') {
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@tanveertraders.com',
          password: 'ChangeThisSecurePassword123!'
        })
      });
      const data = await res.json();
      if (data.token) {
        setAdminToken(data.token);
        token = data.token;
      }
    } catch (e) {
      console.warn('Auto-login error:', e);
    }
  }

  if (!token) {
    window.location.href = '/admin/login';
    return;
  }

  // Verify auth session
  try {
    const res = await fetch('/api/admin/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      clearAdminToken();
      window.location.href = '/admin/login';
      return;
    }
    const session = await res.json();
    const userEmailEl = document.getElementById('admin-user-email');
    if (userEmailEl && session.user) {
      userEmailEl.textContent = session.user.email;
    }
  } catch (err) {
    clearAdminToken();
    window.location.href = '/admin/login';
    return;
  }

  // Setup Logout
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAdminToken();
      sessionStorage.setItem('logged_out', 'true');
      window.location.href = '/admin/login';
    });
  }

  // Setup Tab Navigation
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchAdminTab(tab);
    });
  });

  // Load initial data
  await Promise.all([
    loadAdminProducts(),
    loadAdminOrders(),
    loadAdminSettings()
  ]);

  updateKpis();
}

function switchAdminTab(tabId) {
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.admin-tab-pane').forEach(pane => {
    pane.style.display = pane.id === `tab-${tabId}` ? 'block' : 'none';
  });
}

function updateKpis() {
  const activeProducts = adminProducts.filter(p => p.is_active);
  const riceCount = activeProducts.filter(p => p.category === 'Rice').length;
  const sugarCount = activeProducts.filter(p => p.category === 'Sugar').length;

  const totalEl = document.getElementById('kpi-total-variants');
  const riceEl = document.getElementById('kpi-rice-variants');
  const sugarEl = document.getElementById('kpi-sugar-variants');
  const ordersEl = document.getElementById('kpi-saved-orders');

  if (totalEl) totalEl.textContent = activeProducts.length;
  if (riceEl) riceEl.textContent = riceCount;
  if (sugarEl) sugarEl.textContent = sugarCount;
  if (ordersEl) ordersEl.textContent = adminOrders.length;
}

// ------------------------------------------------------------
// PRODUCTS MANAGEMENT
// ------------------------------------------------------------
async function loadAdminProducts() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      adminProducts = result.data;
      renderProductsTable();
    }
  } catch (err) {
    console.error('Error loading products for admin:', err);
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  if (adminProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">No products found. Add your first variant.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminProducts.map(p => {
    const priceText = p.price_type === 'quote_required' || p.price === null
      ? 'Quote on Request'
      : `PKR ${Number(p.price).toLocaleString()}`;

    const statusBadge = p.is_active 
      ? '<span style="color: var(--color-success); font-weight: 600;">Active</span>' 
      : '<span style="color: var(--color-text-muted); font-weight: 500;">Inactive</span>';

    return `
      <tr>
        <td style="font-weight: 600; color: var(--color-primary-dark);">${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td>${escapeHtml(p.packaging)}</td>
        <td style="text-transform: capitalize;">${escapeHtml(p.price_type.replace('_', ' '))}</td>
        <td class="tabular-nums" style="font-weight: 600;">${priceText}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openProductModal('${p.id}')">Edit</button>
            <button type="button" class="btn btn-sm" style="color: var(--color-error); border: 1px solid rgba(158, 42, 43, 0.3);" onclick="deleteProduct('${p.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('modal-product-title');
  const idInput = document.getElementById('prod-id');
  const nameInput = document.getElementById('prod-name');
  const categoryInput = document.getElementById('prod-category');
  const packagingInput = document.getElementById('prod-packaging');
  const unitInput = document.getElementById('prod-unit');
  const priceTypeInput = document.getElementById('prod-price-type');
  const priceInput = document.getElementById('prod-price');
  const minQtyInput = document.getElementById('prod-min-qty');
  const descInput = document.getElementById('prod-desc');
  const imgInput = document.getElementById('prod-image');
  const activeInput = document.getElementById('prod-active');

  if (productId) {
    const p = adminProducts.find(item => String(item.id) === String(productId));
    if (!p) return;
    if (title) title.textContent = 'Edit Product Variant';
    if (idInput) idInput.value = p.id;
    if (nameInput) nameInput.value = p.name;
    if (categoryInput) categoryInput.value = p.category;
    if (packagingInput) packagingInput.value = p.packaging;
    if (unitInput) unitInput.value = p.unit || 'kg';
    if (priceTypeInput) priceTypeInput.value = p.price_type;
    if (priceInput) priceInput.value = p.price !== null ? p.price : '';
    if (minQtyInput) minQtyInput.value = p.minimum_quantity || 1;
    if (descInput) descInput.value = p.description || '';
    if (imgInput) imgInput.value = p.image_url || '';
    if (activeInput) activeInput.checked = p.is_active;
  } else {
    if (title) title.textContent = 'Add Product Variant';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (categoryInput) categoryInput.value = 'Rice';
    if (packagingInput) packagingInput.value = '';
    if (unitInput) unitInput.value = 'bag';
    if (priceTypeInput) priceTypeInput.value = 'retail';
    if (priceInput) priceInput.value = '';
    if (minQtyInput) minQtyInput.value = '1';
    if (descInput) descInput.value = '';
    if (imgInput) imgInput.value = '/assets/images/product-basmati-rice.jpg';
    if (activeInput) activeInput.checked = true;
  }

  if (modal) modal.classList.add('active');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('active');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const isEdit = Boolean(id);

  const payload = {
    name: document.getElementById('prod-name').value.trim(),
    category: document.getElementById('prod-category').value,
    packaging: document.getElementById('prod-packaging').value.trim(),
    unit: document.getElementById('prod-unit').value.trim(),
    price_type: document.getElementById('prod-price-type').value,
    price: document.getElementById('prod-price-type').value === 'quote_required' ? null : document.getElementById('prod-price').value,
    minimum_quantity: parseInt(document.getElementById('prod-min-qty').value, 10) || 1,
    description: document.getElementById('prod-desc').value.trim(),
    image_url: document.getElementById('prod-image').value.trim(),
    is_active: document.getElementById('prod-active').checked
  };

  const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
  const method = isEdit ? 'PATCH' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      showAdminToast(data.errors ? data.errors.join('. ') : (data.error || 'Failed to save product'), 'error');
      return;
    }

    closeProductModal();
    showAdminToast(isEdit ? 'Product variant updated.' : 'Product variant created.', 'success');
    await loadAdminProducts();
    updateKpis();
  } catch (err) {
    showAdminToast('Network error while saving product: ' + err.message, 'error');
  }
}

async function deleteProduct(productId) {
  try {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showAdminToast(data.message || 'Product removed/deactivated.', 'success');
      await loadAdminProducts();
      updateKpis();
    } else {
      showAdminToast(data.error || 'Failed to delete product', 'error');
    }
  } catch (err) {
    showAdminToast('Error deleting product: ' + err.message, 'error');
  }
}

// ------------------------------------------------------------
// ORDERS MANAGEMENT
// ------------------------------------------------------------
async function loadAdminOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      adminOrders = result.data;
      renderOrdersTable();
    }
  } catch (err) {
    console.error('Error loading orders for admin:', err);
  }
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  if (adminOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">No saved order enquiries yet. Enquiries submitted on the website will be logged here.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminOrders.map(o => {
    const itemsSummary = Array.isArray(o.items_json)
      ? o.items_json.map(i => `${i.product_name_snapshot || i.product_name} (${i.quantity})`).join(', ')
      : 'N/A';

    const subtotalDisplay = o.subtotal !== null
      ? `PKR ${Number(o.subtotal).toLocaleString()}`
      : 'Quote Required';

    const dateStr = new Date(o.created_at).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <tr>
        <td style="font-weight: 600;">${escapeHtml(o.customer_name)}<br><span style="font-size: 0.75rem; color: var(--color-text-muted);">${escapeHtml(o.customer_phone)}</span></td>
        <td>${escapeHtml(o.city)}</td>
        <td style="text-transform: capitalize;">${escapeHtml(o.order_type)}</td>
        <td style="font-size: 0.8125rem; max-width: 260px;">${escapeHtml(itemsSummary)}</td>
        <td class="tabular-nums" style="font-weight: 600;">${subtotalDisplay}</td>
        <td>
          <select class="form-select" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" onchange="updateOrderStatus('${o.id}', this.value)">
            <option value="New enquiry" ${o.status === 'New enquiry' ? 'selected' : ''}>New enquiry</option>
            <option value="Contacted" ${o.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td style="font-size: 0.8125rem; color: var(--color-text-muted);">${dateStr}</td>
      </tr>
    `;
  }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      showAdminToast(result.error || 'Failed to update order status', 'error');
    } else {
      showAdminToast(`Order status updated to "${newStatus}"`, 'success');
    }
  } catch (err) {
    showAdminToast('Error updating order: ' + err.message, 'error');
  }
}

// ------------------------------------------------------------
// STORE SETTINGS
// ------------------------------------------------------------
async function loadAdminSettings() {
  try {
    const res = await fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    });
    const result = await res.json();
    if (result.success && result.data) {
      adminSettings = result.data;
      const form = document.getElementById('store-settings-form');
      if (form) {
        document.getElementById('setting-business-name').value = adminSettings.business_name || 'Tanveer Traders';
        document.getElementById('setting-whatsapp').value = adminSettings.whatsapp_number || '03271639095';
        document.getElementById('setting-location').value = adminSettings.location || 'Khushab, Punjab, Pakistan';
        document.getElementById('setting-currency').value = adminSettings.currency || 'PKR';
        document.getElementById('setting-notice').value = adminSettings.sample_price_notice || 'Sample price — confirm current rate.';
      }
    }
  } catch (err) {
    console.error('Error loading store settings:', err);
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const alertEl = document.getElementById('settings-alert');
  if (alertEl) alertEl.style.display = 'none';

  const payload = {
    business_name: document.getElementById('setting-business-name').value.trim(),
    whatsapp_number: document.getElementById('setting-whatsapp').value.trim(),
    location: document.getElementById('setting-location').value.trim(),
    currency: document.getElementById('setting-currency').value.trim(),
    sample_price_notice: document.getElementById('setting-notice').value.trim()
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (res.ok && result.success) {
      if (alertEl) {
        alertEl.textContent = 'Settings updated successfully.';
        alertEl.className = 'alert-notice success';
        alertEl.style.display = 'block';
      }
    } else {
      throw new Error(result.error || 'Failed to update settings');
    }
  } catch (err) {
    if (alertEl) {
      alertEl.textContent = err.message;
      alertEl.className = 'alert-notice error';
      alertEl.style.display = 'block';
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('admin-login-form')) {
    initLoginPage();
  }
  if (document.getElementById('admin-dashboard-container')) {
    initDashboard();

    const productForm = document.getElementById('product-edit-form');
    if (productForm) {
      productForm.addEventListener('submit', saveProduct);
    }

    const settingsForm = document.getElementById('store-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', saveSettings);
    }
  }
});
