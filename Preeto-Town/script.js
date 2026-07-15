// --- AUTHENTICATION CHECK ---
function checkAuth() {
    let u = getCookie("username");
    if (u) {
        renderDashboard(u, getCookie("mode"), getCookie("status"));
    } else {
        renderLogin();
    }
}

// --- LOGIN UI ---
function renderLogin() {
    document.getElementById("main-content").innerHTML = `
        <div class="box">
            <h1>🏘️ Preeto Town</h1>
            <select id="login-group" onchange="updateUI()">
                <option value="mallow">Mallow</option>
                <option value="person">Person</option>
                <option value="community">Community</option>
            </select>

            <input type="text" id="fname" placeholder="First Name">
            <input type="text" id="lname" placeholder="Last Name">

            <select id="status-select">
                <option value="citizen">Citizen</option>
                <option value="worker">Worker</option>
                <option value="visitor">Visitor</option>
            </select>

            <input type="password" id="secure" placeholder="Secure Code" style="display:none;">

            <div style="margin: 10px 0; font-size: 12px;">
                <input type="checkbox" id="remember" checked> Remember Me
            </div>

            <button onclick="handleLogin()">ENTER TOWN</button>
        </div>`;
}

// Switches labels between Wilcock, Keyring, and Community
function updateUI() {
    const group = document.getElementById("login-group").value;
    const lnameBox = document.getElementById("lname");
    const secureBox = document.getElementById("secure");

    if (group === "person") {
        lnameBox.style.display = "block";
        secureBox.style.display = "block";
        secureBox.placeholder = "Secure Code";
    } else if (group === "mallow") {
        lnameBox.style.display = "block";
        secureBox.style.display = "none";
    } else {
        lnameBox.style.display = "none";
        lnameBox.value = "";
        secureBox.style.display = "none";
    }
}

// Handles the login button click
function handleLogin() {
    const group = document.getElementById("login-group").value;
    const fname = document.getElementById("fname").value.trim();
    const lname = document.getElementById("lname").value.trim();
    const secure = document.getElementById("secure").value;
    const status = document.getElementById("status-select").value;
    const remember = document.getElementById("remember").checked;

    if (fname === "" || (group !== "community" && lname === "")) {
        alert("Please enter a name! Both boxes need words.");
        return;
    }

    const full = (fname + " " + lname).trim();

    if (group === "person") {
        if (registry[fname] && secure === registry[fname].code) {
            saveAuth(full, "person", status, remember);
        } else {
            handleOwnerLogin(full, secure, status, remember);
        }
    } else {
        saveAuth(full, "mallow", status, remember);
    }
}

async function handleOwnerLogin(full, code, status, remember) {
    if (!code) { alert("Please enter a code."); return; }

    // Try login first
    let res = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: full, code, action: "login" })
    });

    if (res.ok) {
        saveAuth(full, "person", status, remember);
        return;
    }

    const data = await res.json();

    // If not found, sign them up with this code
    if (res.status === 404) {
        let reg = await fetch("/api/owner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: full, code, action: "signup" })
        });
        if (reg.ok) {
            saveAuth(full, "person", status, remember);
        } else {
            const err = await reg.json();
            alert(err.error || "Signup failed.");
        }
    } else {
        alert(data.error || "Access Denied.");
    }
}

// --- DASHBOARD UI ---
function renderDashboard(name, mode, status) {
    document.getElementById('main-content').innerHTML = `
        <div class="box ${status === 'worker' ? 'worker-theme' : ''}">
            <div class="news-column">
                <p class="news-header">📰 TOWN NEWS</p>
                <marquee id="news-marquee" direction="up" scrollamount="2" height="60" onmouseover="this.stop();" onmouseout="this.start();">
                    Loading news...
                </marquee>
            </div>

            <h2>Hello, ${name}</h2>
            <p class="badge">${status.toUpperCase()}</p>
            <p>${name.includes("Chea") ? "🏃‍♂️ EXERCISE TIME!" : "Welcome to Town!"}</p>

            ${mode === 'person' ? '<button onclick="manageMallows()">Manage Mallows ⚙️</button>' : ''}

            <button onclick="window.location.href='order.html'">Place Order 🛍️</button>

            <button onclick="logout()" style="background:#bbb; margin-top:20px;">Logout</button>
        </div>`;
    loadNews();
}

// --- NEWS LOADER ---
async function loadNews() {
    const marquee = document.getElementById("news-marquee");
    if (!marquee) return;
    try {
        const text = await fetch("news.txt").then(r => r.text());
        const now = new Date();
        const currentYear = now.getFullYear();
        const lines = text.split("\n").map(l => l.trim()).filter(l => l);
        let items = [];

        for (const line of lines) {
            if (line.startsWith("§")) continue;

            const resolved = line.replace(/\$\{CURRENT_YEAR\}/g, currentYear);

            if (resolved.startsWith("`") && resolved.endsWith("`")) {
                const inner = resolved.slice(1, -1);
                const vMatch = inner.match(/v>([^&]+)/);
                const xMatch = inner.match(/x>([^£]+)/);
                const contentMatch = inner.match(/£>(.+)/s);
                if (!contentMatch) continue;
                const content = contentMatch[1].trim();
                if (vMatch && now < parseNewsDate(vMatch[1])) continue;
                if (xMatch && now > parseNewsDate(xMatch[1])) continue;
                items.push(content);
            } else if (resolved.startsWith("x>")) {
                const parts = resolved.slice(2).split(">");
                if (parts.length >= 2) {
                    const pubDate = parseNewsDate(parts[0]);
                    if (now >= pubDate) items.push(parts.slice(1).join(">"));
                }
            } else {
                items.push(resolved);
            }
        }

        marquee.innerHTML = items.length
            ? items.map(i => `<p style="margin:4px 0;">${i}</p>`).join("")
            : "<p>No news today.</p>";
    } catch (e) {
        if (marquee) marquee.innerHTML = "<p>News unavailable.</p>";
    }
}

function parseNewsDate(str) {
    str = str.trim();
    const [datePart, timePart] = str.split("|");
    const [d, m, y] = datePart.split("/");
    return new Date(`${y}-${m}-${d}T${timePart || "00:00"}:00`);
}

// --- ADMIN FUNCTIONS ---
function manageMallows() {
    let action = prompt("Type 'list' to see registry or 'add' to register a new mallow:");

    if (action === "list") {
        let list = "TOWN REGISTRY:\n";
        for (let owner in registry) {
            list += owner + ": " + registry[owner].mallows.join(", ") + "\n";
        }
        alert(list);
    } else if (action === "add") {
        let owner = prompt("Which list? (Henry, Margaret, or None)");
        let newM = prompt("Enter the new Mallow name:");
        if (registry[owner] && newM) {
            registry[owner].mallows.push(newM);
            alert(newM + " added to " + owner + " list!");
        } else {
            alert("Error: Check the owner name!");
        }
    }
}

// --- DATA SAVING (COOKIES) ---
function saveAuth(user, mode, status, remember) {
    let days = remember ? 7 : 1;
    setCookie("username", user, days);
    setCookie("mode", mode, days);
    setCookie("status", status, days);
    renderDashboard(user, mode, status);
}

function logout() {
    setCookie("username", "", -1);
    setCookie("mode", "", -1);
    setCookie("status", "", -1);
    renderLogin();
}