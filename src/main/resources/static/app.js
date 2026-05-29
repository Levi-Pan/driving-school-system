const state = {
    students: [],
    coaches: [],
    lessons: [],
    exams: [],
    stats: null,
    currentDoc: null,
    currentAccount: null
};

const role = document.body.dataset.role;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", () => {
    if (!role) {
        return;
    }
    setupTabs();
    setupCommonActions();
    bindForms();
    setupMaterialUploads();
    setDefaultDates();
    loadRememberedAccount();
    loadCurrentAccount();
    loadAll();
});

function setupTabs() {
    $$(".tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$(".tab").forEach((item) => item.classList.remove("active"));
            $$(".view").forEach((view) => view.classList.remove("active"));
            tab.classList.add("active");
            $("#" + tab.dataset.view).classList.add("active");
            drawRoleCharts();
        });
    });
}

function setupCommonActions() {
    $("#refreshBtn")?.addEventListener("click", loadAll);
    $("#logoutBtn")?.addEventListener("click", logout);
    $("#closeDoc")?.addEventListener("click", () => $("#docDialog").close());
    $("#printDoc")?.addEventListener("click", () => window.print());
    $("#exportDoc")?.addEventListener("click", exportCurrentDoc);
    $$("[data-export]").forEach((button) => button.addEventListener("click", () => exportData(button.dataset.export)));
    $$("[data-doc]").forEach((button) => {
        button.addEventListener("click", () => showDoc(Number($("#documentStudent").value), button.dataset.doc));
    });
}

