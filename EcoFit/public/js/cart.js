// Shopping Cart Functionality
document.addEventListener('DOMContentLoaded', function() {
    // === 1. Handle quantity control ===
    const quantityControls = document.querySelectorAll('.quantity-control');
    quantityControls.forEach(control => {
        const minusBtn = control.querySelector('.minus');
        const plusBtn = control.querySelector('.plus');
        const input = control.querySelector('.qty-input');
        
        minusBtn.addEventListener('click', () => {
            let value = parseInt(input.value);
            if (value > 1) {
                input.value = value - 1;
                updateCartTotal();
            }
        });

        plusBtn.addEventListener('click', () => {
            let value = parseInt(input.value);
            input.value = value + 1;
            updateCartTotal();
        });

        input.addEventListener('change', () => {
            if (input.value < 1) input.value = 1;
            updateCartTotal();
        });
    });

    // === 2. Remove item functionality ===
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            cartItem.style.opacity = '0';
            cartItem.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                cartItem.remove();
                updateCartTotal();

                const remainingItems = document.querySelectorAll('.cart-item');
                if (remainingItems.length === 0) showEmptyCart();
            }, 300);
        });
    });

    // === 3. Checkbox select/deselect ===
    const checkboxes = document.querySelectorAll('.cart-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCartTotal);
    });

    // === 4. Checkout button ===
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        const checkedItems = document.querySelectorAll('.cart-checkbox:checked');
        
        if (checkedItems.length === 0) {
            alert('⚠ Please select at least one item to checkout');
            return;
        }

        // Tạo mảng cartData chứa các item đã chọn
        const cartData = [];
        checkedItems.forEach(checkbox => {
            const item = checkbox.closest('.cart-item');
            const name = item.querySelector('.cart-item__name').textContent;
            const color = item.querySelectorAll('.cart-item__detail')[0].textContent.split(': ')[1];
            const size = item.querySelectorAll('.cart-item__detail')[1].textContent.split(': ')[1];
            const quantity = parseInt(item.querySelector('.qty-input').value);
            const priceText = item.querySelector('.cart-item__subtotal .price').textContent;
            const price = parseInt(priceText.replace(/\./g, ''));
            const image = item.querySelector('img').src;

            cartData.push({
                name,
                color,
                size,
                quantity,
                price,
                image
            });
        });

        // Lưu sang localStorage để checkout đọc
        localStorage.setItem('checkoutCart', JSON.stringify(cartData));

        // Chuyển sang trang checkout
        window.location.href = '06_CHECKOUT.html';
    });

    // === 5. Cập nhật tổng tiền ===
    function updateCartTotal() {
        let subtotal = 0;
        const shippingCost = 30000;

        const cartItems = document.querySelectorAll('.cart-item');
        cartItems.forEach(item => {
            const checkbox = item.querySelector('.cart-checkbox');
            if (checkbox.checked) {
                const quantity = parseInt(item.querySelector('.qty-input').value);
                const priceText = item.querySelector('.cart-item__subtotal .price').textContent;
                const price = parseInt(priceText.replace(/\./g, ''));
                subtotal += (price * quantity);
            }
        });

        const total = subtotal + shippingCost;

        // Cập nhật hiển thị
        document.querySelectorAll('.order-summary__row')[0]
            .querySelector('.order-summary__value').textContent = formatPrice(subtotal);
        document.querySelector('.total-value').textContent = formatPrice(total);
    }

    // === 6. Format giá tiền ===
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // === 7. Khi giỏ trống ===
    function showEmptyCart() {
        const cartTable = document.querySelector('.cart-table');
        cartTable.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <p style="font-size: 18px; margin-bottom: 20px;">Your cart is empty</p>
                <a href="shopping.html" style="display: inline-block; padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Continue Shopping</a>
            </div>
        `;
    }

    // === 8. Style animation ===
    const style = document.createElement('style');
    style.textContent = `
        .cart-item { transition: all 0.3s ease; }
    `;
    document.head.appendChild(style);
});
