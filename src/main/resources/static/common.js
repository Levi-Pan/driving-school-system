// ========== Global State & Helpers ==========

const state = {
    students: [],
    coaches: [],
    lessons: [],
    exams: [],
    stats: null,
    currentDoc: null,
    currentAccount: null
};//用于测试注释

let resultDialogCallback = null;

const role = document.body.dataset.role;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// ========== DOMContentLoaded ==========

document.addEventListener("DOMContentLoaded", () => {
    if (!role) {
        return;
    }
    setupTabs();
    setupCommonActions();
    if (role === "admin") {
        if (typeof setupAdminActions === "function") setupAdminActions();
        if (typeof bindAdminForms === "function") bindAdminForms();
    }
    if (role === "student" && typeof bindStudentForms === "function") bindStudentForms();
    if (role === "coach" && typeof bindCoachForms === "function") bindCoachForms();
    setupMaterialUploads();
    setDefaultDates();
    loadRememberedAccount();
    loadCurrentAccount();
    loadAll();
});

// ========== Tabs ==========

function setupTabs() {
    $$("aside .tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$("aside .tab").forEach((item) => item.classList.remove("active"));
            $$(".view").forEach((view) => view.classList.remove("active"));
            tab.classList.add("active");
            $("#" + tab.dataset.view).classList.add("active");
            drawRoleCharts();
        });
    });
}

// ========== Common Actions (shared only) ==========

function setupCommonActions() {
    $("#refreshBtn")?.addEventListener("click", refreshPageData);
    $("#logoutBtn")?.addEventListener("click", logout);
    $("#closeDoc")?.addEventListener("click", () => $("#docDialog").close());
    $("#printDoc")?.addEventListener("click", () => window.print());
    $("#exportDoc")?.addEventListener("click", exportCurrentDoc);
    $$("[data-export]").forEach((button) => button.addEventListener("click", () => exportData(button.dataset.export)));
    $$("[data-doc]").forEach((button) => {
        button.addEventListener("click", () => {
            const student = currentAccountStudent();
            showDoc(student?.id, button.dataset.doc);
        });
    });
    // 结果提示弹窗事件绑定
    $("#closeResult")?.addEventListener("click", () => {
        $("#resultDialog").close();
        resultDialogCallback = null;
    });
    $("#confirmResult")?.addEventListener("click", async () => {
        const callback = resultDialogCallback;
        resultDialogCallback = null;
        $("#resultDialog").close();
        if (typeof callback === "function") {
            try {
                await callback();
            } catch (e) {
                /* 回调内部已处理错误 */
            }
        }
    });
}

// ========== Refresh ==========

async function refreshPageData() {
    const button = $("#refreshBtn");
    if (button) {
        button.disabled = true;
        button.classList.add("spinning");
    }
    try {
        await loadCurrentAccount();
        await loadAll();
        toast("页面数据已刷新");
    } finally {
        if (button) {
            button.disabled = false;
            button.classList.remove("spinning");
        }
    }
}

// ========== Data Loading ==========

async function loadAll() {
    try {
        const [students, coaches, lessons, exams, stats] = await Promise.all([
            api("/api/students"),
            api("/api/coaches"),
            api("/api/lessons"),
            api("/api/exams"),
            api("/api/stats")
        ]);
        state.students = students;
        state.coaches = coaches;
        state.lessons = lessons;
        state.exams = exams;
        state.stats = stats;
        renderRole();
        syncApplicationMaterials();
    } catch (error) {
        toast(error.message || "数据加载失败，请稍后重试");
    }
}

async function loadCurrentAccount() {
    const username = state.currentAccount?.username;
    if (username) {
        try {
            state.currentAccount = await api(`/api/accounts/by-username/${encodeURIComponent(username)}`);
            rememberAccount(state.currentAccount);
            syncCurrentAccountToForms();
            syncApplicationMaterials();
            refreshCurrentStudentViews();
            return;
        } catch (error) {
            syncCurrentAccountToForms();
            syncApplicationMaterials();
            refreshCurrentStudentViews();
        }
    }

    try {
        state.currentAccount = await api("/api/auth/me");
        rememberAccount(state.currentAccount);
        syncCurrentAccountToForms();
        syncApplicationMaterials();
        refreshCurrentStudentViews();
    } catch (error) {
        toast("当前登录信息获取失败，请重新登录");
    }
}

function loadRememberedAccount() {
    try {
        state.currentAccount = JSON.parse(localStorage.getItem("currentAccount")) || null;
        syncCurrentAccountToForms();
        syncApplicationMaterials();
    } catch (error) {
        state.currentAccount = null;
    }
}

function rememberAccount(account) {
    if (!account) {
        return;
    }
    localStorage.setItem("currentAccount", JSON.stringify({
        username: account.username,
        name: account.name,
        role: account.role
    }));
}