function bindForms() {
    $("#applyForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formData(event.target);
        data.name = state.currentAccount?.name || data.name;
        if (!data.idPhotoName || !data.medicalFormName) {
            toast("请先上传身份证照片和体检表图片");
            return;
        }
        data.age = Number(data.age);
        data.licenseEligible = event.target.licenseEligible.checked;
        await api("/api/students/apply", { method: "POST", body: data });
        toast("报名已提交，系统已完成自动初审");
        await loadAll();
    });

    $("#lessonForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formData(event.target);
        data.studentId = Number(data.studentId);
        await api("/api/lessons", { method: "POST", body: data });
        toast("约课成功");
        await loadAll();
    });

    $("#examForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formData(event.target);
        data.studentId = Number(data.studentId);
        await api("/api/exams/apply", { method: "POST", body: data });
        toast("考试报名已提交，等待管理员审核");
        await loadAll();
    });

    $("#progressForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formData(event.target);
        const studentId = data.studentId;
        delete data.studentId;
        data.hours = Number(data.hours);
        await api(`/api/students/${studentId}/progress`, { method: "POST", body: data });
        toast("学时与练车记录已保存");
        await loadAll();
    });

    $("#availabilityForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formData(event.target);
        const freeTimes = data.freeTimes.split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
        await api(`/api/coaches/${data.coachId}/availability`, { method: "POST", body: { freeTimes } });
        toast("教练空闲时间已更新");
        await loadAll();
    });

    $("#studentPick")?.addEventListener("change", renderStudentStatus);
    $("#coachPick")?.addEventListener("change", renderCoachViews);
}

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
        toast("数据加载失败，请确认 MySQL 账号密码正确并已启动后端服务");
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
            return;
        } catch (error) {
            syncCurrentAccountToForms();
            syncApplicationMaterials();
        }
    }

    try {
        state.currentAccount = await api("/api/auth/me");
        rememberAccount(state.currentAccount);
        syncCurrentAccountToForms();
        syncApplicationMaterials();
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

function renderRole() {
    fillStudentSelects();
    fillCoachSelects();
    if (role === "admin") {
        renderAdmin();
    }
    if (role === "student") {
        renderStudent();
    }
    if (role === "coach") {
        renderCoachViews();
    }
}

function renderAdmin() {
    renderMetrics();
    renderStudentTable();
    renderReviewList();
    renderCoachAssignment();
    renderCoachCards();
    renderAdminExamList();
    renderStatusPills();
    drawRoleCharts();
}

function renderStudent() {
    renderStudentStatus();
    renderStudentLessons();
    renderStudentExams();
}

function renderCoachViews() {
    renderCoachStudents();
    renderCoachLessons();
    renderCoachCards();
    fillProgressStudentsForCoach();
}

function renderMetrics() {
    if (!$("#metricGrid") || !state.stats) {
        return;
    }
    const metrics = [
        ["总报名人数", state.stats.totalStudents],
        ["待审核", state.stats.pendingReview],
        ["已绑定教练", state.stats.assignedStudents],
        ["等待发证", state.stats.waitingCertificate]
    ];
    $("#metricGrid").innerHTML = metrics.map(([label, value]) => `
        <article class="metric"><span>${label}</span><strong>${value}</strong></article>
    `).join("");
}

function renderStudentTable() {
    if (!$("#studentTable")) {
        return;
    }
    $("#studentTable").innerHTML = state.students.map((student) => `
        <tr>
            <td><strong>${student.name}</strong><br><span class="muted">${student.phone}</span></td>
            <td>${student.vehicleType}</td>
            <td>${statusTag(student.status)}</td>
            <td>${student.stage}</td>
            <td>${student.hours}</td>
            <td>${student.autoReviewResult}</td>
        </tr>
    `).join("");
}

function renderReviewList() {
    if (!$("#reviewList")) {
        return;
    }
    $("#reviewList").innerHTML = state.students.map((student) => `
        <article class="item">
            <div>
                <h3>${student.name} ${statusTag(student.status)}</h3>
                <p>身份证：${student.idCard} · 车型：${student.vehicleType} · 体检：${student.medicalStatus}</p>
                <p>自动初审：${student.autoReviewResult}</p>
                <p>材料：报名表 ${yesNo(student.registrationFormGenerated)} / 体检表 ${yesNo(student.medicalFormGenerated)} / 准考证 ${yesNo(student.admissionTicketGenerated)}</p>
            </div>
            <div class="actions">
                <button class="primary" onclick="reviewStudent(${student.id}, true)">通过</button>
                <button class="danger" onclick="reviewStudent(${student.id}, false)">不通过</button>
                <button class="ghost" onclick="showDoc(${student.id}, 'registration')">报名表</button>
                <button class="ghost" onclick="showDoc(${student.id}, 'medical')">体检表</button>
                <button class="ghost" onclick="showDoc(${student.id}, 'ticket')">准考证</button>
            </div>
        </article>
    `).join("");
}

function renderCoachAssignment() {
    if (!$("#coachAssignList")) {
        return;
    }
    const waiting = state.students.filter((student) => student.status === "待分配");
    $("#coachAssignList").innerHTML = waiting.length ? waiting.map((student) => `
        <article class="item">
            <div>
                <h3>${student.name} · ${student.vehicleType}</h3>
                <p>点击推荐后，系统会按车型、空闲名额和评分排序。</p>
                <div id="recommend-${student.id}" class="muted">等待生成推荐</div>
            </div>
            <div class="actions">
                <button class="primary" onclick="loadRecommendations(${student.id})">推荐教练</button>
            </div>
        </article>
    `).join("") : `<p class="muted">暂无待分配学员。</p>`;
}

function renderCoachCards() {
    if (!$("#coachList")) {
        return;
    }
    $("#coachList").innerHTML = state.coaches.map((coach) => `
        <article class="coach-card">
            <strong>${coach.name}</strong>
            <span>${coach.vehicleType} · 评分 ${coach.rating}</span>
            <span>带学员 ${coach.workload}/${coach.maxStudents} · 空闲 ${coach.freeSlots}</span>
            <span>${(coach.freeTimes || []).join("、") || "暂未维护空闲时间"}</span>
        </article>
    `).join("");
}

function renderAdminExamList() {
    if (!$("#examList")) {
        return;
    }
    $("#examList").innerHTML = state.exams.length ? state.exams.map((exam) => `
        <article class="item">
            <div>
                <h3>${studentName(exam.studentId)} · ${exam.subject} ${statusTag(exam.status)}</h3>
                <p>考试时间：${formatDateTime(exam.examTime)} · 成绩：${exam.score ?? "未录入"}</p>
                <p>${exam.remark || "等待管理员处理"}</p>
            </div>
            <div class="actions">
                <button class="primary" onclick="approveExam(${exam.id})">审核通过</button>
                <button class="ghost" onclick="scoreExam(${exam.id})">录入成绩</button>
            </div>
        </article>
    `).join("") : `<p class="muted">暂无考试记录。</p>`;
}

function renderStatusPills() {
    if (!$("#statusPills") || !state.stats) {
        return;
    }
    $("#statusPills").innerHTML = Object.entries(state.stats.statusCounts).map(([status, count]) => `
        <div class="status-pill"><strong>${count}</strong><span>${status}</span></div>
    `).join("");
}

function renderStudentStatus() {
    if (!$("#studentStatus")) {
        return;
    }
    const student = selectedStudent("#studentPick");
    if (!student) {
        $("#studentStatus").innerHTML = `<p class="muted">暂无学员报名记录。</p>`;
        return;
    }
    const coach = state.coaches.find((item) => item.id === student.coachId);
    $("#studentStatus").innerHTML = `
        <article class="item single">
            <div>
                <h3>${student.name} ${statusTag(student.status)}</h3>
                <p>报考车型：${student.vehicleType} · 学习阶段：${student.stage} · 已完成学时：${student.hours}</p>
                <p>自动初审：${student.autoReviewResult}</p>
                <p>教练：${coach ? `${coach.name}（${coach.phone}，评分 ${coach.rating}）` : "暂未分配"}</p>
                <p>最近记录：${(student.progressLogs || []).slice(-3).join(" / ") || "暂无练车记录"}</p>
            </div>
        </article>
    `;
}

function renderStudentLessons() {
    if (!$("#lessonList")) {
        return;
    }
    const currentIds = state.students.map((student) => student.id);
    const rows = state.lessons.filter((lesson) => currentIds.includes(lesson.studentId));
    $("#lessonList").innerHTML = rows.length ? rows.map((lesson) => `
        <article class="item">
            <div>
                <h3>${studentName(lesson.studentId)} ${statusTag(lesson.status)}</h3>
                <p>教练：${coachName(lesson.coachId)} · ${lesson.lessonDate} ${lesson.timeRange}</p>
                <p>${lesson.note}</p>
            </div>
            <div class="actions"><button class="ghost" onclick="cancelLesson(${lesson.id})">取消约课</button></div>
        </article>
    `).join("") : `<p class="muted">暂无约课记录。</p>`;
}

function renderStudentExams() {
    if (!$("#studentExamList")) {
        return;
    }
    $("#studentExamList").innerHTML = state.exams.length ? state.exams.map((exam) => `
        <article class="item single">
            <div>
                <h3>${studentName(exam.studentId)} · ${exam.subject} ${statusTag(exam.status)}</h3>
                <p>考试时间：${formatDateTime(exam.examTime)} · 成绩：${exam.score ?? "未录入"}</p>
                <p>${exam.passed == null ? "等待考试或成绩录入" : exam.passed ? "成绩合格，进入下一科目" : "成绩不合格，等待补考安排"}</p>
            </div>
        </article>
    `).join("") : `<p class="muted">暂无考试报名记录。</p>`;
}

function renderCoachStudents() {
    if (!$("#coachStudentList")) {
        return;
    }
    const coach = selectedCoach("#coachPick");
    if (!coach) {
        $("#coachStudentList").innerHTML = `<p class="muted">暂无教练数据。</p>`;
        return;
    }
    const students = state.students.filter((student) => student.coachId === coach.id);
    $("#coachStudentList").innerHTML = students.length ? students.map((student) => `
        <article class="item single">
            <div>
                <h3>${student.name} ${statusTag(student.status)}</h3>
                <p>电话：${student.phone} · 车型：${student.vehicleType} · 阶段：${student.stage} · 学时：${student.hours}</p>
                <p>练车记录：${(student.progressLogs || []).slice(-3).join(" / ") || "暂无记录"}</p>
            </div>
        </article>
    `).join("") : `<p class="muted">当前教练暂无绑定学员。</p>`;
}

function renderCoachLessons() {
    if (!$("#coachLessonList")) {
        return;
    }
    const coach = selectedCoach("#coachPick") || state.coaches[0];
    const rows = coach ? state.lessons.filter((lesson) => lesson.coachId === coach.id) : [];
    $("#coachLessonList").innerHTML = rows.length ? rows.map((lesson) => `
        <article class="item single">
            <div>
                <h3>${studentName(lesson.studentId)} ${statusTag(lesson.status)}</h3>
                <p>${lesson.lessonDate} ${lesson.timeRange} · ${lesson.note}</p>
            </div>
        </article>
    `).join("") : `<p class="muted">暂无约课安排。</p>`;
}

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
    fillProgressStudentsForCoach();
}

