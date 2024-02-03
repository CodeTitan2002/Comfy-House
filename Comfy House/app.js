class Products {
    async getProducts() {
        try {
            const result = await fetch("products.json");
            const data = await result.json();
            const products = data.items.map(item => {
                const { title, price } = item.fields;
                const { id } = item.sys;
                const { file } = item.fields.image.fields;
                const image = file.url;
                return { title, price, id, image };
            });
            return products;
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }
}

class UI {
    constructor() {
        this.cartBtn = document.querySelector(".cart-btn");
        this.closeCartBtn = document.querySelector(".close-cart");
        this.clearCartBtn = document.querySelector(".clear-cart");
        this.cartDOM = document.querySelector(".cart");
        this.cartOverlay = document.querySelector(".cart-overlay");
        this.cartItems = document.querySelector(".cart-items");
        this.cartTotal = document.querySelector(".cart-total");
        this.cartContent = document.querySelector(".cart-content");
        this.productsDOM = document.querySelector(".products-center");
        this.cart = [];
        this.buttonsDOM = [];
    }

    displayProducts(products) {
        const result = products
            .map(
                product => `
                <article class="product">
                    <div class="img-container">
                        <img src=${product.image} alt="product" class="product-img" />
                        <button class="bag-btn" data-id=${product.id}>
                            <i class="fas fa-shopping-cart"></i> add to cart
                        </button>
                    </div>
                    <h3>${product.title}</h3>
                    <h4>$${product.price}</h4>
                </article>
            `
            )
            .join("");
        this.productsDOM.innerHTML = result;
    }

    getBagButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")];
        this.buttonsDOM = buttons;
        buttons.forEach(button => {
            const id = button.dataset.id;
            const inCart = this.cart.find(item => item.id === id);
            if (inCart) {
                button.innerText = "In Cart";
                button.disabled = true;
            }
            button.addEventListener("click", event => {
                event.target.innerText = "In Cart";
                event.target.disabled = true;

                const cartItem = { ...Storage.getProduct(id), amount: 1 };
                this.cart = [...this.cart, cartItem];
                Storage.saveCart(this.cart);
                this.setCartValues(this.cart);
                this.addCartItem(cartItem);
                this.showCart();
            });
        });
    }

    setCartValues(cart) {
        const tempTotal = cart.reduce((acc, item) => acc + item.price * item.amount, 0);
        const itemsTotal = cart.reduce((acc, item) => acc + item.amount, 0);
        this.cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        this.cartItems.innerText = itemsTotal;
    }

    addCartItem(item) {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <img src=${item.image} alt="product" />
            <div>
                <h4>${item.title}</h4>
                <h5>$${item.price}</h5>
                <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
                <p class="item-amount">${item.amount}</p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>
        `;
        this.cartContent.appendChild(div);
    }

    showCart() {
        this.cartOverlay.classList.add("transparentBcg");
        this.cartDOM.classList.add("showCart");
    }

    setupApp() {
        this.cart = Storage.getCart();
        this.setCartValues(this.cart);
        this.populateCart(this.cart);
        this.cartBtn.addEventListener("click", this.showCart.bind(this));
        this.closeCartBtn.addEventListener("click", this.hideCart.bind(this));
    }

    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item));
    }

    hideCart() {
        this.cartOverlay.classList.remove("transparentBcg");
        this.cartDOM.classList.remove("showCart");
    }

    cartLogic() {
        this.clearCartBtn.addEventListener("click", this.clearCart.bind(this));
        this.cartContent.addEventListener("click", event => {
            if (event.target.classList.contains("remove-item")) {
                const removeItem = event.target;
                const id = removeItem.dataset.id;
                this.cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            } else if (event.target.classList.contains("fa-chevron-up")) {
                const addAmount = event.target;
                const id = addAmount.dataset.id;
                const tempItem = this.cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(this.cart);
                this.setCartValues(this.cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            } else if (event.target.classList.contains("fa-chevron-down")) {
                const lowerAmount = event.target;
                const id = lowerAmount.dataset.id;
                const tempItem = this.cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;
                if (tempItem.amount > 0) {
                    Storage.saveCart(this.cart);
                    this.setCartValues(this.cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                } else {
                    this.cartContent.removeChild(lowerAmount.parentElement);
                    this.removeItem(id);
                }
            }
        });
    }

    clearCart() {
        const cartItems = this.cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        while (this.cartContent.children.length > 0) {
            this.cartContent.removeChild(this.cartContent.children[0]);
        }
        this.hideCart();
    }

    removeItem(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.setCartValues(this.cart);
        Storage.saveCart(this.cart);
        const button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
    }

    getSingleButton(id) {
        return this.buttonsDOM.find(button => button.dataset.id === id);
    }
}

class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }

    static getProduct(id) {
        const products = JSON.parse(localStorage.getItem("products"));
        return products.find(product => product.id === id);
    }

    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    static getCart() {
        return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();

    ui.setupApp();

    products.getProducts().then(products => {
        ui.displayProducts(products);
        Storage.saveProducts(products);
    }).then(() => {
        ui.getBagButtons();
        ui.cartLogic();
    });
});