document.addEventListener("DOMContentLoaded", () => {
  const paymentInfo = tryParse(localStorage.getItem("paymentInfo"));

  if (!paymentInfo) {
    alert("Unable to find payment data. Go back to Payment 1!");
    window.location.href = "../pages/07_PAYMENT1.html";
    return;
  }

  const items = paymentInfo.cart || [];
  const subtotal = safeNumber(paymentInfo.subtotal) || calcSubtotal(items);
  const shipping = safeNumber(paymentInfo.shipping ?? 30000);
  const discount = safeNumber(paymentInfo.discount ?? 0);
  const total = safeNumber(paymentInfo.total) || subtotal + shipping - discount;
  const orderId = paymentInfo.orderId || generateOrderId();

  const orderSpan = document.querySelector(".page-title span");
  if (orderSpan) orderSpan.textContent = `#${orderId}`;

  const deliveryText = document.querySelector(".delivery-text");
  if (deliveryText) {
    if (paymentInfo.customer) {
      const c = paymentInfo.customer;
      deliveryText.innerHTML = `
        ${c.fullname || "-"} | ${c.phone || "-"}<br>
        ${c.address || "-"}
      `;
    } else {
      deliveryText.innerHTML = paymentInfo.address || "- | -<br>-";
    }
  }

  renderOrderItems(items);
  renderOrderSummary(subtotal, shipping, discount, total);

  // Save order to history
  const orderData = {
    orderId,
    total,
    cart: items,
    address: paymentInfo.address,
    status: "processing",
    customer: paymentInfo.customer,
    subtotal,
    shipping,
    discount,
    paidAt: new Date().toISOString(),
  };
  
  pushOrderHistory(orderData);

  // Remove paid items from cart
  removePaidItemsFromCart(items);

  // Watch order status and cleanup when delivered
  watchOrderStatusForCleanup(orderId);
  
  // DEBUG: Log localStorage state
  console.log("[DEBUG] Current localStorage state:");
  console.log("- orders:", localStorage.getItem("orders"));
  console.log("- cart:", localStorage.getItem("cart"));
});

// ======================= WATCH ORDER STATUS =======================
function watchOrderStatusForCleanup(orderId) {
  console.log("[ORDER] Starting status watch for:", orderId);
  
  const orderProgress = document.querySelector(".order-progress");
  if (!orderProgress) {
    console.warn("[ORDER] .order-progress element not found!");
    startPollingForDelivery(orderId);
    return;
  }

  let hasCleanedUp = false;

  const checkAndCleanup = () => {
    if (hasCleanedUp) return;
    
    const currentStep = orderProgress.getAttribute("data-step");
    console.log("[ORDER] Current step:", currentStep);
    
    if (currentStep === "5") {
      console.log("[ORDER] Delivered! Starting cleanup...");
      hasCleanedUp = true;
      cleanupAfterOrderDelivered(orderId);
      if (observer) observer.disconnect();
      if (pollInterval) clearInterval(pollInterval);
    }
  };

  // Method 1: MutationObserver
  const observer = new MutationObserver((mutations) => {
    console.log("[ORDER] Mutation detected");
    checkAndCleanup();
  });

  observer.observe(orderProgress, {
    attributes: true,
    attributeFilter: ["data-step"],
  });

  // Method 2: Polling (backup)
  const pollInterval = setInterval(() => {
    checkAndCleanup();
  }, 2000);

  // Check immediately
  checkAndCleanup();
}

// ======================= POLLING BACKUP =======================
function startPollingForDelivery(orderId) {
  console.log("[ORDER] Starting polling backup method");
  
  const pollInterval = setInterval(() => {
    const orderProgress = document.querySelector(".order-progress");
    if (orderProgress) {
      const currentStep = orderProgress.getAttribute("data-step");
      if (currentStep === "5") {
        console.log("[ORDER] Delivered detected via polling!");
        cleanupAfterOrderDelivered(orderId);
        clearInterval(pollInterval);
      }
    }
  }, 2000);
}

// ======================= CLEANUP AFTER DELIVERY =======================
function cleanupAfterOrderDelivered(orderId) {
  try {
    console.log("[CLEANUP] Starting cleanup for order:", orderId);
    
    // Log before cleanup
    console.log("[CLEANUP] Before:");
    console.log("- checkoutCart:", localStorage.getItem("checkoutCart"));
    console.log("- checkoutOrder:", localStorage.getItem("checkoutOrder"));
    console.log("- paymentInfo:", localStorage.getItem("paymentInfo"));
    
    // Update order status
    let orders = tryParse(localStorage.getItem("orders"));
    
    // Safety check: ensure orders is an array
    if (!Array.isArray(orders)) {
      console.warn("[CLEANUP] orders is not an array, initializing as empty array");
      orders = [];
    }
    
    console.log("[CLEANUP] Orders array length:", orders.length);
    
    const orderIndex = orders.findIndex(o => o && o.orderId === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].status = "delivered";
      orders[orderIndex].deliveredAt = new Date().toISOString();
      localStorage.setItem("orders", JSON.stringify(orders));
      console.log(`[CLEANUP] Order #${orderId} marked as delivered`);
    } else {
      console.warn(`[CLEANUP] Order #${orderId} not found in history`);
    }

    // Remove temporary data
    localStorage.removeItem("checkoutCart");
    localStorage.removeItem("checkoutOrder");
    localStorage.removeItem("paymentInfo");
    
    // Verify cleanup
    console.log("[CLEANUP] After:");
    console.log("- checkoutCart:", localStorage.getItem("checkoutCart"));
    console.log("- checkoutOrder:", localStorage.getItem("checkoutOrder"));
    console.log("- paymentInfo:", localStorage.getItem("paymentInfo"));
    
    console.log("[CLEANUP] Completed successfully!");
    
    showCleanupNotification();
    
  } catch (e) {
    console.error("[CLEANUP] Error:", e);
    alert("Cleanup failed! Check console for details.");
  }
}

