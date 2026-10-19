/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Order Builder and WhatsApp Handoff Script for Tanveer Traders
 * Location: Khushab, Punjab, Pakistan
 */

class OrderManager {
  constructor() {
    this.items = [];
    this.whatsappNumber = '923271639095';
    this.init();
  }

  init() {
    this.form = document.getElementById('order-form');
    this.itemsContainer = document.getElementById('order-selected-items');
    this.subtotalDisplay = document.getElementById('summary-subtotal');
    this.deliveryDisplay = document.getElementById('summary-delivery');
    this.totalDisplay = document.getElementById('summary-total');
    this.emptyState = document.getElementById('order-empty-state');
    this.alertNotice = document.getElementById('order-alert-notice');

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    this.render();
  }

  addItem(product, quantity = 1) {
    const existingIndex = this.items.findIndex(item => String(item.product_id) === String(product.id));
    const qty = parseInt(quantity, 10) || 1;

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += qty;
    } else {
      this.items.push({
        product_id: product.id,
        name: product.name,
        category: product.category,
        packaging: product.packaging,
        price_type: product.price_type,
        unit_price: product.price !== null ? Number(product.price) : null,
        quantity: qty
      });
    }

    this.showAlert(`Added ${product.name} to your order.`, 'success');
    this.render();

    // Scroll gently to order panel on mobile
    if (window.innerWidth < 1024) {
      const panel = document.getElementById('order-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  updateQuantity(productId, delta) {
    const item = this.items.find(i => String(i.product_id) === String(productId));
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(productId);
    } else {
      this.render();
    }
  }

  removeItem(productId) {
    this.items = this.items.filter(i => String(i.product_id) !== String(productId));
    this.render();
  }

