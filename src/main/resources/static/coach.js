// ========== Coach Forms ==========

function bindCoachForms() {
    $("#progressForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = event.target.querySelector("button[type=submit]");
        const originalText = submitButton?.textContent || "保存进度";
        const data = formData(event.target);
        const studentId = data.studentId;
        delete data.studentId;
        data.hours = Number(data.hours);
        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "正在保存...";
            }
            await api(`/api/students/${studentId}/progress`, { method: "POST", body: data });
            await loadAll();
            showResultDialog("保存成功", "学时与练车记录已保存。");
        } catch (error) {
            showResultDialog("保存失败", error.message || "请稍后重试。");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    });

    $("#availabilityForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formData(event.target);
        const freeTimes = data.freeTimes.split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
        try {
            await api(`/api/coaches/${data.coachId}/availability`, { method: "POST", body: { freeTimes } });
            await loadAll();
            showResultDialog("保存成功", "教练空闲时间已更新。");
        } catch (error) {
            showResultDialog("保存失败", error.message || "请稍后重试。");
        }
    });

    $("#profileForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formData(event.target);
        const name = data.name.trim();
        if (!name) { toast("姓名不能为空"); return; }
        try {
            await api("/api/auth/profile", { method: "PUT", body: data });
            await loadAll();
            showResultDialog("保存成功", "个人资料已更新。");
        } catch (error) {
            showResultDialog("保存失败", error.message || "请稍后重试。");
        }
    });

    $("#passwordForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formData(event.target);
        if (data.newPassword !== data.confirmPassword) {
            toast("两次输入的新密码不一致");
            return;
        }
        if (data.newPassword.length < 6) {
            toast("新密码长度不能少于6位");
            return;
        }
        try {
            await api("/api/auth/change-password", { method: "POST", body: { oldPassword: data.oldPassword, newPassword: data.newPassword } });
            event.target.reset();
            showResultDialog("密码修改成功", "请使用新密码登录。", () => { location.href = "/login.html"; });
        } catch (error) {
            showResultDialog("修改失败", error.message || "请稍后重试。");
        }
    });
}

// ========== Coach Render ==========

function loadCurrentCoach() {
    const account = state.currentAccount;
    if (!account || !state.coaches.length) {
        state.currentCoach = null;
        return;
    }
    state.currentCoach = state.coaches.find(c => c.accountId === account.id)
        || state.coaches.find(c => c.name === account.name)
        || (account.role === 'COACH' ? state.coaches.find(c => c.phone === account.username) : null)
        || null;
}

function renderCoachViews() {
    loadCurrentCoach();
    if (!state.currentCoach) {
        const msg = '<p class="muted">未找到与你账号关联的教练信息，请联系管理员。</p>';
        ["coachStudentList","coachLessonList","coachList"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = msg;
        });
        return;
    }
    const info = document.getElementById("coachTitleInfo");
    if (info) info.textContent = state.currentCoach.name + " · " + state.currentCoach.vehicleType;
    const avInput = document.getElementById("availabilityCoach");
    if (avInput) avInput.value = state.currentCoach.id;
    renderCoachMetrics();
    renderCoachStudents();
    renderCoachLessons();
    renderSelfCoach();
    fillProgressStudentsForCoach();
    renderCoachProfile();
    renderCoachExams();
}

function renderCoachStudents() {
    if (!$("#coachStudentList")) {
        return;
    }
    const coach = state.currentCoach;
    if (!coach) {
        $("#coachStudentList").innerHTML = `<p class="muted">暂无教练数据。</p>`;
        return;
    }
    const students = state.students.filter((student) => student.coachId === coach.id);
    $("#coachStudentList").innerHTML = students.length ? students.map((student) => `
        <article class="item single">
            <div>
                <h3>${student.name} ${statusTag(student.status)}</h3>
                <p>电话：${student.phone} · 车型：${student.vehicleType} · 阶段：${student.stage} · 学时：①${student.subjectOneHours || 0} / ②${student.subjectTwoHours || 0} / ③${student.subjectThreeHours || 0} / ④${student.subjectFourHours || 0}</p>
                <p>练车记录：${(student.progressLogs || []).slice(-3).join(" / ") || "暂无记录"}</p>
            </div>
        </article>
    `).join("") : `<p class="muted">当前教练暂无绑定学员。</p>`;
}

function renderCoachLessons() {
    if (!$("#coachLessonList")) {
        return;
    }
    const coach = state.currentCoach;
    const rows = coach ? state.lessons.filter((lesson) => lesson.coachId === coach.id) : [];
    $("#coachLessonList").innerHTML = rows.length ? rows.map((lesson) => `
        <article class="item">
            <div>
                <h3>${studentName(lesson.studentId)} ${statusTag(lesson.status)}</h3>
                <p>${lesson.lessonDate} ${lesson.timeRange} · ${lesson.note}</p>
            </div>
            <div class="actions"><button class="ghost" onclick="cancelCoachLesson('${lesson.id}')">取消约课</button></div>
        </article>
    `).join("") : `<p class="muted">暂无约课安排。</p>`;
}