// ======================= SHOW NOTIFICATION =======================
function showCleanupNotification() {
  const notification = document.createElement("div");
  notification.textContent = "Order completed successfully!";
  Object.assign(notification.style, {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    background: "#3DA547",
    color: "white",
    padding: "15px 25px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontWeight: "500",
    fontSize: "14px",
    zIndex: "9999",
    animation: "slideIn 0.3s ease",
  });
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ======================= REMOVE PAID ITEMS =======================
function removePaidItemsFromCart(paidItems) {
  try {
    const cart = tryParse(localStorage.getItem("cart")) || [];
    
    const paidItemsSet = new Set(
      paidItems.map(item => 
        `${item.product_id || item.id}_${item.color}_${item.size}`
      )
    );

    const remainingCart = cart.filter(item => {
      const itemKey = `${item.product_id || item.id}_${item.color}_${item.size}`;
      return !paidItemsSet.has(itemKey);
    });

    localStorage.setItem("cart", JSON.stringify(remainingCart));
    updateCartBadgeAfterPayment(remainingCart);
    
    console.log(`[CART] Removed ${paidItems.length} paid items from cart`);
    console.log(`[CART] Remaining items: ${remainingCart.length}`);
    
  } catch (e) {
    console.error("[CART] Error removing paid items:", e);
  }
}

// ======================= UPDATE CART BADGE =======================
function updateCartBadgeAfterPayment(cart) {
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  if (window.parent !== window) {
    window.parent.postMessage({
      action: 'updateCartBadge',
      count: totalItems
    }, '*');
  }
  
  const badge = document.querySelector('a[href*="05_SHOPPING_CART"] .badge');
  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }
  
  console.log(`[CART] Badge updated: ${totalItems} items`);
}

// ======================= HELPER FUNCTIONS =======================
function tryParse(str) {
  try {
    if (!str) return null;
    const parsed = JSON.parse(str);
    return parsed;
  } catch (e) {
    console.error("[PARSE] Error parsing:", str, e);
    return null;
  }
}

function safeNumber(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d\-]/g, "");
  return s === "" ? 0 : Number(s);
}

function calcSubtotal(cart) {
  return (cart || []).reduce(
    (s, it) => s + safeNumber(it.price) * Number(it.qty ?? it.quantity ?? 1),
    0
  );
}

function formatNumber(num) {
  return (Number(num) || 0).toLocaleString("vi-VN");
}

function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderOrderItems(list) {
  const rd = document.querySelector(".order-detail");
  if (!rd) return;
  
  const normalized = list.map(normalizeItem);
  
  if (!normalized.length) {
    rd.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">No items</p>';
    return;
  }
  
  let html = '<h3 style="margin-bottom:12px;">ORDER DETAIL</h3>';
  
  normalized.forEach((item) => {
    html += `
      <div class="order-item"
           style="display:flex;
                  align-items:center;
                  justify-content:space-between;
                  margin-bottom:20px;">
        <div style="display:flex;
                    align-items:center;
                    gap:12px;
                    flex:1;">
          <a href="../pages/04_PRODUCT_Detail.html?id=${escapeHtml(item.id || "")}" 
             style="display:block;">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" 
                 style="width:80px;
                       height:80px;
                       object-fit:cover;
                       border-radius:8px;"
                 onerror="this.src='../images/Product_images/default.png'">
          </a>
          <div class="order-item-info" style="flex:1; min-width:0;">
            <h4 style="margin:0;
                       white-space:nowrap;
                       overflow:hidden;
                       text-overflow:ellipsis;
                       font-size:15px;
                       font-weight:600;
                       max-width:100%;">
              ${escapeHtml(item.name)}
            </h4>
            <p style="margin:4px 0; color:#666;">Color: ${escapeHtml(item.color)} | Size: ${escapeHtml(item.size)}</p>
            <span class="order-item-price"
                  style="font-weight:500;">${formatNumber(item.price)}d</span>
          </div>
        </div>

        <span class="order-item-qty"
              style="min-width:45px;
                    text-align:right;
                    font-weight:600;
                    color:#333;">
          x${item.qty}
        </span>
      </div>`;
  });
  
  rd.innerHTML = html + '<hr style="border:none;border-top:1px solid #ccc;margin-top:10px;">';
}

function renderOrderSummary(subtotal, shipping, discount, total) {
  document.querySelector(".subtotal").textContent =
    formatNumber(subtotal) + "d";
  document.querySelector(".shipping").textContent =
    formatNumber(shipping) + "d";
  document.querySelector(".discount").textContent = discount
    ? `-${formatNumber(discount)}d`
    : "0d";
  document.querySelector(".total-value").textContent =
    formatNumber(total) + "d";
}

function normalizeItem(it) {
  const qty = Number(it.qty ?? it.quantity ?? 1);
  const price = safeNumber(it.price ?? 0);
  return {
    id: it.product_id || it.id || "",
    name: it.product_name || it.name || "Unknown",
    qty,
    price,
    color: it.color || "",
    size: it.size || "",
    image: it.image || it.img || "../images/Product_images/default.png",
  };
}

function generateOrderId() {
  return "ORDER_" + Math.floor(1000 + Math.random() * 9000);
}

function pushOrderHistory(orderData) {
  try {
    const hist = tryParse(localStorage.getItem("orders")) || [];
    hist.push(orderData);
    localStorage.setItem("orders", JSON.stringify(hist));
    console.log("[ORDER] Saved to history:", orderData.orderId);
  } catch (e) {
    console.warn("[ORDER] Error saving history:", e);
  }
}