// ========== Student Forms ==========

function bindStudentForms() {
    $("#applyForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = event.target.querySelector("button[type=submit]");
        const originalText = submitButton?.textContent || "提交报名";
        const data = formData(event.target);
        data.name = state.currentAccount?.name || data.name;
        if (!data.idPhotoName || !data.medicalFormName) {
            showResultDialog("材料未上传", "请先上传身份证照片和体检表图片，再提交报名。");
            return;
        }
        data.age = Number(data.age);
        data.licenseEligible = event.target.licenseEligible.checked;
        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "正在提交...";
            }
            await api("/api/students/apply", { method: "POST", body: data });
            await loadAll();
            showResultDialog("报名提交成功", "系统已完成自动初审，请在“我的进度”中查看审核状态。", () => {
                document.querySelector('[data-view="status"]')?.click();
            });
        } catch (error) {
            showResultDialog("报名提交失败", error.message || "请检查后端服务和数据库连接后重试。");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    });

    $("#lessonForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const student = currentAccountStudent();
        if (!student) {
            showResultDialog("无法约课", "请先完成在线报名。");
            return;
        }
        const data = formData(event.target);
        data.studentId = student.id;
        try {
            await api("/api/lessons", { method: "POST", body: data });
            await loadAll();
            showResultDialog("约课成功", "你的约课申请已提交。");
        } catch (error) {
            showResultDialog("约课失败", error.message || "请稍后重试。");
        }
    });

    $("#examForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const student = currentAccountStudent();
        if (!student) {
            showResultDialog("无法报名考试", "请先完成在线报名。");
            return;
        }
        const data = formData(event.target);
        data.studentId = student.id;
        try {
            await api("/api/exams/apply", { method: "POST", body: data });
            await loadAll();
            showResultDialog("考试报名已提交", "请等待管理员审核考试报名。");
        } catch (error) {
            showResultDialog("考试报名失败", error.message || "请稍后重试。");
        }
    });
}

// ========== Student Render ==========

async function renderStudent() {
    // 从注册账号预填手机号
    const phoneInput = document.querySelector("#applyForm [name=phone]");
    if (phoneInput && state.currentAccount?.phone) {
        phoneInput.value = state.currentAccount.phone;
    }
    // 直接获取车型数据填充下拉
    try {
        const types = await api("/api/vehicle-types");
        const select = document.querySelector("#vehicleTypeSelect");
        if (select && types && types.length > 0) {
            const enabledTypes = types.filter(t => t.enabled !== false);
            if (enabledTypes.length > 0) {
                select.innerHTML = enabledTypes.map(t =>
                    `<option value="${t.name}">${t.name}${t.description ? " · " + t.description : ""}</option>
`
                ).join("");
            }
        }
    } catch (e) {
        // 静默失败，renderVehicleTypeSelect 会做后备
    }
    renderApplyForm();
    renderVehicleTypeSelect(); // 后备
    renderStudentStatus();
    renderStudentLessons();
    renderStudentExams();
    renderStudentDocuments();
}

