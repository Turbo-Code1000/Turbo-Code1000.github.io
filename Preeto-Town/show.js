// Keyring family sizes (from sizes.txt):
// Adult: S, R  |  Teen: Townes, Kitticorn  |  Child: Hooty, Froggy, Green, Olivette  |  Baby: Chea, Hawk, Benny, Perl, Jameel
const mallowRoles = {
    "S": "dad",
    "R": "mum"
};
const mallowSizes = {
    Adult: ["S", "R"],
    Teen:  ["Townes", "Kitticorn"],
    Child: ["Hooty", "Froggy", "Green", "Olivette"],
    Baby:  ["Chea", "Hawk", "Benny", "Perl", "Jameel"]
};

// Centralized Registry (Separating People and Mallows)
let registry = {
    "Henry": { lname: "Wilcock", code: "8452", mallows: ["S", "Preeto", "Kitticorn", "Tally", "Tie-dye Tally", "Chea", "Hawk", "Townes"] },
    "Margaret": { lname: "Wilcock", code: "8976", mallows: ["Perl", "Green", "Jameel", "Benny", "Froggy", "Holly", "Olivette", "R"] }
};

const CURRENT_YEAR = new Date().getFullYear();

// The "Pythonic" Show Function
function show(data, target, mode = "id", append = false, end = "<br>") {
    const update = (el, content) => {
        if (append) el.innerHTML += content + end;
        else el.innerHTML = content;
    };

    if (mode === "alert") {
        const modal = document.createElement("div");
        modal.className = "box town-alert";
        modal.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000;";
        modal.innerHTML = `<p>${data}</p><button onclick="this.parentElement.remove()" style="background:#ff69b4; color:white; border:none; border-radius:5px; padding:5px 10px; cursor:pointer;">Close</button>`;
        document.body.appendChild(modal);
    } 
    else if (mode === "class") {
        const elements = document.getElementsByClassName(target);
        const isList = Array.isArray(data);
        for (let i = 0; i < elements.length; i++) {
            update(elements[i], isList ? (data[i] || "") : data);
        }
    } 
    else {
        const el = document.getElementById(target);
        if (el) update(el, data);
    }
}

// Universal Mallow/Person Fillers
function mallowFill(tag, id, category = "community") {
    let list = [];
    if (category === "owned") {
        let user = getCookie("username").split(" ")[0];
        if (registry[user]) list = registry[user].mallows;
    } else if (registry[category]) {
        list = registry[category].mallows;
    } else {
        list = Object.values(registry).flatMap(p => p.mallows);
    }

    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = "";
    [...new Set(list)].forEach(m => {
        const el = document.createElement(tag);
        if (tag === 'option') el.value = m;
        el.innerText = m;
        target.appendChild(el);
    });
}

function personFill(tag, id, lname = "any", me = "included") {
    const target = document.getElementById(id);
    if (!target) return;
    const loggedInUser = getCookie("username");
    target.innerHTML = "";

    Object.keys(registry).filter(n => n !== "None").forEach(name => {
        const p = registry[name];
        const full = `${name} ${p.lname}`.trim();
        if ((lname === "any" || p.lname === lname) && (me === "included" || full !== loggedInUser)) {
            const el = document.createElement(tag);
            if (tag === 'option') el.value = name;
            el.innerText = full;
            target.appendChild(el);
        }
    });
}

// Cookie Helpers
function setCookie(n, v, d) {
    let date = new Date();
    date.setTime(date.getTime() + (d * 24 * 60 * 60 * 1000));
    document.cookie = n + "=" + v + "; expires=" + date.toUTCString() + "; path=/";
}

function getCookie(n) {
    let nameEQ = n + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}