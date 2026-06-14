// ========== Admin Variables ==========

let reviewFilter = "all";
let reviewSearchKeyword = "";
let pendingRejectStudentId = null;

let coachFormMode = "create";
let coachFormEditId = null;

let assignFilter = "pending";
let reassignStudentId = null;

let examSubjectFilter = "";
let examStatusFilter = "";
let pendingRejectExamId = null;
let pendingScoreExamId = null;

let studentSearchKeyword = "";
let studentStatusFilterVal = "";
let studentVehicleFilterVal = "";

let vehicleTypeFormMode = "create";
let vehicleTypeFormEditId = null;
let examVenueFormMode = "create";
let examVenueFormEditId = null;

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
    $("#reviewSearch")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            reviewSearchKeyword = event.target.value.trim().toLowerCase();
            renderReviewList();
        }
    });
    $("#reviewSearchBtn")?.addEventListener("click", () => {
        reviewSearchKeyword = ($("#reviewSearch")?.value || "").trim().toLowerCase();
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
    // 教练分配 tab 切换
    $$("#assignFilterTabs .tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$("#assignFilterTabs .tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            assignFilter = tab.dataset.filter;
            toggleAssignView();
        });
    });
    // 换教练弹窗事件绑定
    $("#closeReassign")?.addEventListener("click", () => $("#reassignDialog").close());
    $("#cancelReassign")?.addEventListener("click", () => $("#reassignDialog").close());
    // 考试筛选 tab
    $$("#examFilterTabs .tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$("#examFilterTabs .tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            examSubjectFilter = tab.dataset.subject || "";
            renderAdminExamList();
        });
    });
    $$("#examStatusTabs .tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$("#examStatusTabs .tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            examStatusFilter = tab.dataset.status || "";
            renderAdminExamList();
        });
    });
    // 考试驳回弹窗
    $("#closeExamReject")?.addEventListener("click", () => { $("#examRejectDialog").close(); pendingRejectExamId = null; });
    $("#cancelExamReject")?.addEventListener("click", () => { $("#examRejectDialog").close(); pendingRejectExamId = null; });
    $("#confirmExamReject")?.addEventListener("click", confirmExamReject);
    // 成绩录入弹窗
    $("#closeScore")?.addEventListener("click", () => { $("#scoreDialog").close(); pendingScoreExamId = null; });
    $("#cancelScore")?.addEventListener("click", () => { $("#scoreDialog").close(); pendingScoreExamId = null; });
    $("#confirmScore")?.addEventListener("click", confirmScore);
    // 发证弹窗
    $("#closeCertificate")?.addEventListener("click", () => $("#certificateDialog").close());
    $("#cancelCertificate")?.addEventListener("click", () => $("#certificateDialog").close());
    // 学员管理搜索筛选
    $("#studentSearchInput")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            studentSearchKeyword = e.target.value.trim().toLowerCase();
            renderStudentManage();
        }
    });
    $("#studentSearchBtn")?.addEventListener("click", () => {
        studentSearchKeyword = ($("#studentSearchInput")?.value || "").trim().toLowerCase();
        renderStudentManage();
    });
    $("#studentStatusFilter")?.addEventListener("change", (e) => {
        studentStatusFilterVal = e.target.value;
        renderStudentManage();
    });
    $("#studentVehicleFilter")?.addEventListener("change", (e) => {
        studentVehicleFilterVal = e.target.value;
        renderStudentManage();
    });
    // 学员详情弹窗
    $("#closeStudentDetail")?.addEventListener("click", () => $("#studentDetailDialog").close());
    $("#closeStudentDetailBtn")?.addEventListener("click", () => $("#studentDetailDialog").close());
    // 车型表单弹窗
    $("#addVehicleTypeBtn")?.addEventListener("click", () => openVehicleTypeForm("create"));
    $("#closeVehicleTypeForm")?.addEventListener("click", () => $("#vehicleTypeFormDialog").close());
    $("#cancelVehicleTypeForm")?.addEventListener("click", () => $("#vehicleTypeFormDialog").close());
    $("#submitVehicleTypeForm")?.addEventListener("click", submitVehicleTypeForm);
    // 考场表单弹窗
    $("#addExamVenueBtn")?.addEventListener("click", () => openExamVenueForm("create"));
    $("#closeExamVenueForm")?.addEventListener("click", () => $("#examVenueFormDialog").close());
    $("#cancelExamVenueForm")?.addEventListener("click", () => $("#examVenueFormDialog").close());
    $("#submitExamVenueForm")?.addEventListener("click", submitExamVenueForm);
}

function bindAdminForms() {
    // placeholder for admin-specific form bindings
}

// ========== Admin Render ==========

