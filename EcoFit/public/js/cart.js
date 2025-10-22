// Shopping Cart Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get all quantity controls
    const quantityControls = document.querySelectorAll('.quantity-control');
    
    quantityControls.forEach(control => {
        const minusBtn = control.querySelector('.minus');
        const plusBtn = control.querySelector('.plus');
        const input = control.querySelector('.qty-input');
        
        // Decrease quantity
        minusBtn.addEventListener('click', () => {
            let value = parseInt(input.value);
            if (value > 1) {
                input.value = value - 1;
                updateCartTotal();
            }
        });
        
        // Increase quantity
        plusBtn.addEventListener('click', () => {
            let value = parseInt(input.value);
            input.value = value + 1;
            updateCartTotal();
        });
        
        // Handle manual input
        input.addEventListener('change', () => {
            if (input.value < 1) {
                input.value = 1;
            }
            updateCartTotal();
        });
    });
    
    // Remove item functionality
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            cartItem.style.opacity = '0';
            cartItem.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                cartItem.remove();
                updateCartTotal();
                
                // Check if cart is empty
                const remainingItems = document.querySelectorAll('.cart-item');
                if (remainingItems.length === 0) {
                    showEmptyCart();
                }
            }, 300);
        });
    });
    
    // Checkbox functionality
    const checkboxes = document.querySelectorAll('.cart-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCartTotal);
    });
    
    // Apply discount code
    const applyBtn = document.querySelector('.apply-btn');
    const discountInput = document.querySelector('.discount-input');
    
    applyBtn.addEventListener('click', () => {
        const code = discountInput.value.trim().toUpperCase();
        
        if (code === 'ECOFIT10') {
            alert('✓ Discount code applied successfully!');
            updateCartTotal(10000); // 10,000 VND discount
        } else if (code === 'GREEN15') {
            alert('✓ Discount code applied successfully!');
            updateCartTotal(15000); // 15,000 VND discount
        } else if (code === '') {
            alert('⚠ Please enter a discount code');
        } else {
            alert('✗ Invalid discount code');
        }
    });
    
    // Checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        const checkedItems = document.querySelectorAll('.cart-checkbox:checked');
        
        if (checkedItems.length === 0) {
            alert('⚠ Please select at least one item to checkout');
        } else {
            // Redirect to checkout page (you can change this URL)
            window.location.href = 'checkout.html';
        }
    });
    
    // Update cart total
    function updateCartTotal(discountAmount = 15000) {
        let subtotal = 0;
        const shippingCost = 30000;
        
        // Calculate subtotal from checked items
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
        
        const total = subtotal + shippingCost - discountAmount;
        
        // Update display
        document.querySelectorAll('.order-summary__row')[0].querySelector('.order-summary__value').textContent = 
            formatPrice(subtotal);
        document.querySelector('.order-summary__value.discount').textContent = 
            '-' + formatPrice(discountAmount);
        document.querySelector('.total-value').textContent = 
            formatPrice(total);
    }
    
    // Format price with thousand separator
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    // Show empty cart message
    function showEmptyCart() {
        const cartTable = document.querySelector('.cart-table');
        cartTable.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <p style="font-size: 18px; margin-bottom: 20px;">Your cart is empty</p>
                <a href="shopping.html" style="display: inline-block; padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Continue Shopping</a>
            </div>
        `;
    }
});

// Add smooth transition styles
const style = document.createElement('style');
style.textContent = `
    .cart-item {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);