function renderApplyForm() {
    const form = $("#applyForm");
    const notice = $("#applyStatusNotice");
    if (!form || !notice) return;

    // 填充报考车型下拉（仅显示启用的车型，与管理端车型管理一致）
    renderVehicleTypeSelect();

    const student = currentAccountStudent();
    // 没有报名记录 → 显示表单（首次报名）
    if (!student) {
        notice.innerHTML = "";
        form.style.display = "";
        return;
    }

    const status = student.status;
    const waitingStatuses = ["待初审", "待复审"];
    const approvedStatuses = ["待分配", "学习中", "可报名考试", "考试报名待审", "待考试", "补考安排中", "等待发证", "已发证"];
    const rejectedStatuses = ["初审驳回", "审核驳回"];

    if (waitingStatuses.includes(status)) {
        // 待审核 → 隐藏表单，显示等待提示
        form.style.display = "none";
        notice.innerHTML = `
            <article class="item single" style="border-left:3px solid #b7791f">
                <div>
                    <h3>📝 已经提交报名信息，请等待系统审核</h3>
                    <p>你于 ${formatDateTime(student.createdAt)} 提交了报名申请，当前状态：${statusTag(status)}。</p>
                    <p>自动初审结果：${student.autoReviewResult || "已通过"}</p>
                    <p>请耐心等待管理员审核，审核通过后可在「我的进度」查看。如需查看其他信息，请切换上方标签。</p>
                </div>
            </article>`;
    } else if (approvedStatuses.includes(status)) {
        // 已通过 → 隐藏表单，显示已通过提示
        form.style.display = "none";
        notice.innerHTML = `
            <article class="item single" style="border-left:3px solid #0f766e">
                <div>
                    <h3>✅ 报名已通过</h3>
                    <p>你的报名申请已审核通过，无需重复提交。当前状态：${statusTag(status)}。</p>
                    <p>请前往「我的进度」查看学习进度和教练分配情况。</p>
                </div>
            </article>`;
    } else if (rejectedStatuses.includes(status)) {
        // 被驳回 → 显示表单 + 驳回原因，允许重新提交
        form.style.display = "";
        notice.innerHTML = student.reviewOpinion
            ? `<article class="item single" style="border-left:3px solid #842029"><div><h3>⚠️ 报名被驳回，请修改后重新提交</h3><p style="color:var(--coral)">驳回原因：${student.reviewOpinion}</p></div></article>`
            : "";
    } else {
        form.style.display = "";
        notice.innerHTML = "";
    }
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
    const isRejected = student.status === "初审驳回" || student.status === "审核驳回";
    const rejectReason = (isRejected && student.reviewOpinion)
        ? `<p style="color:var(--coral)">驳回原因：${student.reviewOpinion}</p>` : "";
    $("#studentStatus").innerHTML = `
        <article class="item single">
            <div>
                <h3>${student.name} ${statusTag(student.status)}</h3>
                <p>电话：${student.phone || state.currentAccount?.phone || "未设置"} · 报考车型：${student.vehicleType} · 学习阶段：${student.stage} · 学时：①${student.subjectOneHours || 0} / ②${student.subjectTwoHours || 0} / ③${student.subjectThreeHours || 0} / ④${student.subjectFourHours || 0}</p>
                <p>自动初审：${student.autoReviewResult}</p>
                ${rejectReason}
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

// ========== Student Utility ==========

function renderStudentDocuments() {
    const container = $("#studentTicketList");
    if (!container) return;

    const student = currentAccountStudent();
    if (!student) {
        container.innerHTML = `<p class="muted">暂无报名记录，请先完成在线报名。</p>`;
        return;
    }

    // 按科目查看准考证：每个科目独立一张，仅已报名成功（审核通过）的科目显示考试信息
    const subjects = ["科目一", "科目二", "科目三", "科目四"];
    container.innerHTML = `
        <div class="actions left">
            ${subjects.map((s) => `<button class="ghost" onclick="showStudentTicket(${student.id}, '${s}')">${s} 准考证</button>`).join("")}
        </div>
    `;
}

/** 渲染车型下拉：从管理端车型管理同步，仅显示启用的车型 */
function renderVehicleTypeSelect() {
    const select = $("#vehicleTypeSelect");
    if (!select) return;
    const types = (state.vehicleTypes || []).filter((vt) => vt.enabled !== false);
    if (!types.length) {
        select.innerHTML = `<option value="">暂无可选车型</option>`;
        return;
    }
    const currentValue = select.value;
    select.innerHTML = types.map((vt) =>
        `<option value="${vt.name}">${vt.name}${vt.description ? ` · ${vt.description}` : ""}</option>`
    ).join("");
    // 保留之前的选中（如果还存在）
    if (currentValue && types.some((vt) => vt.name === currentValue)) {
        select.value = currentValue;
    }
}

async function cancelLesson(id) {
    try {
        await api(`/api/lessons/${id}/cancel`, { method: "POST" });
        await loadAll();
        showResultDialog("约课已取消", "该约课记录已取消。");
    } catch (error) {
        showResultDialog("取消失败", error.message || "请稍后重试。");
    }
}
