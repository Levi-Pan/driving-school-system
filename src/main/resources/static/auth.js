const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", () => {
    $("#loginForm")?.addEventListener("submit", login);
    $("#registerForm")?.addEventListener("submit", register);
});

async function login(event) {
    event.preventDefault();
    const account = await api("/api/auth/login", {
        method: "POST",
        body: Object.fromEntries(new FormData(event.target).entries())
    });
    rememberAccount(account);
    toast("登录成功");
    location.href = roleHome(account.role);
}

async function register(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.target).entries());
    await api("/api/accounts/register", { method: "POST", body });
    const account = await api("/api/auth/login", {
        method: "POST",
        body: { username: body.username, password: body.password }
    });
    rememberAccount(account);
    toast("注册成功");
    location.href = roleHome(account.role);
}

function rememberAccount(account) {
    localStorage.setItem("currentAccount", JSON.stringify({
        username: account.username,
        name: account.name,
        role: account.role
    }));
}

function roleHome(role) {
    if (role === "ADMIN") {
        return "/admin.html";
    }
    if (role === "COACH") {
        return "/coach.html";
    }
    return "/student.html";
}

async function api(url, options = {}) {
    const response = await fetch(url, {
        method: options.method || "GET",
        headers: options.body ? { "Content-Type": "application/json" } : {},
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "请求失败" }));
        toast(error.message || "请求失败");
        throw new Error(error.message || "请求失败");
    }
    return response.json();
}

function toast(message) {
    const box = $("#toast");
    box.textContent = message;
    box.style.display = "block";
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => box.style.display = "none", 2500);
}
