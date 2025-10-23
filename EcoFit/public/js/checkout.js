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
    applyBtn.addEventListener('click', () => {
        const code = discountInput.value.trim().toUpperCase();

        if (code === '') {
            alert('⚠ Please enter a discount code');
            return;
        }

        if (code === 'ECOFIT10') {
            discount = 10000;
            alert('✓ Discount code applied successfully! (-10.000đ)');
        } else if (code === 'GREEN15') {
            discount = 15000;
            alert('✓ Discount code applied successfully! (-15.000đ)');
        } else {
            discount = 0;
            alert('✗ Invalid discount code');
        }

        updateSummary(subtotal, shippingCost, discount);
    });

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
