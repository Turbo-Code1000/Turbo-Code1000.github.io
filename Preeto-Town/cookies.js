function saveAuth(user, mode, status, remember) {
  let days = remember ? 7 : 1;
  setCookie("username", user, days);
  setCookie("mode", mode, days);
  setCookie("status", status, days);
  renderDashboard(user, mode, status);
}

function logout() {
  let cookies = ["username", "mode", "status"]
  let i = 0
  while (i < cookies.length) {
    setCookie(cookies[i], "", -1);
    i += 1
  }
  show("Logged out successfully!", "", "alert");
  renderLogin();
}
