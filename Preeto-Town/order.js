let totalWorkers = 0;

async function loadWorkers() {
    try {
        const xml = await fetch('workers.xml').then(r => r.text());
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");
        const workerEls = doc.querySelectorAll("workers");
        const unique = new Set();
        workerEls.forEach(el => {
            el.textContent.split(",").forEach(w => {
                const name = w.trim();
                if (name) unique.add(name);
            });
        });
        totalWorkers = unique.size;
    } catch (e) {
        totalWorkers = 0;
    }
}

async function loadShops() {
    await loadWorkers();
    try {
        const response = await fetch('shops.csv');
        const data = await response.text();
        const rows = data.trim().split("\n");
        const container = document.getElementById("shop-container");
        const colors = ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff"];

        for (let i = 1; i < rows.length; i += 2) {
            const shopCols = rows[i].split(",");
            const priceCols = rows[i + 1] ? rows[i + 1].split(",") : [];
            const shopName = shopCols[0];
            const items = shopCols.slice(1);
            const basePrices = priceCols.slice(1);

            const btn = document.createElement("button");
            btn.className = "shop-btn";
            btn.style.backgroundColor = colors[Math.floor(i/2) % colors.length];
            btn.innerText = shopName;

            btn.onclick = () => renderShopMenu(shopName, items, basePrices);
            container.appendChild(btn);
        }
    } catch (e) { show("Error loading shops.csv", "", "alert"); }
}

function renderShopMenu(shopName, items, basePrices) {
    const status = getCookie("status") || "mallow";
    const name = getCookie("username");
    let html = `<div class="menu-box"><div id="active-menu"><h3>${shopName}</h3>`;

    items.forEach((itemStr, idx) => {
        const processed = processItemFormula(itemStr);
        const price = calculateTownPrice(basePrices[idx], name, status);

        html += `
            <div class="item-row ${processed.disabled ? 'disabled-item' : ''}">
                <span>${processed.name} - <strong>${processed.status === 'Available' ? price.display : processed.status}</strong></span>
                ${!processed.disabled ? `<button class="buy-btn" data-item="${processed.name}" data-price="${price.cart}" onclick="addToCartFromBtn(this)">Add to Cart</button>` : ''}
            </div>`;
    });
    show(html + "</div></div>", "menu-display");
    renderCart();
}

function processItemFormula(item) {
    const now = new Date();
    if (item.includes("x£") && item.includes(">")) return { name: item.split("£>")[1], status: "NOT FOR SALE", disabled: true };

    if (item.includes("v>")) {
        const openTime = parseDate(item.split("v>")[1].split("&")[0]);
        if (now < openTime) return { name: item.split("£>")[1], status: "Opening Soon!", disabled: true };
    }

    return { name: item.includes("£>") ? item.split("£>")[1] : item, status: "Available", disabled: false };
}

function calculateTownPrice(baseStr, name, status) {
    if (name && ["S", "Preeto"].includes(name.split(" ")[0])) return { display: "75% OFF + 4-for-1 Deal!", cart: "£0.00" };
    const base = parseFloat(String(baseStr).replace('£', ''));
    const workerPercent = 100 / (totalWorkers + 1);
    if (status === 'manager') {
        const p = `£${((base * workerPercent / 100) / 2).toFixed(2)}`;
        return { display: p, cart: p };
    }
    if (status === 'worker') {
        const p = `£${(base * workerPercent / 100).toFixed(2)}`;
        return { display: p, cart: p };
    }
    return {
        display: `${baseStr} (3-for-1)`,
        cart: baseStr
    };
}

function parseDate(str) {
    const [dPart, tPart] = str.split('|');
    const [d, m, y] = dPart.split('/');
    return new Date(`${y}-${m}-${d}T${tPart}:00`);
}
let cart = [];

function addToCartFromBtn(btn) {
    cart.push({ item: btn.getAttribute("data-item"), price: btn.getAttribute("data-price") });
    renderCart();
}

function renderCart() {
    let subtotal = 0;
    let html = `<div class="menu-box"><h3>Cart</h3>`;

    if (!cart.length) {
        html += `<div id="cart-items">No items yet</div>`;
    } else {
        html += `<div id="cart-items">`;
        cart.forEach(entry => {
            const price = parseFloat(String(entry.price).replace('£', ''));
            if (!Number.isNaN(price)) subtotal += price;
            html += `<div class="cart-row"><span>${entry.item}</span><span>${entry.price}</span></div>`;
        });
        html += `</div>`;
    }

    html += `<hr><div class="cart-row"><strong>Subtotal: </strong><strong>£${subtotal.toFixed(2)}</strong></div>`;
    html += `<button class="buy-btn" onclick="checkoutCart()">Buy</button>`;
    html += `<button class="buy-btn" onclick="cart=[];renderCart()">Clear</button>`
    html += `</div>`;
    show(html, "cart-display");
}

function checkoutCart() {
    if (!cart.length) return;
    show(`Purchased ${cart.length} item${'s' ? cart.length != 1}!`, "", "alert");
    cart = [];
    renderCart();
}
