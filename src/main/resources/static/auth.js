const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", () => {
    $("#loginForm")?.addEventListener("submit", login);
    $("#registerForm")?.addEventListener("submit", register);
    // 注册页：根据角色切换"手机号"和"账号"输入框
    $("#role")?.addEventListener("change", updateRegisterFields);
    updateRegisterFields();
});

// 账号输入框始终显示；手机号仅学员/教练需要（管理员隐藏）
function updateRegisterFields() {
    const role = $("#role")?.value;
    const isStaff = role === "ADMIN";
    const phoneLabel = $("#phoneLabel");
    const phoneInput = $("#phone");
    if (phoneLabel) phoneLabel.style.display = isStaff ? "none" : "block";
    if (phoneInput) {
        phoneInput.style.display = isStaff ? "none" : "block";
        if (isStaff) phoneInput.value = "";
    }
}

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
    if (!body.username || !body.username.trim()) {
        toast("请输入账号");
        return;
    }
    if (body.password.length < 6) {
        toast("密码至少6位");
        return;
    }
    // 学员/教练必须填写正确的手机号；管理员不需要
    if (body.role !== "ADMIN") {
        if (!/^\d{11}$/.test(body.phone || "")) {
            toast("请输入有效的11位手机号");
            return;
        }
    } else {
        body.phone = ""; // 管理员不传手机号
    }
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
