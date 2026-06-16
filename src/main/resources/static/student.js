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

function renderStudent() {
    renderStudentStatus();
    renderStudentLessons();
    renderStudentExams();
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
                <p>报考车型：${student.vehicleType} · 学习阶段：${student.stage} · 学时：①${student.subjectOneHours || 0} / ②${student.subjectTwoHours || 0} / ③${student.subjectThreeHours || 0} / ④${student.subjectFourHours || 0}</p>
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

async function cancelLesson(id) {
    try {
        await api(`/api/lessons/${id}/cancel`, { method: "POST" });
        await loadAll();
        showResultDialog("约课已取消", "该约课记录已取消。");
    } catch (error) {
        showResultDialog("取消失败", error.message || "请稍后重试。");
    }
}
