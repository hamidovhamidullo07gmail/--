// Объект корзины
let cart = {
    items: [],
    total: 0
};

// Функция для загрузки корзины из localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartCount();
}

// Функция для сохранения корзины в localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Функция для обновления счетчика корзины
function updateCartCount() {
    const countElements = document.querySelectorAll('#cart-count');
    countElements.forEach(el => {
        el.textContent = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    });
}

// Функция для добавления товара в корзину
function addToCart(name, price) {
    const existingItem = cart.items.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.items.push({ name, price, quantity: 1 });
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    saveCart();
    updateCartCount();
    alert(`${name} добавлен в корзину!`);
}

// Функция для удаления товара из корзины
function removeFromCart(name) {
    cart.items = cart.items.filter(item => item.name !== name);
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    saveCart();
    renderCartItems();
    updateCartCount();
}

// Функция для изменения количества товара
function updateQuantity(name, newQuantity) {
    const item = cart.items.find(item => item.name === name);
    if (item) {
        item.quantity = parseInt(newQuantity) || 1;
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        saveCart();
        renderCartItems();
        updateCartCount();
    }
}

// Функция для отображения товаров в корзине
function renderCartItems() {
    const cartItemsElement = document.getElementById('cart-items');
    const totalPriceElement = document.getElementById('total-price');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    
    if (cart.items.length === 0) {
        cartItemsElement.innerHTML = '<p id="empty-cart-message">Ваша корзина пуста</p>';
        totalPriceElement.textContent = '0';
        return;
    }
    
    if (emptyCartMessage) emptyCartMessage.remove();
    
    cartItemsElement.innerHTML = cart.items.map(item => `
        <div class="cart-item">
            <div>
                <h4>${item.name}</h4>
                <p>${item.price} руб/кг × ${item.quantity} кг</p>
            </div>
            <div class="cart-item-actions">
                <input type="number" min="1" value="${item.quantity}" 
                       onchange="updateQuantity('${item.name}', this.value)" style="width: 50px;">
                <button onclick="removeFromCart('${item.name}')">Удалить</button>
            </div>
        </div>
    `).join('');
    
    totalPriceElement.textContent = cart.total;
}

// Функция для отправки заказа в Telegram
async function sendOrderToTelegram(orderData) {
    const botToken = 'YOUR_BOT_TOKEN'; // Замените на токен вашего бота
    const chatId = 'YOUR_CHAT_ID';    // Замените на ваш chat_id
    
    const message = `Новый заказ!\n\nИмя: ${orderData.name}\nТелефон: ${orderData.phone}\nАдрес: ${orderData.address}\n\nТовары:\n${
        orderData.items.map(item => `- ${item.name}: ${item.quantity} кг × ${item.price} руб = ${item.quantity * item.price} руб`).join('\n')
    }\n\nИтого: ${orderData.total} руб`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message
            })
        });
        
        const result = await response.json();
        return result.ok;
    } catch (error) {
        console.error('Ошибка при отправке заказа:', error);
        return false;
    }
}

// Обработка формы заказа
function setupOrderForm() {
    const form = document.getElementById('order-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (cart.items.length === 0) {
                alert('Ваша корзина пуста!');
                return;
            }
            
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            
            const orderData = {
                name,
                phone,
                address,
                items: cart.items,
                total: cart.total
            };
            
            const success = await sendOrderToTelegram(orderData);
            
            if (success) {
                alert('Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.');
                // Очищаем корзину после успешного заказа
                cart.items = [];
                cart.total = 0;
                saveCart();
                updateCartCount();
                renderCartItems();
                form.reset();
            } else {
                alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.');
            }
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    
    // Если это страница корзины, отображаем товары
    if (document.getElementById('cart-items')) {
        renderCartItems();
        setupOrderForm();
    }
});