  calculateTotals() {
    let subtotal = 0;
    let hasQuoteRequired = false;

    for (const item of this.items) {
      if (item.price_type === 'quote_required' || item.unit_price === null) {
        hasQuoteRequired = true;
      } else {
        subtotal += item.unit_price * item.quantity;
      }
    }

    return {
      subtotal,
      hasQuoteRequired,
      itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  render() {
    if (!this.itemsContainer) return;

    if (this.items.length === 0) {
      if (this.emptyState) this.emptyState.style.display = 'block';
      this.itemsContainer.innerHTML = '';
      if (this.subtotalDisplay) this.subtotalDisplay.textContent = 'PKR 0';
      if (this.totalDisplay) this.totalDisplay.textContent = 'PKR 0';
      return;
    }

    if (this.emptyState) this.emptyState.style.display = 'none';

    this.itemsContainer.innerHTML = this.items.map(item => {
      const isQuote = item.price_type === 'quote_required' || item.unit_price === null;
      const priceText = isQuote 
        ? 'Rate on Request' 
        : `PKR ${(item.unit_price * item.quantity).toLocaleString()}`;

      return `
        <div class="order-item-row" data-id="${item.product_id}">
          <div class="order-item-info">
            <span class="order-item-title">${escapeHtml(item.name)}</span>
            <span class="order-item-sub">${escapeHtml(item.packaging)} · <span class="tabular-nums">${priceText}</span></span>
          </div>
          <div class="order-item-qty-controls">
            <button type="button" class="btn-qty-mini" onclick="window.tanveerOrder.updateQuantity('${item.product_id}', -1)" aria-label="Decrease quantity">-</button>
            <span class="tabular-nums" style="font-weight: 600; min-width: 20px; text-align: center;">${item.quantity}</span>
            <button type="button" class="btn-qty-mini" onclick="window.tanveerOrder.updateQuantity('${item.product_id}', 1)" aria-label="Increase quantity">+</button>
            <button type="button" class="btn-remove-item" onclick="window.tanveerOrder.removeItem('${item.product_id}')" title="Remove item" aria-label="Remove item">✕</button>
          </div>
        </div>
      `;
    }).join('');

    const { subtotal, hasQuoteRequired } = this.calculateTotals();

    if (this.subtotalDisplay) {
      if (hasQuoteRequired && subtotal > 0) {
        this.subtotalDisplay.textContent = `PKR ${subtotal.toLocaleString()} + Quote Items`;
      } else if (hasQuoteRequired) {
        this.subtotalDisplay.textContent = 'To be confirmed';
      } else {
        this.subtotalDisplay.textContent = `PKR ${subtotal.toLocaleString()}`;
      }
    }

    if (this.totalDisplay) {
      if (hasQuoteRequired) {
        this.totalDisplay.textContent = 'Confirm rate via WhatsApp';
      } else {
        this.totalDisplay.textContent = `PKR ${subtotal.toLocaleString()} (Excl. delivery)`;
      }
    }
  }

  showAlert(message, type = 'info') {
    if (!this.alertNotice) return;
    this.alertNotice.className = `alert-notice ${type}`;
    this.alertNotice.textContent = message;
    this.alertNotice.style.display = 'block';

    setTimeout(() => {
      if (this.alertNotice) {
        this.alertNotice.style.display = 'none';
      }
    }, 5000);
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (this.items.length === 0) {
      this.showAlert('Please add at least one Rice or Sugar item to your order before proceeding.', 'error');
      return;
    }

    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const cityInput = document.getElementById('customer-city');
    const addressInput = document.getElementById('customer-address');
    const notesInput = document.getElementById('customer-notes');
    const orderTypeInput = document.querySelector('input[name="order-type"]:checked');

    const customerName = nameInput ? nameInput.value.trim() : '';
    const customerPhone = phoneInput ? phoneInput.value.trim() : '';
    const city = cityInput ? cityInput.value.trim() : '';
    const deliveryAddress = addressInput ? addressInput.value.trim() : '';
    const orderNotes = notesInput ? notesInput.value.trim() : '';
    const orderType = orderTypeInput ? orderTypeInput.value : 'retail';

    // Client-side validations
    if (!customerName || customerName.length < 2) {
      this.showAlert('Please provide your full name.', 'error');
      nameInput.focus();
      return;
    }

    if (!customerPhone || customerPhone.length < 10) {
      this.showAlert('Please enter a valid Pakistani mobile number (e.g., 03271639095).', 'error');
      phoneInput.focus();
      return;
    }

    if (!city || city.length < 2) {
      this.showAlert('Please enter your city.', 'error');
      cityInput.focus();
      return;
    }

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      city: city,
      delivery_address: deliveryAddress,
      order_notes: orderNotes,
      order_type: orderType,
      items: this.items.map(i => ({
        product_id: i.product_id,
        product_name: i.name,
        packaging: i.packaging,
        quantity: i.quantity,
        unit_price: i.unit_price,
        price_type: i.price_type
      }))
    };

    const submitBtn = document.getElementById('submit-order-btn');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Order on WhatsApp';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Preparing WhatsApp Order...';
    }

    try {
      // 1. Submit order to backend for validation & storage
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      let targetWhatsAppUrl = '';
      if (res.ok && result.success && result.whatsappUrl) {
        targetWhatsAppUrl = result.whatsappUrl;
      } else {
        // Fallback local URL generation if API had an issue
        targetWhatsAppUrl = this.buildWhatsAppUrl(payload);
      }

      // Show confirmation dialog before handoff
      this.showPostHandoffModal(targetWhatsAppUrl);

    } catch (err) {
      console.warn('Network issue during order submission, building direct WhatsApp link:', err);
      const fallbackUrl = this.buildWhatsAppUrl(payload);
      this.showPostHandoffModal(fallbackUrl);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  }

  buildWhatsAppUrl(data) {
    const { subtotal, hasQuoteRequired } = this.calculateTotals();
    const lines = [
      `*TANVEER TRADERS - ORDER ENQUIRY*`,
      `*Location:* Khushab, Punjab, Pakistan`,
      ``,
      `*Customer Details:*`,
      `• Name: ${data.customer_name}`,
      `• Phone: ${data.customer_phone}`,
      `• City: ${data.city}`,
      data.delivery_address ? `• Delivery Address: ${data.delivery_address}` : null,
      `• Order Type: ${data.order_type.toUpperCase()}`,
      ``,
      `*Order Items:*`
    ].filter(Boolean);

    for (const item of this.items) {
      if (item.price_type === 'quote_required' || item.unit_price === null) {
        lines.push(`• ${item.name} (${item.packaging}) × ${item.quantity} [Rate on Request]`);
      } else {
        const lineTotal = item.unit_price * item.quantity;
        lines.push(`• ${item.name} (${item.packaging}) × ${item.quantity} @ PKR ${item.unit_price.toLocaleString()} = PKR ${lineTotal.toLocaleString()}`);
      }
    }

    lines.push(``);
    if (hasQuoteRequired) {
      lines.push(`*Estimated Items Subtotal:* Rates to be confirmed`);
    } else {
      lines.push(`*Estimated Items Subtotal:* PKR ${subtotal.toLocaleString()}`);
    }

    lines.push(`*Delivery Charges:* To be confirmed by Tanveer Traders`);
    lines.push(`*Final Total:* Subject to stock & mandi rates confirmation`);

    if (data.order_notes) {
      lines.push(``);
      lines.push(`*Customer Notes:* ${data.order_notes}`);
    }

    lines.push(``);
    lines.push(`_Please confirm product availability, today's current rate, and delivery details._`);

    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  showPostHandoffModal(whatsappUrl) {
    const modal = document.getElementById('whatsapp-handoff-modal');
    const openBtn = document.getElementById('modal-open-whatsapp-btn');

    if (openBtn) {
      openBtn.onclick = () => {
        // Open safe WhatsApp tab
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
        if (modal) modal.classList.remove('active');
      };
    }

    if (modal) {
      modal.classList.add('active');
    } else {
      // Direct safe open without window.open
      const fallbackLink = document.createElement('a');
      fallbackLink.href = whatsappUrl;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      fallbackLink.remove();
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

document.addEventListener('DOMContentLoaded', () => {
  window.tanveerOrder = new OrderManager();
});