function renderAdmin() {
    renderMetrics();
    renderStudentTable();
    renderReviewList();
    renderStudentManage();
    renderCoachManage();
    renderCoachAssignment();
    renderAssignedList();
    renderCoachCards();
    renderAdminExamList();
    renderVehicleTypes();
    renderExamVenues();
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
            <td>
                <span title="科目一">①${student.subjectOneHours || 0}</span> /
                <span title="科目二">②${student.subjectTwoHours || 0}</span> /
                <span title="科目三">③${student.subjectThreeHours || 0}</span> /
                <span title="科目四">④${student.subjectFourHours || 0}</span>
            </td>
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
    if (!waiting.length) {
        $("#coachAssignList").innerHTML = `<p class="muted">暂无待分配学员。</p>`;
        return;
    }
    // 教练下拉选项（在岗 + 有空闲名额）
    const coachOptions = state.coaches
        .map((c) => `<option value="${c.id}">${c.name} · ${c.vehicleType || "未知"} · 空闲${c.freeSlots}${c.status && c.status !== "在岗" ? "（" + c.status + "）" : ""}</option>`)
        .join("");
    $("#coachAssignList").innerHTML = waiting.map((student) => `
        <article class="item">
            <div>
                <h3>${student.name} · ${student.vehicleType}</h3>
                <p>点击「推荐教练」查看系统推荐，或从下拉框手动指定。</p>
                <div id="recommend-${student.id}" class="muted">等待生成推荐</div>
            </div>
            <div class="actions" style="flex-direction:column;gap:6px">
                <button class="primary" onclick="loadRecommendations(${student.id})">推荐教练</button>
                <div style="display:flex;gap:6px;align-items:center">
                    <select id="manualCoach-${student.id}" style="min-width:140px;font-size:.9em">
                        <option value="">选择教练…</option>
                        ${coachOptions}
                    </select>
                    <button class="ghost" onclick="manualAssignCoach(${student.id})">指定</button>
                </div>
            </div>
        </article>
    `).join("");
}

async function manualAssignCoach(studentId) {
    const select = $(`#manualCoach-${studentId}`);
    if (!select || !select.value) {
        toast("请先选择一位教练");
        return;
    }
    const coachId = Number(select.value);
    const coach = state.coaches.find((c) => c.id === coachId);
    const student = state.students.find((s) => s.id === studentId);
    showResultDialog("确认指定", `确定将教练「${coach?.name || ""}」指定给学员「${student?.name || ""}」吗？`, async () => {
        try {
            await api(`/api/students/${studentId}/assign-coach`, { method: "POST", body: { coachId } });
            showResultDialog("分配成功", `学员「${student?.name}」已绑定教练「${coach?.name}」。`);
            await loadAll();
        } catch (error) {
            showResultDialog("分配失败", error.message || "手动指定教练失败。");
        }
    });
}

function toggleAssignView() {
    const pending = $("#coachAssignList");
    const assigned = $("#assignedList");
    if (!pending || !assigned) return;
    if (assignFilter === "pending") {
        pending.style.display = "";
        assigned.style.display = "none";
    } else {
        pending.style.display = "none";
        assigned.style.display = "";
    }
}

function renderAssignedList() {
    if (!$("#assignedList")) {
        return;
    }
    const assigned = state.students.filter((s) => s.coachId != null && s.status !== "待分配");
    if (!assigned.length) {
        $("#assignedList").innerHTML = `<p class="muted">暂无已分配教练的学员。</p>`;
        return;
    }
    $("#assignedList").innerHTML = assigned.map((student) => {
        const coach = state.coaches.find((c) => c.id === student.coachId);
        const coachName = coach ? coach.name : "未知教练";
        const logs = (student.coachChangeLogs || []).slice().reverse();
        const logHtml = logs.length
            ? `<details class="change-log-details"><summary>换教练记录（${logs.length}条）</summary><ul>${logs.map(l => `<li>${l}</li>`).join("")}</ul></details>`
            : "";
        return `
        <article class="item">
            <div>
                <h3>${student.name} · ${student.vehicleType} ${statusTag(student.status)}</h3>
                <p>当前教练：<strong>${coachName}</strong> · 阶段：${student.stage} · 学时：①${student.subjectOneHours || 0} / ②${student.subjectTwoHours || 0} / ③${student.subjectThreeHours || 0} / ④${student.subjectFourHours || 0}</p>
                ${logHtml}
            </div>
            <div class="actions">
                <button class="ghost" onclick="openReassignDialog(${student.id})">换教练</button>
                <button class="danger" onclick="unbindCoach(${student.id})">解绑</button>
            </div>
        </article>`;
    }).join("");
}

