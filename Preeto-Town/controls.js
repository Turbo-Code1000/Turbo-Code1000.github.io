function setDowntime(reason, minutes) {
    show(`${reason.toUpperCase()} started for ${minutes} mins!`, "", "alert");
    setCookie("downtimeReason", reason, 1);
    setCookie("downtimeActive", "true", 1);
}

function handleLend() {
    const mallow = document.getElementById("mallow-select").value;
    const target = document.getElementById("person-select").value;
    show(`${mallow} lended to ${target}!`, "", "alert");
}

function manageMallows() {
    const owner = getCookie("username").split(" ")[0];
    const action = prompt("Type 'list' to see your mallows or 'add' to register a new mallow:");

    if (action === "list") {
        let list = "YOUR MALLOWS:\n";
        if (registry[owner]) {
            list += registry[owner].mallows.join(", ");
        } else {
            list += "None found.";
        }
        alert(list);
    } else if (action === "add") {
        const newM = prompt("Enter the new Mallow name:");
        if (registry[owner] && newM) {
            registry[owner].mallows.push(newM);
            mallowFill("option", "mallow-select", "owned");
            show(newM + " added to your list!", "", "alert");
        } else {
            show("Error: Check the mallow name.", "", "alert");
        }
    }
}
