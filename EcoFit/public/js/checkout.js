// checkout.js
document.addEventListener('DOMContentLoaded', function() {
    // === 1. Đọc dữ liệu giỏ hàng từ localStorage ===
    const cartData = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    const orderDetailContainer = document.querySelector('.order-detail');
    let subtotal = 0;
    const shippingCost = 30000;
    let discount = 0;

    // === 2. Xóa mẫu cũ trong HTML ===
    const oldItems = orderDetailContainer.querySelectorAll('.order-item');
    oldItems.forEach(item => item.remove());

    // === 3. Hiển thị sản phẩm trong checkout ===
    cartData.forEach(product => {
        const item = document.createElement('div');
        item.classList.add('order-item');

        const imgSrc = product.image || '../images/Product_images/organic_cotton_tee.png';

        item.innerHTML = `
            <img src="${imgSrc}" alt="${product.name}">
            <div class="order-item-info">
                <h4>${product.name}</h4>
                <p>Color: ${product.color} | Size: ${product.size}</p>
                <span class="order-item-price">${formatPrice(product.price)}</span>
            </div>
            <span class="order-item-qty">x${product.quantity}</span>
        `;
        orderDetailContainer.appendChild(item);

        subtotal += product.price * product.quantity;
    });

    // === 4. Hiển thị tổng tiền ban đầu ===
    updateSummary(subtotal, shippingCost, discount);

    // === 5. Áp dụng mã giảm giá ===
    const applyBtn = document.querySelector('.apply-btn');
    const discountInput = document.querySelector('.discount-input');
    let appliedPromotion = null;

    applyBtn.addEventListener('click', () => {
        const code = discountInput.value.trim().toUpperCase();

        if (code === '') {
            alert('⚠ Please enter a discount code');
            return;
        }

        // Load promotions data from localStorage
        const promotionsData = JSON.parse(localStorage.getItem('promotions')) || { promotion: [] };
        
        // Find the promotion by code
        const promotion = promotionsData.promotion.find(p => p.promo_code === code);

        if (!promotion) {
            discount = 0;
            appliedPromotion = null;
            alert('✗ Invalid discount code');
        } else {
            appliedPromotion = promotion;
            // Calculate discount amount based on discount rate and subtotal
            discount = Math.round((subtotal * promotion.discount_rate) / 100);
            alert(`✓ Discount code applied successfully! (${promotion.discount_rate}% off)`);
        }

        updateSummary(subtotal, shippingCost, discount);
    });

    // Update the updateSummary function to handle dynamic discount calculation
    function updateSummary(subtotal, shipping, discountAmount) {
        // If we have an applied promotion, recalculate discount based on current subtotal
        if (appliedPromotion) {
            discountAmount = Math.round((subtotal * appliedPromotion.discount_rate) / 100);
        }
        
        const total = subtotal + shipping - discountAmount;
        
        // Update DOM elements
        const subtotalElement = document.querySelector('.subtotal-price');
        const shippingElement = document.querySelector('.shipping-price');
        const discountElement = document.querySelector('.discount-price');
        const totalElement = document.querySelector('.total-price');
        
        if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
        if (shippingElement) shippingElement.textContent = formatPrice(shipping);
        if (discountElement) discountElement.textContent = formatPrice(discountAmount);
        if (totalElement) totalElement.textContent = formatPrice(total);
    }

    // Also update any other functions that call updateSummary to ensure discount is recalculated
    // For example, when quantity changes or items are removed:
    function handleQuantityChange() {
        const subtotal = calculateSubtotal(); // Your existing subtotal calculation
        const shippingCost = calculateShipping(); // Your existing shipping calculation
        updateSummary(subtotal, shippingCost, discount);
    }

    // Make sure to load promotions data when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        // If promotions aren't in localStorage, load them
        if (!localStorage.getItem('promotions')) {
            loadPromotionsData();
        }
    });

    async function loadPromotionsData() {
        try {
            const response = await fetch('../../dataset/promotions.json');
            const data = await response.json();
            localStorage.setItem('promotions', JSON.stringify(data));
            console.log('Promotions data loaded successfully');
        } catch (error) {
            console.error('Error loading promotions data:', error);
        }
    }

    // Format price function (make sure this exists)
    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    }

    // === 6. Nút PLACE ORDER ===
    const placeOrderBtn = document.querySelector('.place-order');
    placeOrderBtn.addEventListener('click', () => {
        const fullname = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const detail = document.getElementById('detail').value.trim();

        if (!fullname || !phone || !address || !detail) {
            alert('⚠ Please fill in all delivery information.');
            return;
        }

        const deliveryMethod = document.querySelector('input[name="delivery"]:checked');
        const paymentMethod = document.querySelector('input[name="payment"]:checked');

        if (!deliveryMethod || !paymentMethod) {
            alert('⚠ Please select delivery and payment methods.');
            return;
        }

        // Tạo đơn hàng
        const orderData = {
            customer: { fullname, phone, address, detail },
            delivery: deliveryMethod.parentElement.textContent.trim(),
            payment: paymentMethod.parentElement.textContent.trim(),
            items: cartData,
            subtotal,
            shippingCost,
            discount,
            total: subtotal + shippingCost - discount,
            status: 'Pending Payment'
        };

        localStorage.setItem('checkoutOrder', JSON.stringify(orderData));
        window.location.href = '07_PAYMENT1.html';
    });

    // === 7. Hàm cập nhật tổng tiền ===
    function updateSummary(subtotal, shipping, discount) {
        document.querySelectorAll('.order-summary__row')[0]
            .querySelector('.order-summary__value').textContent = formatPrice(subtotal);
        document.querySelector('.order-summary__value.discount').textContent = '-' + formatPrice(discount);
        document.querySelector('.total-value').textContent = formatPrice(subtotal + shipping - discount);
    }

    // === 8. Hàm format giá ===
    function formatPrice(price) {
        return price.toLocaleString('vi-VN');
    }
});