async function unbindCoach(studentId) {
    const student = state.students.find((s) => s.id === studentId);
    if (!student) return;
    const coach = state.coaches.find((c) => c.id === student.coachId);
    const coachName = coach ? coach.name : "未知教练";
    showResultDialog("确认解绑", `确定要解绑学员「${student.name}」与教练「${coachName}」的绑定关系吗？解绑后学员将回到待分配状态。`, async () => {
        try {
            await api(`/api/students/${studentId}/unbind-coach`, { method: "POST" });
            showResultDialog("解绑成功", `学员「${student.name}」已与教练「${coachName}」解绑，学员状态已变更为待分配。`);
            await loadAll();
        } catch (error) {
            showResultDialog("操作失败", error.message || "解绑教练失败。");
        }
    });
}

async function openReassignDialog(studentId) {
    const student = state.students.find((s) => s.id === studentId);
    if (!student) return;
    reassignStudentId = studentId;
    const oldCoach = state.coaches.find((c) => c.id === student.coachId);
    const oldCoachName = oldCoach ? oldCoach.name : "未知教练";
    $("#reassignTitle").textContent = "换教练 — " + student.name;
    $("#reassignInfo").textContent = `当前教练：${oldCoachName} · 报考车型：${student.vehicleType}`;
    $("#reassignRecommendations").innerHTML = `<p class="muted">正在加载推荐教练…</p>`;
    $("#reassignDialog").showModal();
    try {
        const recommendations = await api(`/api/students/${studentId}/coach-recommendations`);
        if (!recommendations.length) {
            $("#reassignRecommendations").innerHTML = `<p class="muted">暂无匹配教练（需车型一致、在岗、有空闲名额）。</p>`;
            return;
        }
        $("#reassignRecommendations").innerHTML = recommendations.map((item) => `
            <div class="recommend-row">
                <span>${item.coach.name} · 推荐分 ${item.score} · ${item.reason}</span>
                <button class="primary" onclick="confirmReassign(${item.coach.id})">确认换绑</button>
            </div>
        `).join("");
    } catch (error) {
        $("#reassignRecommendations").innerHTML = `<p class="muted">加载失败：${error.message}</p>`;
    }
}

async function confirmReassign(newCoachId) {
    if (!reassignStudentId) return;
    const student = state.students.find((s) => s.id === reassignStudentId);
    const studentName = student ? student.name : "";
    try {
        await api(`/api/students/${reassignStudentId}/assign-coach`, { method: "POST", body: { coachId: newCoachId } });
        $("#reassignDialog").close();
        showResultDialog("换教练成功", `学员「${studentName}」的教练已更换，换绑记录已保存。`);
        reassignStudentId = null;
        await loadAll();
    } catch (error) {
        showResultDialog("操作失败", error.message || "换教练失败。");
    }
}

// ========== Student Manage (学员管理) ==========

const REQUIRED_HOURS = { "科目一": 12, "科目二": 12, "科目三": 34, "科目四": 10 };

function renderStudentManage() {
    if (!$("#studentManageList")) return;
    // 只显示审核通过的学员（排除待初审、待复审、初审驳回、审核驳回）
    const approvedStatuses = ["待分配", "学习中", "可报名考试", "考试报名待审", "待考试", "补考安排中", "等待发证", "已发证"];
    let filtered = state.students.filter((s) => approvedStatuses.includes(s.status));
    if (studentSearchKeyword) {
        filtered = filtered.filter((s) =>
            (s.name && s.name.toLowerCase().includes(studentSearchKeyword)) ||
            (s.phone && s.phone.toLowerCase().includes(studentSearchKeyword)) ||
            (s.idCard && s.idCard.toLowerCase().includes(studentSearchKeyword))
        );
    }
    if (studentStatusFilterVal) {
        filtered = filtered.filter((s) => s.status === studentStatusFilterVal);
    }
    if (studentVehicleFilterVal) {
        filtered = filtered.filter((s) => s.vehicleType === studentVehicleFilterVal);
    }
    const countEl = $("#studentManageCount");
    if (countEl) countEl.textContent = `共 ${filtered.length} 名学员`;
    if (!filtered.length) {
        $("#studentManageList").innerHTML = `<p class="muted">暂无符合条件的学员。</p>`;
        return;
    }
    $("#studentManageList").innerHTML = filtered.map((student) => {
        const coach = state.coaches.find((c) => c.id === student.coachId);
        const coachName = coach ? coach.name : "未分配";
        return `
        <article class="item" style="cursor:pointer" onclick="showStudentDetail(${student.id})">
            <div>
                <h3>${student.name} ${statusTag(student.status)}</h3>
                <p>身份证：${student.idCard} · 手机：${student.phone} · 车型：${student.vehicleType} · 教练：${coachName}</p>
                <p>阶段：${student.stage} · 学时：①${student.subjectOneHours || 0}/12 ②${student.subjectTwoHours || 0}/12 ③${student.subjectThreeHours || 0}/34 ④${student.subjectFourHours || 0}/10</p>
            </div>
            <div class="actions"><button class="ghost">查看详情</button></div>
        </article>`;
    }).join("");
}

