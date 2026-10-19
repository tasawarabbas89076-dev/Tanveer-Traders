/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Catalog product loader & filtering for Tanveer Traders
 */

let allProducts = [];
let currentCategoryFilter = 'all';

async function fetchProducts() {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: var(--color-text-muted);">
      <p>Loading Rice &amp; Sugar catalog...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/products');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      allProducts = result.data;
      renderProductsGrid();
    } else {
      throw new Error(result.error || 'Failed to parse products');
    }
  } catch (err) {
    console.warn('API error, displaying local catalog:', err);
    // Use fallback sample list if offline
    allProducts = [
      {
        id: 'prod-rice-01',
        name: 'Basmati Rice (Retail Pack)',
        category: 'Rice',
        description: 'Aromatic long-grain Basmati rice packaged for household and retail grocery use.',
        packaging: '5 kg pack',
        unit: 'pack',
        price: 1750.00,
        price_type: 'retail',
        image_url: '/assets/images/product-basmati-rice.jpg',
        is_active: true,
        minimum_quantity: 1
      },
      {
        id: 'prod-rice-02',
        name: 'Basmati Rice (Wholesale Bag)',
        category: 'Rice',
        description: 'Long-grain Basmati rice in bulk packaging suitable for shopkeepers, catering, and wholesale buyers.',
        packaging: '50 kg bag',
        unit: 'bag',
        price: 16500.00,
        price_type: 'wholesale',
        image_url: '/assets/images/product-basmati-rice.jpg',
        is_active: true,
        minimum_quantity: 1
      },
      {
        id: 'prod-rice-03',
        name: 'Non-Basmati Rice (Retail Pack)',
        category: 'Rice',
        description: 'Standard quality non-Basmati rice suitable for everyday cooking and commercial kitchens.',
        packaging: '10 kg pack',
        unit: 'pack',
        price: 2100.00,
        price_type: 'retail',
        image_url: '/assets/images/product-basmati-rice.jpg',
        is_active: true,
        minimum_quantity: 1
      },
      {
        id: 'prod-rice-04',
        name: 'Non-Basmati Rice (Wholesale Bag)',
        category: 'Rice',
        description: 'Commercial grade non-Basmati rice in heavy-duty bulk bags for wholesale and commercial orders.',
        packaging: '50 kg bag',
        unit: 'bag',
        price: 9800.00,
        price_type: 'wholesale',
        image_url: '/assets/images/product-basmati-rice.jpg',
        is_active: true,
        minimum_quantity: 1
      },
      {
        id: 'prod-sugar-01',
        name: 'Refined White Sugar (Retail Pack)',
        category: 'Sugar',
        description: 'Clean, pure granulated white sugar in sealed retail packaging for household consumption.',
        packaging: '5 kg pack',
        unit: 'pack',
        price: 750.00,
        price_type: 'retail',
        image_url: '/assets/images/product-refined-sugar.jpg',
        is_active: true,
        minimum_quantity: 1
      },
      {
        id: 'prod-sugar-02',
        name: 'Refined White Sugar (Wholesale Bag)',
        category: 'Sugar',
        description: 'Commercial bulk white granulated sugar bag for confectioneries, retailers, and wholesalers.',
        packaging: '50 kg bag',
        unit: 'bag',
        price: 7100.00,
        price_type: 'wholesale',
        image_url: '/assets/images/product-refined-sugar.jpg',
        is_active: true,
        minimum_quantity: 1
      },
      {
        id: 'prod-sugar-03',
        name: 'Commercial Sugar (Bulk Order)',
        category: 'Sugar',
        description: 'High-volume wholesale sugar supply for bulk buyers, bakeries, and industrial food producers. Rates updated daily based on mandi rates.',
        packaging: 'Custom Bulk (Tonnes)',
        unit: 'tonne',
        price: null,
        price_type: 'quote_required',
        image_url: '/assets/images/product-refined-sugar.jpg',
        is_active: true,
        minimum_quantity: 1
      }
    ];
    renderProductsGrid();
  }
}

function renderProductsGrid() {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  const filtered = currentCategoryFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.category.toLowerCase() === currentCategoryFilter.toLowerCase());

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
        <p style="color: var(--color-text-muted); font-size: 0.9375rem;">No active variants found in this category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(product => {
    const isQuoteRequired = product.price_type === 'quote_required' || product.price === null;
    const fallbackSvg = product.category === 'Rice' ? '/assets/images/rice-placeholder.svg' : '/assets/images/sugar-placeholder.svg';
    const imgSrc = product.image_url || fallbackSvg;
    
    let priceDisplay = '';
    if (isQuoteRequired) {
      priceDisplay = `<span class="product-price-val" style="font-size: 1rem; color: var(--color-accent-hover);">Rate on Request</span>`;
    } else {
      priceDisplay = `
        <span class="product-price-val tabular-nums">PKR ${Number(product.price).toLocaleString()}</span>
        <span class="sample-notice-inline" style="display:block; margin-top:2px;">Sample price — confirm current rate</span>
      `;
    }

    const typeBadge = product.price_type === 'wholesale' ? 'Wholesale Supply' : (product.price_type === 'retail' ? 'Retail Pack' : 'Custom Bulk Quote');

    return `
      <article class="product-item-card" data-id="${product.id}">
        <div class="product-card-thumb-wrap">
          <img 
            src="${imgSrc}" 
            alt="${escapeHtml(product.name)}" 
            class="product-card-thumb" 
            loading="lazy" 
            onerror="this.onerror=null; this.src='${fallbackSvg}';"
          />
        </div>
        <div class="product-card-body">
          <div class="product-card-meta">
            <span class="product-category-text">${escapeHtml(product.category)}</span>
            <span style="color: var(--color-text-muted);">${typeBadge}</span>
          </div>

          <h3 class="product-card-title">${escapeHtml(product.name)}</h3>
          <p class="product-card-desc">${escapeHtml(product.description || '')}</p>

          <div style="font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.25rem;">
            Packaging: <strong>${escapeHtml(product.packaging)}</strong>
          </div>

          <div class="product-card-pricing">
            ${priceDisplay}
          </div>

          <div class="product-card-actions" style="margin-top: 0.75rem;">
            <label for="qty-${product.id}" class="sr-only">Quantity</label>
            <input 
              type="number" 
              id="qty-${product.id}" 
              min="${product.minimum_quantity || 1}" 
              value="${product.minimum_quantity || 1}" 
              class="qty-input-sm tabular-nums" 
              title="Quantity" 
            />
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              style="flex: 1;" 
              onclick="handleAddProductClick('${product.id}')"
            >
              Add to Order
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function handleAddProductClick(productId) {
  const product = allProducts.find(p => String(p.id) === String(productId));
  if (!product) return;

  const qtyInput = document.getElementById(`qty-${productId}`);
  const qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  const safeQty = isNaN(qty) || qty < 1 ? 1 : qty;

  if (window.tanveerOrder && typeof window.tanveerOrder.addItem === 'function') {
    window.tanveerOrder.addItem(product, safeQty);
  }
}

function filterCategory(category, buttonElement) {
  currentCategoryFilter = category;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonElement) {
    buttonElement.classList.add('active');
  }
  renderProductsGrid();
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

window.handleAddProductClick = handleAddProductClick;
window.filterCategory = filterCategory;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-grid-container')) {
    fetchProducts();
  }
});
