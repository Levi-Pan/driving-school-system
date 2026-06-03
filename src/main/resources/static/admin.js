// ========== Admin Variables ==========

let reviewFilter = "all";
let reviewSearchKeyword = "";
let pendingRejectStudentId = null;

let coachFormMode = "create";
let coachFormEditId = null;

// ========== Admin-Specific Bindings ==========

function setupAdminActions() {
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
    // 教练表单对话框事件绑定
    $("#addCoachBtn")?.addEventListener("click", () => openCoachFormDialog("create"));
    $("#closeCoachForm")?.addEventListener("click", () => $("#coachFormDialog").close());
    $("#cancelCoachForm")?.addEventListener("click", () => $("#coachFormDialog").close());
    $("#submitCoachForm")?.addEventListener("click", submitCoachForm);
}

function bindAdminForms() {
    // placeholder for admin-specific form bindings
}

// ========== Admin Render ==========

function renderAdmin() {
    renderMetrics();
    renderStudentTable();
    renderReviewList();
    renderCoachManage();
    renderCoachAssignment();
    renderCoachCards();
    renderAdminExamList();
    renderStatusPills();
    drawRoleCharts();
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

// ========== Admin Actions ==========

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

// ========== Coach Manage ==========

function coachStatusTag(status) {
    const cls = status === "在岗" ? "active" : status === "暂停接单" ? "paused" : "left";
    return `<span class="coach-status ${cls}">${status}</span>`;
}

function renderCoachManage() {
    if (!$("#coachManageList")) {
        return;
    }
    if (!state.coaches.length) {
        $("#coachManageList").innerHTML = `<p class="muted">暂无教练数据。</p>`;
        return;
    }
    $("#coachManageList").innerHTML = state.coaches.map((coach) => {
        const statusOptions = ["在岗", "暂停接单", "离职"]
            .filter((s) => s !== coach.status)
            .map((s) => `<option value="${s}">${s}</option>`)
            .join("");
        return `
        <article class="coach-manage-card">
            <div class="coach-header">
                <div class="coach-info">
                    <strong>${coach.name} ${coachStatusTag(coach.status || "在岗")}</strong>
                    <span>${coach.vehicleType || "C1"} · 评分 ${coach.rating} · 从业 ${coach.yearsOfExperience || 0} 年 · 可带 ${coach.maxStudents} 人</span>
                    <span>电话：${coach.phone || "未设置"} · 当前带教 ${coach.workload} 人 · 空闲 ${coach.freeSlots} 名额</span>
                    <span>${coach.bio || "暂无简介"}</span>
                </div>
            </div>
            <div class="coach-actions">
                <button class="ghost" onclick="openCoachFormDialog('edit', ${coach.id})">编辑</button>
                <select class="ghost" onchange="toggleCoachStatus(${coach.id}, this.value)" style="min-width:90px">
                    <option value="" disabled selected>切换状态</option>
                    ${statusOptions}
                </select>
                <button class="danger" onclick="deleteCoach(${coach.id})">删除</button>
            </div>
        </article>`;
    }).join("");
}

function openCoachFormDialog(mode, coachId) {
    coachFormMode = mode;
    coachFormEditId = coachId || null;
    if (mode === "edit") {
        const coach = state.coaches.find((c) => c.id === coachId);
        if (!coach) {
            return;
        }
        $("#coachFormTitle").textContent = "编辑教练";
        $("#coachName").value = coach.name || "";
        $("#coachPhone").value = coach.phone || "";
        $("#coachVehicleType").value = coach.vehicleType || "C1";
        $("#coachMaxStudents").value = coach.maxStudents || 5;
        $("#coachGender").value = coach.gender || "";
        $("#coachYears").value = coach.yearsOfExperience || 0;
        $("#coachBio").value = coach.bio || "";
    } else {
        $("#coachFormTitle").textContent = "新增教练";
        $("#coachName").value = "";
        $("#coachPhone").value = "";
        $("#coachVehicleType").value = "C1";
        $("#coachMaxStudents").value = 5;
        $("#coachGender").value = "";
        $("#coachYears").value = 0;
        $("#coachBio").value = "";
    }
    $("#coachFormDialog").showModal();
}

async function submitCoachForm() {
    const name = $("#coachName").value.trim();
    if (!name) {
        toast("教练姓名不能为空");
        return;
    }
    const data = {
        name,
        phone: $("#coachPhone").value.trim(),
        vehicleType: $("#coachVehicleType").value.trim() || "C1",
        maxStudents: Number($("#coachMaxStudents").value) || 5,
        gender: $("#coachGender").value,
        yearsOfExperience: Number($("#coachYears").value) || 0,
        bio: $("#coachBio").value.trim()
    };
    try {
        if (coachFormMode === "create") {
            await api("/api/coaches", { method: "POST", body: data });
            showResultDialog("新增成功", "教练「" + name + "」已成功添加。");
        } else {
            await api(`/api/coaches/${coachFormEditId}`, { method: "PUT", body: data });
            showResultDialog("编辑成功", "教练「" + name + "」的信息已更新。");
        }
        $("#coachFormDialog").close();
        await loadAll();
    } catch (error) {
        showResultDialog("操作失败", error.message || "保存教练信息失败。");
    }
}

async function deleteCoach(id) {
    const coach = state.coaches.find((c) => c.id === id);
    if (!coach) {
        return;
    }
    const hasStudents = coach.workload > 0;
    const msg = hasStudents
        ? "确定要删除教练「" + coach.name + "」吗？该教练当前有 " + coach.workload + " 名绑定学员，删除后学员将回到待分配状态。"
        : "确定要删除教练「" + coach.name + "」吗？此操作不可撤销。";
    showResultDialog("确认删除", msg, async () => {
        try {
            await api(`/api/coaches/${id}`, { method: "DELETE" });
            showResultDialog("删除成功", "教练「" + coach.name + "」已被删除。");
            await loadAll();
        } catch (error) {
            showResultDialog("删除失败", error.message || "删除教练失败。");
        }
    });
}

async function toggleCoachStatus(id, newStatus) {
    if (!newStatus) {
        return;
    }
    const coach = state.coaches.find((c) => c.id === id);
    if (!coach) {
        return;
    }
    try {
        await api(`/api/coaches/${id}/status`, { method: "PUT", body: { status: newStatus } });
        showResultDialog("状态已更新", "教练「" + coach.name + "」的状态已变更为「" + newStatus + "」。");
        await loadAll();
    } catch (error) {
        showResultDialog("操作失败", error.message || "更新教练状态失败。");
    }
}

// ========== Admin Init Hook ==========

// Call setupAdminActions after DOM is ready (deferred via immediate invocation)
(function initAdmin() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupAdminActions);
    } else {
        setupAdminActions();
    }
})();