function showStudentDetail(studentId) {
    const student = state.students.find((s) => s.id === studentId);
    if (!student) return;
    const coach = state.coaches.find((c) => c.id === student.coachId);
    const exams = state.exams.filter((e) => e.studentId === studentId);
    const coachName = coach ? coach.name : "未分配";
    const changeLogs = (student.coachChangeLogs || []).slice().reverse();

    $("#studentDetailTitle").textContent = "学员详情 — " + student.name;
    $("#studentDetailBody").innerHTML = `
        <section class="detail-section">
            <h4>📋 基本信息</h4>
            <div class="detail-grid">
                <div><span class="muted">姓名</span><strong>${student.name}</strong></div>
                <div><span class="muted">身份证</span>${student.idCard}</div>
                <div><span class="muted">手机号</span>${student.phone}</div>
                <div><span class="muted">年龄</span>${student.age}岁</div>
                <div><span class="muted">地址</span>${student.address || "未填写"}</div>
                <div><span class="muted">报考车型</span>${student.vehicleType}</div>
                <div><span class="muted">状态</span>${statusTag(student.status)}</div>
                <div><span class="muted">发证状态</span>${student.certificateStatus || "未发证"}</div>
            </div>
        </section>
        <section class="detail-section">
            <h4>📝 审核信息</h4>
            <div class="detail-grid">
                <div><span class="muted">自动初审</span>${student.autoReviewResult}</div>
                <div><span class="muted">审核意见</span>${student.reviewOpinion || "无"}</div>
                <div><span class="muted">报名时间</span>${formatDateTime(student.createdAt)}</div>
            </div>
        </section>
        <section class="detail-section">
            <h4>👤 教练绑定</h4>
            <div class="detail-grid">
                <div><span class="muted">当前教练</span><strong>${coachName}</strong>${coach ? " · " + coach.phone : ""}</div>
            </div>
            ${changeLogs.length ? `<details class="change-log-details"><summary>换教练记录（${changeLogs.length}条）</summary><ul>${changeLogs.map(l => `<li>${l}</li>`).join("")}</ul></details>` : ""}
        </section>
        <section class="detail-section">
            <h4>📚 学习进度</h4>
            <div class="detail-grid">
                <div><span class="muted">当前阶段</span><strong>${student.stage}</strong></div>
            </div>
            <div class="progress-bars">
                ${buildProgressBar("科目一", student.subjectOneHours || 0, REQUIRED_HOURS["科目一"])}
                ${buildProgressBar("科目二", student.subjectTwoHours || 0, REQUIRED_HOURS["科目二"])}
                ${buildProgressBar("科目三", student.subjectThreeHours || 0, REQUIRED_HOURS["科目三"])}
                ${buildProgressBar("科目四", student.subjectFourHours || 0, REQUIRED_HOURS["科目四"])}
            </div>
        </section>
        <section class="detail-section">
            <h4>📄 考试记录</h4>
            ${exams.length ? `<table style="width:100%;font-size:.9em"><thead><tr><th>科目</th><th>状态</th><th>成绩</th><th>考场</th><th>时间</th><th>备注</th></tr></thead><tbody>
                ${exams.map(e => `<tr><td>${e.subject} ${e.makeup ? '<span class="tag warn">补考</span>' : ''}</td><td>${statusTag(e.status)}</td><td>${e.score != null ? e.score : "-"}</td><td>${e.venue || "-"}</td><td>${formatDateTime(e.examTime)}</td><td>${e.remark || ""}</td></tr>`).join("")}
            </tbody></table>` : `<p class="muted">暂无考试记录。</p>`}
        </section>
        <section class="detail-section">
            <h4>🖼️ 上传材料</h4>
            <div class="material-preview">
                ${student.idPhotoName && student.idPhotoName.startsWith("/uploads/") ? `<div class="material-thumb"><p class="muted">身份证照片</p><img src="${student.idPhotoName}" alt="身份证照片" onclick="window.open('${student.idPhotoName}')"></div>` : '<p class="muted">身份证照片：未上传</p>'}
                ${student.medicalFormName && student.medicalFormName.startsWith("/uploads/") ? `<div class="material-thumb"><p class="muted">体检表</p><img src="${student.medicalFormName}" alt="体检表" onclick="window.open('${student.medicalFormName}')"></div>` : '<p class="muted">体检表：未上传</p>'}
            </div>
        </section>
        <section class="detail-section">
            <h4>📜 练车记录</h4>
            ${(student.progressLogs && student.progressLogs.length)
                ? `<details class="change-log-details"><summary>共 ${student.progressLogs.length} 条记录</summary><ul>${student.progressLogs.slice().reverse().map(l => `<li>${l}</li>`).join("")}</ul></details>`
                : `<p class="muted">暂无记录。</p>`}
        </section>
    `;
    $("#studentDetailDialog").showModal();
}