function fillProgressStudentsForCoach() {
    const element = $("#progressStudent");
    if (!element) {
        return;
    }
    const coach = state.currentCoach;
    const students = coach ? state.students.filter((student) => student.coachId === coach.id) : state.students;
    const selected = element.value;
    element.innerHTML = students.map((student) => `<option value="${student.id}">${student.name} · ${student.stage}</option>`).join("");
    if (selected) {
        element.value = selected;
    }
}


function renderSelfCoach() {
    if (!$("#coachList")) return;
    const coach = state.currentCoach;
    if (!coach) {
        $("#coachList").innerHTML = '<p class="muted">暂无教练信息。</p>';
        return;
    }
    $("#coachList").innerHTML = `
        <article class="coach-card">
            <strong>${coach.name} <span class="coach-status active">在岗</span></strong>
            <span>${coach.vehicleType} · 评分 ${coach.rating} · 从业 ${coach.yearsOfExperience || 0} 年</span>
            <span>带学员 ${coach.workload}/${coach.maxStudents} · 空闲 ${coach.freeSlots} 名额</span>
            <span>空闲时间：${(coach.freeTimes || []).join("、") || "暂未维护"}</span>
            <span>${coach.bio || "暂无简介"}</span>
        </article>
    `;
}

function renderCoachProfile() {
    const coach = state.currentCoach;
    if (!$("#profileForm")) return;
    if (!coach) return;
    document.getElementById("profileName").value = coach.name || "";
    document.getElementById("profileBio").value = coach.bio || "";
    document.getElementById("profilePhone").value = coach.phone || "";
    document.getElementById("profileVehicleType").value = coach.vehicleType || "C1";
    document.getElementById("profileGender").value = coach.gender || "";
    document.getElementById("profileExperience").value = coach.yearsOfExperience || 0;
    document.getElementById("profileStatus").textContent = coach.status || "在岗";
    if (coach.avatar) {
        const preview = document.getElementById("avatarPreview");
        if (preview) {
            preview.innerHTML = '<img src="' + coach.avatar + '" alt="头像">';
        }
        document.getElementById("profileAvatar").value = coach.avatar;
    }
}


function renderCoachMetrics() {
    if (!$("#coachMetrics")) return;
    const coach = state.currentCoach;
    if (!coach) return;
    const students = state.students.filter(s => s.coachId === coach.id);
    const lessons = state.lessons.filter(l => l.coachId === coach.id);
    const today = new Date().toISOString().slice(0, 10);
    const todayLessons = lessons.filter(l => l.lessonDate === today);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const ws = weekStart.toISOString().slice(0, 10);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));
    const we = weekEnd.toISOString().slice(0, 10);
    const weekLessons = lessons.filter(l => l.lessonDate >= ws && l.lessonDate <= we);
    const sids = students.map(s => s.id);
    const sexams = state.exams.filter(e => sids.includes(e.studentId));
    const scored = sexams.filter(e => e.score != null);
    const passed = scored.filter(e => e.passed);
    const rate = scored.length > 0 ? Math.round(passed.length / scored.length * 100) + '%' : '-';
    document.getElementById("metricStudents").textContent = students.length;
    document.getElementById("metricToday").textContent = todayLessons.length;
    document.getElementById("metricWeekHours").textContent = weekLessons.length;
    document.getElementById("metricPassRate").textContent = rate;
}

function renderCoachExams() {
    if (!$("#coachExamList")) return;
    const coach = state.currentCoach;
    if (!coach) { $("#coachExamList").innerHTML = '<p class="muted">暂无教练数据。</p>'; return; }
    const sids = state.students.filter(s => s.coachId === coach.id).map(s => s.id);
    const exams = state.exams.filter(e => sids.includes(e.studentId));
    $("#coachExamList").innerHTML = exams.length ? exams.map(exam => `
        <article class="item single">
            <div>
                <h3>${studentName(exam.studentId)} · ${exam.subject} ${statusTag(exam.status)}</h3>
                <p>考试时间：${formatDateTime(exam.examTime)} · 成绩：${exam.score ?? "未录入"}</p>
                <p>${exam.passed == null ? "等待考试或成绩录入" : exam.passed ? "成绩合格，进入下一科目" : "成绩不合格，等待补考安排"}</p>
            </div>
        </article>
    `).join("") : '<p class="muted">暂无考试记录。</p>';}

async function cancelCoachLesson(id) {
    try {
        await api("/api/lessons/" + id + "/cancel", { method: "POST" });
        await loadAll();
        showResultDialog("约课已取消", "该约课记录已取消。");
    } catch (error) {
        showResultDialog("取消失败", error.message || "请稍后重试。");
    }
}
function setDefaultDates() {
    // Override common.js version - no date defaults needed
}