function fillProgressStudentsForCoach() {
    const element = $("#progressStudent");
    if (!element) {
        return;
    }
    const coach = selectedCoach("#coachPick");
    const students = role === "coach" && coach ? state.students.filter((student) => student.coachId === coach.id) : state.students;
    const selected = element.value;
    element.innerHTML = students.map((student) => `<option value="${student.id}">${student.name} · ${student.stage}</option>`).join("");
    if (selected) {
        element.value = selected;
    }
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

async function reviewStudent(id, approved) {
    const opinion = approved ? "复审通过，自动生成报名材料" : "管理员复审不通过";
    await api(`/api/students/${id}/review`, { method: "POST", body: { approved, opinion } });
    toast(approved ? "复审通过，材料已生成" : "已标记审核不通过");
    await loadAll();
}

async function loadRecommendations(studentId) {
    const recommendations = await api(`/api/students/${studentId}/coach-recommendations`);
    const box = $(`#recommend-${studentId}`);
    if (!recommendations.length) {
        box.innerHTML = "暂无匹配教练";
        return;
    }
    box.innerHTML = recommendations.map((item) => `
        <div class="recommend-row">
            <span>${item.coach.name} · 推荐分 ${item.score} · ${item.reason}</span>
            <button class="ghost" onclick="assignCoach(${studentId}, ${item.coach.id})">确认分配</button>
        </div>
    `).join("");
}

async function assignCoach(studentId, coachId) {
    await api(`/api/students/${studentId}/assign-coach`, { method: "POST", body: { coachId } });
    toast("教练分配完成，学员与教练已绑定");
    await loadAll();
}

async function cancelLesson(id) {
    await api(`/api/lessons/${id}/cancel`, { method: "POST" });
    toast("约课已取消");
    await loadAll();
}

async function approveExam(id) {
    await api(`/api/exams/${id}/approve`, { method: "POST" });
    toast("考试报名审核通过");
    await loadAll();
}

async function scoreExam(id) {
    const score = Number(prompt("请输入考试成绩"));
    if (Number.isNaN(score)) {
        return;
    }
    await api(`/api/exams/${id}/score`, { method: "POST", body: { score, remark: "管理员录入成绩" } });
    toast("成绩已录入，系统已更新学习阶段");
    await loadAll();
}

async function showDoc(studentId, type) {
    if (!studentId) {
        toast("请先选择学员");
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

async function api(url, options = {}) {
    const response = await fetch(url, {
        method: options.method || "GET",
        headers: options.body ? { "Content-Type": "application/json" } : {},
        body: options.body ? JSON.stringify(options.body) : undefined
    });
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
    const cls = status.includes("不通过") || status.includes("补考") ? "bad" : status.includes("待") ? "warn" : "";
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