function buildProgressBar(label, current, required) {
    const pct = Math.min(100, Math.round(current / required * 100));
    const done = current >= required;
    return `
        <div class="progress-item">
            <span class="progress-label">${label} <strong>${current}</strong>/${required} 学时</span>
            <div class="progress-track"><div class="progress-fill ${done ? "done" : ""}" style="width:${pct}%"></div></div>
            ${done ? '<span class="progress-done">✓ 达标</span>' : ""}
        </div>`;
}

function renderCoachCards() {
    if (!$("#coachList")) {
        return;
    }
    $("#coachList").innerHTML = state.coaches.map((coach) => `
        <article class="coach-card">
            <strong>${coach.name} ${coachStatusTag(coach.status || "在岗")}</strong>
            <span>${coach.vehicleType || "未知"} · 评分 ${coach.rating}</span>
            <span>带学员 ${coach.workload}/${coach.maxStudents} · 空闲 ${coach.freeSlots}</span>
            <span>${(coach.freeTimes || []).join("、") || "暂未维护空闲时间"}</span>
        </article>
    `).join("");
}

function renderAdminExamList() {
    if (!$("#examList")) {
        return;
    }
    let filtered = state.exams;
    if (examSubjectFilter) {
        filtered = filtered.filter((e) => e.subject === examSubjectFilter);
    }
    if (examStatusFilter) {
        filtered = filtered.filter((e) => e.status === examStatusFilter);
    }
    const countEl = $("#examCount");
    if (countEl) countEl.textContent = `共 ${filtered.length} 条记录`;
    if (!filtered.length) {
        $("#examList").innerHTML = `<p class="muted">暂无符合条件的考试记录。</p>`;
        return;
    }
    $("#examList").innerHTML = filtered.map((exam) => {
        const student = state.students.find((s) => s.id === exam.studentId);
        const studentName = student ? student.name : `学员${exam.studentId}`;
        const isPending = exam.status === "待审核";
        const isApproved = exam.status === "报名成功";
        const hasScore = exam.status === "已出成绩";
        const isRejected = exam.status === "报名驳回";

        let actions = "";
        if (isPending) {
            actions += `<button class="primary" onclick="approveExam(${exam.id})">审核通过</button>`;
            actions += `<button class="danger" onclick="openExamRejectDialog(${exam.id})">驳回</button>`;
        }
        if (isApproved) {
            actions += `<button class="ghost" onclick="openScoreDialog(${exam.id})">录入成绩</button>`;
        }

        const makeupTag = exam.makeup ? `<span class="tag warn">补考</span>` : "";
        const passedTag = hasScore ? (exam.passed ? `<span class="tag">合格</span>` : `<span class="tag bad">不合格</span>`) : "";

        return `
        <article class="item">
            <div>
                <h3>${studentName} · ${exam.subject} ${statusTag(exam.status)} ${makeupTag} ${passedTag}</h3>
                <p>考试时间：${formatDateTime(exam.examTime)} ${exam.venue ? "· 考场：" + exam.venue : ""} · 成绩：${exam.score != null ? exam.score : "未录入"}</p>
                <p>${exam.remark || ""}${exam.makeupFee ? " · 补考费：" + exam.makeupFee + "元" : ""}</p>
            </div>
            ${actions ? `<div class="actions">${actions}</div>` : ""}
        </article>`;
    }).join("") + renderCertificateSection();
}