function syncCurrentAccountToForms() {
    const applicationName = $("#applicationName");
    const applicationNameText = $("#applicationNameText");
    if (applicationName && state.currentAccount?.name) {
        applicationName.value = state.currentAccount.name;
        if (applicationNameText) {
            applicationNameText.textContent = state.currentAccount.name;
        }
    } else if (applicationName) {
        applicationName.value = "";
        if (applicationNameText) {
            applicationNameText.textContent = "未获取到注册姓名，请重新登录";
        }
    }
}

function refreshCurrentStudentViews() {
    if (role === "student" && state.students.length) {
        renderStudent();
    }
}

// ========== Material Uploads ==========

function setupMaterialUploads() {
    $$("[data-upload-target]").forEach((input) => {
        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            if (!file) {
                return;
            }
            if (!file.type.startsWith("image/")) {
                toast("请上传图片文件");
                input.value = "";
                return;
            }
            const target = $("#" + input.dataset.uploadTarget);
            try {
                const uploaded = await uploadMaterial(file);
                if (target) {
                    target.value = uploaded.url;
                }
                renderUploadPreview(input.dataset.previewTarget, uploaded.url);
                rememberMaterialDraft(input.dataset.uploadTarget, uploaded.url);
                toast("图片已上传保存");
            } catch (error) {
                toast(error.message || "图片上传失败");
            }
        });
    });
}

async function uploadMaterial(file) {
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/materials/upload", {
        method: "POST",
        body: data
    });
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem("currentAccount");
            throw new Error("登录已过期，请重新登录后再提交。");
        }
        const error = await response.json().catch(() => ({ message: "图片上传失败" }));
        throw new Error(error.message || "图片上传失败");
    }
    return response.json();
}

function renderUploadPreview(previewId, url) {
    const preview = $("#" + previewId);
    if (!preview) {
        return;
    }
    preview.innerHTML = url ? `<img src="${url}" alt="已上传图片">` : "暂无已上传图片";
}

function syncApplicationMaterials() {
    const student = currentAccountStudent();
    const draft = readMaterialDraft();
    const idPhotoUrl = student?.idPhotoName || draft.idPhotoName || "";
    const medicalUrl = student?.medicalFormName || draft.medicalFormName || "";
    setMaterialValue("idPhotoName", "idPhotoPreview", idPhotoUrl);
    setMaterialValue("medicalFormName", "medicalFormPreview", medicalUrl);
}

function setMaterialValue(inputId, previewId, url) {
    const input = $("#" + inputId);
    if (input) {
        input.value = url || "";
    }
    renderUploadPreview(previewId, url);
}

function currentAccountStudent() {
    const name = state.currentAccount?.name;
    if (!name) {
        return null;
    }
    return state.students.find((student) => student.name === name) || null;
}

function materialDraftKey() {
    const username = state.currentAccount?.username || "anonymous";
    return `studentMaterialDraft:${username}`;
}

function readMaterialDraft() {
    try {
        return JSON.parse(localStorage.getItem(materialDraftKey())) || {};
    } catch (error) {
        return {};
    }
}

function rememberMaterialDraft(field, url) {
    const draft = readMaterialDraft();
    draft[field] = url;
    localStorage.setItem(materialDraftKey(), JSON.stringify(draft));
}

// ========== Role Dispatch ==========

function renderRole() {
    fillStudentSelects();
    fillCoachSelects();
    if (role === "admin") {
        if (typeof renderAdmin === "function") renderAdmin();
    }
    if (role === "student") {
        if (typeof renderStudent === "function") renderStudent();
    }
    if (role === "coach") {
        if (typeof renderCoachViews === "function") renderCoachViews();
    }
}

// ========== Fill Selects ==========

function fillStudentSelects() {
    const options = state.students.map((student) => `<option value="${student.id}">${student.name} · ${student.status}</option>`).join("");
    ["#studentPick", "#lessonStudent", "#examStudent", "#documentStudent"].forEach((selector) => {
        const element = $(selector);
        if (element) {
            const selected = element.value;
            element.innerHTML = options;
            if (selected) {
                element.value = selected;
            }
        }
    });
    if (typeof fillProgressStudentsForCoach === "function") fillProgressStudentsForCoach();
}

function fillCoachSelects() {
    const options = state.coaches.map((coach) => `<option value="${coach.id}">${coach.name} · ${coach.vehicleType}</option>`).join("");
    ["#coachPick", "#availabilityCoach"].forEach((selector) => {
        const element = $(selector);
        if (element) {
            const selected = element.value;
            element.innerHTML = options;
            if (selected) {
                element.value = selected;
            }
        }
    });
}

// ========== Result Dialog ==========

function showResultDialog(title, message, callback) {
    const dialog = $("#resultDialog");
    if (!dialog) {
        alert(title + "\n" + message);
        return;
    }
    $("#resultTitle").textContent = title;
    $("#resultMessage").textContent = message;
    resultDialogCallback = (typeof callback === "function") ? callback : null;
    dialog.showModal();
}

// ========== Utility Functions ==========

