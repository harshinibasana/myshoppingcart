const apiUrl = 'http://localhost:3000';

// Function to fetch and display products
async function loadProducts() {
    try {
        const response = await fetch(`${apiUrl}/products`);
        const products = await response.json();
        const productsContainer = document.getElementById('products');
        productsContainer.innerHTML = '';
        
        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.classList.add('product');
            productElement.innerHTML = `
                <strong>${product.name}</strong><br>
                Price: $${product.price}<br>
                <button onclick="addToCart('${product._id}')">Add to Cart</button>
            `;
            productsContainer.appendChild(productElement);
        });
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Function to add product to cart
async function addToCart(productId) {
    const quantity = prompt("Enter quantity:", 1);
    if (quantity && !isNaN(quantity) && quantity > 0) {
        const response = await fetch(`${apiUrl}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId, quantity: parseInt(quantity) })
        });

        const data = await response.json();
        alert(data.message);
        loadCart();
    } else {
        alert("Invalid quantity");
    }
}

// Function to fetch and display the cart
async function loadCart() {
    try {
        const response = await fetch(`${apiUrl}/cart`);
        const cartItems = await response.json();
        const cartContainer = document.getElementById('cart');
        cartContainer.innerHTML = '';
        
        cartItems.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.classList.add('cart-item');
            cartItemElement.innerHTML = `
                <strong>${item.product.name}</strong><br>
                Quantity: ${item.quantity}<br>
                Price: $${item.product.price} <br>
                Total: $${item.product.price * item.quantity} <br>
                <button onclick="removeFromCart('${item.product._id}')">Remove</button>
            `;
            cartContainer.appendChild(cartItemElement);
        });

        loadCartTotal();
    } catch (error) {
        console.error("Error fetching cart:", error);
    }
}

// Function to remove item from cart
async function removeFromCart(productId) {
    const response = await fetch(`${apiUrl}/cart/${productId}`, {
        method: 'DELETE',
    });

    const data = await response.json();
    alert(data.message);
    loadCart();
}

// Function to load and display cart total
async function loadCartTotal() {
    try {
        const response = await fetch(`${apiUrl}/cart/total`);
        const data = await response.json();
        document.getElementById('cart-total').innerText = data.total.toFixed(2);
    } catch (error) {
        console.error("Error calculating cart total:", error);
    }
}

// Initial load of products and cart
loadProducts();
loadCart();