function renderCertificateSection() {
    const waiting = state.students.filter((s) => "等待发证".equals?.(s.status) || s.status === "等待发证" || "待发证".equals?.(s.certificateStatus) || s.certificateStatus === "待发证");
    if (!waiting.length) return "";
    return `
    <article class="item" style="border-left:3px solid #0f766e;margin-top:12px">
        <div>
            <h3>发证登记</h3>
            <p class="muted">以下学员已完成全部科目，等待发放驾驶证。</p>
        </div>
    </article>
    ${waiting.map((s) => `
        <article class="item">
            <div><h3>${s.name} · ${s.vehicleType} ${statusTag(s.status)}</h3><p>全部科目已通过，待发证。</p></div>
            <div class="actions"><button class="primary" onclick="openCertificateDialog(${s.id})">登记发证</button></div>
        </article>
    `).join("")}`;
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
    const box = $(`#recommend-${studentId}`);
    if (!box) return;
    box.innerHTML = `<p class="muted">正在加载推荐…</p>`;
    try {
        const recommendations = await api(`/api/students/${studentId}/coach-recommendations`);
        if (!recommendations.length) {
            box.innerHTML = `<p class="muted">暂无匹配教练（需车型一致、在岗、有空闲名额）。</p>`;
        } else {
            box.innerHTML = recommendations.map((item) => `
                <div class="recommend-row">
                    <span>${item.coach.name} · 推荐分 ${item.score} · ${item.reason}</span>
                    <button class="ghost" onclick="assignCoach(${studentId}, ${item.coach.id})">确认分配</button>
                </div>
            `).join("");
        }
    } catch (error) {
        box.innerHTML = `<p class="muted" style="color:#842029">加载失败：${error.message}</p>`;
    }
}

async function assignCoach(studentId, coachId) {
    try {
        await api(`/api/students/${studentId}/assign-coach`, { method: "POST", body: { coachId } });
        showResultDialog("分配成功", "教练分配完成，学员与教练已绑定。");
        await loadAll();
    } catch (error) {
        showResultDialog("分配失败", error.message || "教练分配失败。");
    }
}

async function approveExam(id) {
    const exam = state.exams.find((e) => e.id === id);
    if (!exam) return;
    const student = state.students.find((s) => s.id === exam.studentId);
    showResultDialog("确认审核通过", `确定要通过${student?.name || ""}的${exam.subject}考试报名吗？`, async () => {
        try {
            await api(`/api/exams/${id}/approve`, { method: "POST" });
            showResultDialog("审核通过", `${student?.name || ""}的${exam.subject}考试报名已通过。`);
            await loadAll();
        } catch (error) {
            showResultDialog("操作失败", error.message || "审核操作失败。");
        }
    });
}

function openExamRejectDialog(examId) {
    const exam = state.exams.find((e) => e.id === examId);
    if (!exam) return;
    pendingRejectExamId = examId;
    const student = state.students.find((s) => s.id === exam.studentId);
    $("#examRejectInfo").textContent = `学员：${student?.name || ""} · 科目：${exam.subject}`;
    $("#examRejectReason").value = "";
    $("#examRejectDialog").showModal();
}

async function confirmExamReject() {
    const reason = $("#examRejectReason").value.trim();
    if (!reason) { toast("请填写驳回原因"); return; }
    const id = pendingRejectExamId;
    if (!id) return;
    const exam = state.exams.find((e) => e.id === id);
    const student = state.students.find((s) => s.id === exam?.studentId);
    try {
        await api(`/api/exams/${id}/reject`, { method: "POST", body: { reason } });
        $("#examRejectDialog").close();
        pendingRejectExamId = null;
        showResultDialog("已驳回", `${student?.name || ""}的${exam?.subject || ""}考试报名已驳回。`);
        await loadAll();
    } catch (error) {
        showResultDialog("操作失败", error.message || "驳回操作失败。");
    }
}

function openScoreDialog(examId) {
    const exam = state.exams.find((e) => e.id === examId);
    if (!exam) return;
    pendingScoreExamId = examId;
    const student = state.students.find((s) => s.id === exam.studentId);
    const line = (exam.subject === "科目二" || exam.subject === "科目三") ? 80 : 90;
    $("#scoreDialogTitle").textContent = "录入成绩 — " + (student?.name || "");
    $("#scoreInfo").textContent = `科目：${exam.subject} · 考场：${exam.venue || "未设置"}`;
    $("#scorePassLine").textContent = `合格线：${line}分`;
    $("#scoreInput").value = "";
    $("#scoreRemark").value = "";
    $("#scoreDialog").showModal();
}

async function confirmScore() {
    const score = Number($("#scoreInput").value);
    if (Number.isNaN(score) || score < 0 || score > 100) {
        toast("请输入 0-100 的有效分数");
        return;
    }
    const id = pendingScoreExamId;
    if (!id) return;
    const remark = $("#scoreRemark").value.trim();
    try {
        await api(`/api/exams/${id}/score`, { method: "POST", body: { score, remark } });
        $("#scoreDialog").close();
        pendingScoreExamId = null;
        toast("成绩已录入，学习阶段已更新");
        await loadAll();
    } catch (error) {
        showResultDialog("录入失败", error.message || "成绩录入失败。");
    }
}