async function api(url, options = {}) {
    const response = await fetch(url, {
        method: options.method || "GET",
        headers: options.body ? { "Content-Type": "application/json" } : {},
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!response.ok && response.status === 401) {
        localStorage.removeItem("currentAccount");
        throw new Error("HTTP 401：登录已过期或未登录，请重新登录后再提交。");
    }
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "请求失败" }));
        throw new Error(error.message || "请求失败");
    }
    return response.json();
}

async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("currentAccount");
    location.href = "/login.html";
}

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function selectedStudent(selector) {
    const id = Number($(selector)?.value);
    return state.students.find((student) => student.id === id) || state.students[0];
}

function selectedCoach(selector) {
    const id = Number($(selector)?.value);
    return state.coaches.find((coach) => coach.id === id) || state.coaches[0];
}

function statusTag(status) {
    const cls = status.includes("驳回") || status.includes("不通过") || status.includes("补考") ? "bad" : status.includes("待") ? "warn" : "";
    return `<span class="tag ${cls}">${status}</span>`;
}

function yesNo(value) {
    return value ? "已生成" : "未生成";
}

function studentName(id) {
    return state.students.find((student) => student.id === id)?.name || `学员${id}`;
}

function coachName(id) {
    return state.coaches.find((coach) => coach.id === id)?.name || `教练${id}`;
}

function formatDateTime(value) {
    return value ? value.replace("T", " ") : "";
}

function toast(message) {
    const box = $("#toast");
    if (!box) {
        return;
    }
    box.textContent = message;
    box.style.display = "block";
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => box.style.display = "none", 2800);
}

function exportData(key) {
    const data = state.stats?.[key] || [];
    download(`${key}.json`, JSON.stringify(data, null, 2), "application/json");
}

function exportCurrentDoc() {
    if (!state.currentDoc) {
        return;
    }
    download(`${state.currentDoc.documentNo}.html`, $("#docPreview").innerHTML, "text/html");
}

function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

async function showDoc(studentId, type) {
    if (!studentId) {
        toast("请先完成在线报名");
        return;
    }
    const doc = await api(`/api/students/${studentId}/documents/${type}`);
    state.currentDoc = doc;
    $("#docTitle").textContent = doc.title;
    $("#docPreview").innerHTML = `
        <section class="doc-sheet">
            <h2>${doc.title}</h2>
            <div class="doc-row"><strong>材料编号</strong><span>${doc.documentNo}</span></div>
            <div class="doc-row"><strong>姓名</strong><span>${doc.studentName}</span></div>
            <div class="doc-row"><strong>身份证</strong><span>${doc.idCard}</span></div>
            <div class="doc-row"><strong>报考车型</strong><span>${doc.vehicleType}</span></div>
            <div class="doc-row"><strong>业务状态</strong><span>${doc.status}</span></div>
            <div class="doc-row"><strong>生成时间</strong><span>${doc.generatedAt}</span></div>
            <p class="muted doc-note">本页支持浏览器打印，并可在打印对话框中另存为 PDF。</p>
        </section>
    `;
    $("#docDialog").showModal();
}

function setDefaultDates() {
    const lessonDateInput = $("#lessonForm [name=lessonDate]");
    const examTimeInput = $("#examForm [name=examTime]");
    if (lessonDateInput) {
        lessonDateInput.value = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    }
    if (examTimeInput) {
        examTimeInput.value = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);
    }
}

function drawRoleCharts() {
    if (!state.stats) {
        return;
    }
    if ($("#registrationChart")) {
        drawBarChart($("#registrationChart"), state.stats.registrationsByMonth, "#0f766e", "人");
    }
    if ($("#passRateChart")) {
        drawBarChart($("#passRateChart"), state.stats.subjectPassRates, "#b7791f", "%");
    }
    if ($("#coachChart")) {
        const workload = {};
        state.stats.coachWorkloads.forEach((item) => workload[item.name] = item.students);
        drawBarChart($("#coachChart"), workload, "#2563eb", "人");
    }
}

function drawBarChart(canvas, data, color, unit) {
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(rect.width, 320) * dpr;
    canvas.height = Number(canvas.getAttribute("height")) * dpr;
    ctx.scale(dpr, dpr);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    ctx.clearRect(0, 0, width, height);
    const entries = Object.entries(data || {});
    const max = Math.max(1, ...entries.map(([, value]) => Number(value)));
    const gap = 18;
    const barWidth = Math.max(28, (width - gap * (entries.length + 1)) / Math.max(entries.length, 1));
    ctx.font = "12px Microsoft YaHei";
    if (!entries.length) {
        ctx.fillStyle = "#687385";
        ctx.fillText("暂无数据", 16, 36);
        return;
    }
    entries.forEach(([label, value], index) => {
        const x = gap + index * (barWidth + gap);
        const barHeight = (Number(value) / max) * (height - 58);
        const y = height - 34 - barHeight;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = "#17202a";
        ctx.fillText(`${value}${unit}`, x, Math.max(14, y - 8));
        ctx.fillStyle = "#687385";
        ctx.fillText(label, x, height - 12);
    });
}
