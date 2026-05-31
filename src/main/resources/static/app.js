const state = {
    students: [],
    coaches: [],
    lessons: [],
    exams: [],
    stats: null,
    currentDoc: null,
    currentAccount: null
};

let reviewFilter = "all";
let reviewSearchKeyword = "";
let pendingRejectStudentId = null;
let resultDialogCallback = null;

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
    // 状态筛选事件绑定
    $$("#reviewFilterTabs .tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$("#reviewFilterTabs .tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            reviewFilter = tab.dataset.filter;
            renderReviewList();
        });
    });
    $("#reviewSearch")?.addEventListener("input", (event) => {
        reviewSearchKeyword = event.target.value.trim().toLowerCase();
        renderReviewList();
    });
    // 驳回对话框事件绑定
    $("#closeReject")?.addEventListener("click", () => {
        $("#rejectDialog").close();
        pendingRejectStudentId = null;
    });
    $("#cancelReject")?.addEventListener("click", () => {
        $("#rejectDialog").close();
        pendingRejectStudentId = null;
    });
    $("#confirmReject")?.addEventListener("click", confirmRejectStudent);
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
        const student = currentAccountStudent();
        if (!student) {
            toast("请先完成在线报名");
            return;
        }
        const data = formData(event.target);
        data.studentId = student.id;
        await api("/api/lessons", { method: "POST", body: data });
        toast("约课成功");
        await loadAll();
    });

    $("#examForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const student = currentAccountStudent();
        if (!student) {
            toast("请先完成在线报名");
            return;
        }
        const data = formData(event.target);
        data.studentId = student.id;
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
        ["待初审", state.stats.pendingInitialReview],
        ["待复审", state.stats.pendingReReview],
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

    // 已通过审核的状态列表（这些状态代表审核已通过）
    const approvedStatuses = ["待分配", "学习中", "可报名考试", "考试报名待审", "待考试", "等待发证", "补考安排中"];

    // 筛选学员
    let filtered = state.students;

    // 按状态筛选
    if (reviewFilter !== "all") {
        if (reviewFilter === "审核通过") {
            filtered = filtered.filter((s) => approvedStatuses.includes(s.status));
        } else {
            filtered = filtered.filter((s) => s.status === reviewFilter);
        }
    }

    // 按关键词搜索
    if (reviewSearchKeyword) {
        filtered = filtered.filter((s) =>
            (s.name && s.name.toLowerCase().includes(reviewSearchKeyword)) ||
            (s.phone && s.phone.toLowerCase().includes(reviewSearchKeyword)) ||
            (s.idCard && s.idCard.toLowerCase().includes(reviewSearchKeyword))
        );
    }

    if (!filtered.length) {
        $("#reviewList").innerHTML = `<p class="muted">暂无符合条件的学员记录。</p>`;
        return;
    }

    $("#reviewList").innerHTML = filtered.map((student) => {
        const isPendingReReview = student.status === "待复审";
        const isRejected = student.status === "初审驳回" || student.status === "审核驳回";
        const isApproved = approvedStatuses.includes(student.status);

        // 构建操作按钮 — 所有学员都显示审核按钮
        let actions = "";
        actions += `<div class="actions"><button class="primary" onclick="reviewStudent(${student.id}, true)">通过</button>`;
        actions += `<button class="danger" onclick="reviewStudent(${student.id}, false)">不通过</button></div>`;
        if (isApproved && student.registrationFormGenerated) {
            actions += `<div class="actions" style="margin-top:6px"><button class="ghost" onclick="showDoc(${student.id}, 'registration')">报名表</button>`;
            actions += `<button class="ghost" onclick="showDoc(${student.id}, 'medical')">体检表</button>`;
            actions += `<button class="ghost" onclick="showDoc(${student.id}, 'ticket')">准考证</button></div>`;
        }

        // 材料图片预览（只显示真正上传过的文件，跳过种子数据假文件名）
        let materialImgs = "";
        const hasUploadedIdPhoto = student.idPhotoName && student.idPhotoName.startsWith("/uploads/");
        const hasUploadedMedical = student.medicalFormName && student.medicalFormName.startsWith("/uploads/");
        if (hasUploadedIdPhoto || hasUploadedMedical) {
            materialImgs = `<div class="material-preview">`;
            if (hasUploadedIdPhoto) {
                materialImgs += `<img src="${student.idPhotoName}" alt="身份证照片" title="身份证照片" onclick="window.open('${student.idPhotoName}')">`;
            }
            if (hasUploadedMedical) {
                materialImgs += `<img src="${student.medicalFormName}" alt="体检表" title="体检表" onclick="window.open('${student.medicalFormName}')">`;
            }
            materialImgs += `</div>`;
        }

        // 驳回原因显示
        let rejectReason = "";
        if (isRejected && student.reviewOpinion) {
            rejectReason = `<p class="review-reason">驳回原因：${student.reviewOpinion}</p>`;
        }

        return `
            <article class="item">
                <div>
                    <h3>${student.name} ${statusTag(student.status)}</h3>
                    <p>身份证：${student.idCard} · 手机：${student.phone} · 车型：${student.vehicleType} · 体检：${student.medicalStatus}</p>
                    <p>自动初审：${student.autoReviewResult}</p>
                    ${rejectReason}
                    ${materialImgs}
                </div>
                ${actions ? `<div class="actions-wrap">${actions}</div>` : ""}
            </article>
        `;
    }).join("");
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
    const student = currentAccountStudent();
    if (!student) {
        $("#studentStatus").innerHTML = `<p class="muted">暂无你的报名记录，请先完成在线报名。</p>`;
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
    const student = currentAccountStudent();
    const rows = student ? state.lessons.filter((lesson) => lesson.studentId === student.id) : [];
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
    const student = currentAccountStudent();
    const rows = student ? state.exams.filter((exam) => exam.studentId === student.id) : [];
    $("#studentExamList").innerHTML = rows.length ? rows.map((exam) => `
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

async function reviewStudent(id, approved) {
    // 先检查学员当前状态
    const student = state.students.find((s) => s.id === id);
    if (!student) {
        showResultDialog("操作失败", "未找到该学员信息");
        return;
    }
    if (student.status !== "待复审") {
        showResultDialog("无法操作", "该学员已审核过，当前状态为「" + student.status + "」，不能重复审核。");
        return;
    }
    if (approved) {
        // 通过操作：弹出确认窗口，点确定后执行
        showResultDialog("确认审核通过", "确定要通过学员「" + student.name + "」的报名审核吗？通过后将自动生成报名材料。", async () => {
            // 再次检查状态（防止在弹窗等待期间状态已改变）
            const currentStudent = state.students.find((s) => s.id === id);
            if (!currentStudent || currentStudent.status !== "待复审") {
                showResultDialog("无法操作", "该学员当前状态已变更，不能进行审核操作。");
                return;
            }
            try {
                await api(`/api/students/${id}/review`, { method: "POST", body: { approved: true, opinion: "复审通过" } });
                showResultDialog("操作成功", "学员「" + student.name + "」的报名审核已通过，报名材料已自动生成。");
                await loadAll();
            } catch (error) {
                showResultDialog("操作失败", error.message || "审核操作失败，请重试。");
            }
        });
    } else {
        // 驳回操作：打开驳回原因输入对话框
        pendingRejectStudentId = id;
        $("#rejectReason").value = "";
        $("#rejectDialog").showModal();
    }
}

async function confirmRejectStudent() {
    const reason = $("#rejectReason").value.trim();
    if (!reason) {
        toast("请填写驳回原因");
        return;
    }
    const id = pendingRejectStudentId;
    if (!id) {
        return;
    }
    // 前端状态检查：防止重复提交
    const student = state.students.find((s) => s.id === id);
    if (!student) {
        $("#rejectDialog").close();
        pendingRejectStudentId = null;
        showResultDialog("操作失败", "未找到该学员信息");
        return;
    }
    if (student.status !== "待复审") {
        $("#rejectDialog").close();
        pendingRejectStudentId = null;
        showResultDialog("无法操作", "该学员当前状态为「" + student.status + "」，已不能进行驳回操作。");
        return;
    }
    try {
        await api(`/api/students/${id}/review`, { method: "POST", body: { approved: false, opinion: reason } });
        $("#rejectDialog").close();
        pendingRejectStudentId = null;
        showResultDialog("审核驳回成功", "已驳回学员「" + student.name + "」的报名申请，驳回原因：" + reason);
        await loadAll();
    } catch (error) {
        $("#rejectDialog").close();
        pendingRejectStudentId = null;
        showResultDialog("操作失败", error.message || "审核操作失败，请重试。");
    }
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