function openCertificateDialog(studentId) {
    const student = state.students.find((s) => s.id === studentId);
    if (!student) return;
    $("#certificateInfo").textContent = `确认学员「${student.name}」已领取驾驶证？登记后不可撤销。`;
    $("#confirmCertificate").onclick = async () => {
        try {
            await api(`/api/students/${studentId}/certificate`, { method: "POST" });
            $("#certificateDialog").close();
            showResultDialog("发证成功", `学员「${student.name}」的发证登记已完成。`);
            await loadAll();
        } catch (error) {
            showResultDialog("操作失败", error.message || "发证登记失败。");
        }
    };
    $("#certificateDialog").showModal();
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
            const result = await api("/api/coaches", { method: "POST", body: data });
            if (result.loginUsername) {
                $("#resultTitle").textContent = "新增成功";
                $("#resultMessage").innerHTML =
                    "教练\u300C" + name + "\u300D已成功添加。<br><br>" +
                    "<strong>登录账号：</strong>" + result.loginUsername + "<br>" +
                    "<strong>登录密码：</strong>" + result.loginPassword + "<br><br>" +
                    "默认密码，请提醒教练首次登录后修改密码。";
                resultDialogCallback = null;
                $("#resultDialog").showModal();
            } else {
                showResultDialog("新增成功", "教练\u300C" + name + "\u300D已成功添加。");
            }
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

// ========== Basic Config (基础信息) ==========

function renderVehicleTypes() {
    if (!$("#vehicleTypeList")) return;
    if (!state.vehicleTypes.length) {
        $("#vehicleTypeList").innerHTML = `<p class="muted">暂无车型数据。</p>`;
        return;
    }
    $("#vehicleTypeList").innerHTML = state.vehicleTypes.map((vt) => `
        <article class="item">
            <div>
                <h3>${vt.name} ${vt.enabled ? '<span class="coach-status active">启用</span>' : '<span class="coach-status left">禁用</span>'}</h3>
                <p>${vt.description || ""} · 年龄 ${vt.minAge}-${vt.maxAge}岁 · 学时 ${vt.requiredHours}h</p>
                <p>报名费 ¥${vt.registrationFee ?? 0} · 考试费 ¥${vt.examFee ?? 0}</p>
            </div>
            <div class="actions">
                <button class="ghost" onclick="openVehicleTypeForm('edit', ${vt.id})">编辑</button>
                <button class="ghost" onclick="toggleVehicleType(${vt.id}, ${!vt.enabled})">${vt.enabled ? "禁用" : "启用"}</button>
                <button class="danger" onclick="deleteVehicleType(${vt.id})">删除</button>
            </div>
        </article>
    `).join("");
}

function renderExamVenues() {
    if (!$("#examVenueList")) return;
    if (!state.examVenues.length) {
        $("#examVenueList").innerHTML = `<p class="muted">暂无考场数据。</p>`;
        return;
    }
    $("#examVenueList").innerHTML = state.examVenues.map((v) => `
        <article class="item">
            <div>
                <h3>${v.name} ${v.enabled ? '<span class="coach-status active">启用</span>' : '<span class="coach-status left">禁用</span>'}</h3>
                <p>地址：${v.address || "未设置"}</p>
                <p>可考科目：${(v.subjects || []).join("、") || "未设置"} · 时间段：${(v.timeSlots || []).join("、") || "未设置"}</p>
            </div>
            <div class="actions">
                <button class="ghost" onclick="openExamVenueForm('edit', ${v.id})">编辑</button>
                <button class="ghost" onclick="toggleExamVenue(${v.id}, ${!v.enabled})">${v.enabled ? "禁用" : "启用"}</button>
                <button class="danger" onclick="deleteExamVenue(${v.id})">删除</button>
            </div>
        </article>
    `).join("");
}

function openVehicleTypeForm(mode, id) {
    vehicleTypeFormMode = mode;
    vehicleTypeFormEditId = id || null;
    if (mode === "edit") {
        const vt = state.vehicleTypes.find((v) => v.id === id);
        if (!vt) return;
        $("#vehicleTypeFormTitle").textContent = "编辑车型";
        $("#vtName").value = vt.name || "";
        $("#vtDesc").value = vt.description || "";
        $("#vtMinAge").value = vt.minAge || 18;
        $("#vtMaxAge").value = vt.maxAge || 70;
        $("#vtHours").value = vt.requiredHours || 68;
        $("#vtRegFee").value = vt.registrationFee ?? 3500;
        $("#vtExamFee").value = vt.examFee ?? 500;
    } else {
        $("#vehicleTypeFormTitle").textContent = "新增车型";
        $("#vtName").value = ""; $("#vtDesc").value = "";
        $("#vtMinAge").value = 18; $("#vtMaxAge").value = 70;
        $("#vtHours").value = 68; $("#vtRegFee").value = 3500; $("#vtExamFee").value = 500;
    }
    $("#vehicleTypeFormDialog").showModal();
}

async function submitVehicleTypeForm() {
    const name = $("#vtName").value.trim();
    if (!name) { toast("车型代码不能为空"); return; }
    const data = {
        name,
        description: $("#vtDesc").value.trim(),
        minAge: Number($("#vtMinAge").value) || 0,
        maxAge: Number($("#vtMaxAge").value) || 0,
        requiredHours: Number($("#vtHours").value) || 0,
        registrationFee: Number($("#vtRegFee").value) || 0,
        examFee: Number($("#vtExamFee").value) || 0
    };
    try {
        if (vehicleTypeFormMode === "create") {
            await api("/api/vehicle-types", { method: "POST", body: data });
            showResultDialog("新增成功", `车型「${name}」已添加。`);
        } else {
            await api(`/api/vehicle-types/${vehicleTypeFormEditId}`, { method: "PUT", body: data });
            showResultDialog("编辑成功", `车型「${name}」已更新。`);
        }
        $("#vehicleTypeFormDialog").close();
        await loadAll();
    } catch (error) {
        showResultDialog("操作失败", error.message || "保存车型失败。");
    }
}

async function toggleVehicleType(id, enabled) {
    try {
        await api(`/api/vehicle-types/${id}/toggle?enabled=${enabled}`, { method: "PUT" });
        toast(enabled ? "已启用" : "已禁用");
        await loadAll();
    } catch (error) {
        showResultDialog("操作失败", error.message);
    }
}

async function deleteVehicleType(id) {
    const vt = state.vehicleTypes.find((v) => v.id === id);
    showResultDialog("确认删除", `确定删除车型「${vt?.name || ""}」吗？`, async () => {
        try {
            await api(`/api/vehicle-types/${id}`, { method: "DELETE" });
            showResultDialog("删除成功", `车型「${vt?.name || ""}」已删除。`);
            await loadAll();
        } catch (error) {
            showResultDialog("删除失败", error.message);
        }
    });
}

function openExamVenueForm(mode, id) {
    examVenueFormMode = mode;
    examVenueFormEditId = id || null;
    if (mode === "edit") {
        const v = state.examVenues.find((x) => x.id === id);
        if (!v) return;
        $("#examVenueFormTitle").textContent = "编辑考场";
        $("#evName").value = v.name || "";
        $("#evAddress").value = v.address || "";
        $("#evSubjects").value = (v.subjects || []).join("、");
        $("#evTimeSlots").value = (v.timeSlots || []).join("、");
    } else {
        $("#examVenueFormTitle").textContent = "新增考场";
        $("#evName").value = ""; $("#evAddress").value = "";
        $("#evSubjects").value = ""; $("#evTimeSlots").value = "";
    }
    $("#examVenueFormDialog").showModal();
}

async function submitExamVenueForm() {
    const name = $("#evName").value.trim();
    if (!name) { toast("考场名称不能为空"); return; }
    const data = {
        name,
        address: $("#evAddress").value.trim(),
        subjects: $("#evSubjects").value.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
        timeSlots: $("#evTimeSlots").value.split(/[、,，]/).map((s) => s.trim()).filter(Boolean)
    };
    try {
        if (examVenueFormMode === "create") {
            await api("/api/exam-venues", { method: "POST", body: data });
            showResultDialog("新增成功", `考场「${name}」已添加。`);
        } else {
            await api(`/api/exam-venues/${examVenueFormEditId}`, { method: "PUT", body: data });
            showResultDialog("编辑成功", `考场「${name}」已更新。`);
        }
        $("#examVenueFormDialog").close();
        await loadAll();
    } catch (error) {
        showResultDialog("操作失败", error.message || "保存考场失败。");
    }
}

async function toggleExamVenue(id, enabled) {
    try {
        await api(`/api/exam-venues/${id}/toggle?enabled=${enabled}`, { method: "PUT" });
        toast(enabled ? "已启用" : "已禁用");
        await loadAll();
    } catch (error) {
        showResultDialog("操作失败", error.message);
    }
}

async function deleteExamVenue(id) {
    const v = state.examVenues.find((x) => x.id === id);
    showResultDialog("确认删除", `确定删除考场「${v?.name || ""}」吗？`, async () => {
        try {
            await api(`/api/exam-venues/${id}`, { method: "DELETE" });
            showResultDialog("删除成功", `考场「${v?.name || ""}」已删除。`);
            await loadAll();
        } catch (error) {
            showResultDialog("删除失败", error.message);
        }
    });
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
