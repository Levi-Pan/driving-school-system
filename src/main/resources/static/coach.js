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

    $("#coachPick")?.addEventListener("change", renderCoachViews);
}

// ========== Coach Render ==========

function renderCoachViews() {
    renderCoachStudents();
    renderCoachLessons();
    renderCoachCards();
    fillProgressStudentsForCoach();
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
