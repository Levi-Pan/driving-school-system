// ========== Student Forms ==========

function bindStudentForms() {
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

// ========== Student Utility (used in student render) ==========

async function cancelLesson(id) {
    await api(`/api/lessons/${id}/cancel`, { method: "POST" });
    toast("约课已取消");
    await loadAll();
}
