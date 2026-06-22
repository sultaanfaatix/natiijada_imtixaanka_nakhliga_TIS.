const STORAGE_KEY = "resultpro.final.exam.v1";
const AUTH_SESSION_KEY = "resultpro.admin.session";
const DEFAULT_SYSTEM_LOGO = "assets/system-profile-logo.svg";
const DEFAULT_SCHOOL_LOGO = "assets/school-logo.svg";

const demoData = {
  settings: {
    schoolName: "Somali Future Secondary School",
    academicYear: "2025/2026",
    principalName: "Mr. Mohamed Ali",
    adminUsername: "admin",
    adminPassword: "admin123",
    logoDataUrl: "",
    systemLogoDataUrl: "", // <-- new: system/admin/auth logo
    callCenter: "+252 61 0000000",
    whatsappNumber: "+252 61 0000000",
    contactEmail: "office@example.com",
    facebookPage: "ResultPro Office",
    schoolAddress: "Mogadishu, Somalia",
    copyrightName: "SULTAN",
  },
  students: [
    { id: crypto.randomUUID(), name: "Ayaan Hassan", roll: "F4-001", className: "Form 4A", motherName: "Fadumo Ali", resultLocked: false, financeMessage: "" },
    { id: crypto.randomUUID(), name: "Yusuf Abdi", roll: "F4-002", className: "Form 4A", motherName: "Sahra Mohamed", resultLocked: false, financeMessage: "" },
    { id: crypto.randomUUID(), name: "Muna Omar", roll: "F4-003", className: "Form 4B", motherName: "Hodan Abukar", resultLocked: true, financeMessage: "Fadlan la xidhiidh xafiiska maaliyadda si natiijadaada laguugu fasaxo." },
    { id: crypto.randomUUID(), name: "Khalid Jama", roll: "F4-004", className: "Form 4B", motherName: "Amina Yusuf", resultLocked: false, financeMessage: "" },
  ],
  subjects: [
    { id: crypto.randomUUID(), name: "Mathematics", max: 100 },
    { id: crypto.randomUUID(), name: "English", max: 100 },
    { id: crypto.randomUUID(), name: "Biology", max: 100 },
    { id: crypto.randomUUID(), name: "Chemistry", max: 100 },
    { id: crypto.randomUUID(), name: "History", max: 100 },
  ],
  marks: {},
};

demoData.students.forEach((student, studentIndex) => {
  demoData.marks[student.id] = {};
  demoData.subjects.forEach((subject, subjectIndex) => {
    demoData.marks[student.id][subject.id] = [88, 74, 93, 61][studentIndex] - subjectIndex * 2;
  });
});

let state = loadState();
let activeView = "dashboard";
let toastTimer;

const views = {
  dashboard: document.getElementById("dashboardView"),
  students: document.getElementById("studentsView"),
  subjects: document.getElementById("subjectsView"),
  results: document.getElementById("resultsView"),
  reports: document.getElementById("reportsView"),
  settings: document.getElementById("settingsView"),
};

const titles = {
  dashboard: "Dashboard",
  students: "Students",
  subjects: "Subjects",
  results: "Results",
  reports: "Reports",
  settings: "Settings",
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(demoData);

  try {
    const parsed = JSON.parse(saved);
    return normalizeState(parsed);
  } catch {
    return structuredClone(demoData);
  }
}

function normalizeStudent(student) {
  return {
    ...student,
    motherName: student.motherName || "",
    resultLocked: Boolean(student.resultLocked),
    financeMessage: student.financeMessage || "",
  };
}

function normalizeState(data) {
  return {
    settings: { ...structuredClone(demoData.settings), ...(data.settings || {}) },
    students: (data.students || []).map(normalizeStudent),
    subjects: data.subjects || [],
    marks: data.marks || {},
  };
}

function showAuth(portal = "admin") {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("adminApp").classList.add("hidden");
  document.getElementById("studentPortal").classList.add("hidden");
  renderLogos();
  renderFooters();
  setPortalTab(portal);
}

function showAdminApp() {
  sessionStorage.setItem(AUTH_SESSION_KEY, "true");
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("studentPortal").classList.add("hidden");
  document.getElementById("adminApp").classList.remove("hidden");
  render();
}

function showStudentPortal(studentId) {
  const student = state.students.find((item) => item.id === studentId);
  if (!student) return showToast("Student result was not found");
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("adminApp").classList.add("hidden");
  document.getElementById("studentPortal").classList.remove("hidden");
  renderLogos();
  renderFooters();
  document.getElementById("studentPortalYear").textContent = state.settings.academicYear;
  document.getElementById("studentResultSlip").innerHTML = createSlipHtml(student);
}

function setPortalTab(portal) {
  document.querySelectorAll(".portal-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.portal === portal);
  });
  document.getElementById("adminLoginForm").classList.toggle("active", portal === "admin");
  document.getElementById("studentLookupForm").classList.toggle("active", portal === "student");
}

function saveState(message = "Saved") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
  showToast(message);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function getScore(studentId, subjectId) {
  const value = state.marks[studentId]?.[subjectId];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function calculateStudent(student) {
  const totalMax = state.subjects.reduce((sum, subject) => sum + Number(subject.max), 0);
  const totalScore = state.subjects.reduce((sum, subject) => sum + getScore(student.id, subject.id), 0);
  const average = totalMax ? (totalScore / totalMax) * 100 : 0;
  return {
    totalScore,
    totalMax,
    average,
    grade: getGrade(average),
    status: average >= 50 ? "Pass" : "Fail",
  };
}

function getGrade(average) {
  if (average >= 90) return "A+";
  if (average >= 80) return "A";
  if (average >= 70) return "B";
  if (average >= 60) return "C";
  if (average >= 50) return "D";
  return "F";
}

function rankedStudents() {
  return state.students
    .map((student) => ({ ...student, result: calculateStudent(student) }))
    .sort((a, b) => b.result.average - a.result.average);
}

function setView(viewName) {
  activeView = viewName;
  Object.entries(views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  document.getElementById("viewTitle").textContent = titles[viewName];
  render();
}

function render() {
  document.getElementById("yearLabel").textContent = state.settings.academicYear;
  renderLogos();
  renderFooters();
  renderDashboard();
  renderStudents();
  renderSubjects();
  renderResults();
  renderReports();
  renderSettings();
}

function renderFooters() {
  const footer = `${escapeHtml(state.settings.copyrightName)} | 2026. All rights are reserved.`;
  ["authFooter", "studentFooter", "adminFooter"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.textContent = footer;
  });
}

function renderLogos() {
  const logoMap = {
    authBrandMark: state.settings.systemLogoDataUrl || DEFAULT_SYSTEM_LOGO,
    adminBrandMark: state.settings.systemLogoDataUrl || DEFAULT_SYSTEM_LOGO,
    studentBrandMark: state.settings.logoDataUrl || DEFAULT_SCHOOL_LOGO,
    settingsLogoPreview: state.settings.logoDataUrl || DEFAULT_SCHOOL_LOGO,
  };

  Object.entries(logoMap).forEach(([id, source]) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = `<img src="${source}" alt="Logo" />`;
  });
}

function renderDashboard() {
  const ranked = rankedStudents();
  const passCount = ranked.filter((student) => student.result.status === "Pass").length;
  const classAverage = ranked.length
    ? ranked.reduce((sum, student) => sum + student.result.average, 0) / ranked.length
    : 0;

  document.getElementById("metricStudents").textContent = state.students.length;
  document.getElementById("metricSubjects").textContent = state.subjects.length;
  document.getElementById("metricPassRate").textContent = `${ranked.length ? Math.round((passCount / ranked.length) * 100) : 0}%`;
  document.getElementById("metricAverage").textContent = classAverage.toFixed(1);

  const topBody = document.getElementById("topStudentsBody");
  topBody.innerHTML = "";
  ranked.slice(0, 6).forEach((student, index) => {
    topBody.appendChild(row([
      index + 1,
      student.name,
      student.className,
      student.result.average.toFixed(1),
      badge(student.result.grade, student.result.grade === "F"),
    ]));
  });
  if (!ranked.length) topBody.appendChild(emptyRow(5, "No students yet."));

  const counts = { "A+": 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  ranked.forEach((student) => counts[student.result.grade] += 1);
  const bars = document.getElementById("gradeBars");
  bars.innerHTML = "";
  Object.entries(counts).forEach(([grade, count]) => {
    const percent = ranked.length ? (count / ranked.length) * 100 : 0;
    const item = document.createElement("div");
    item.className = "grade-bar-row";
    item.innerHTML = `
      <strong>${grade}</strong>
      <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
      <span>${count}</span>
    `;
    bars.appendChild(item);
  });
}

function renderStudents() {
  const query = document.getElementById("studentSearch").value.trim().toLowerCase();
  const body = document.getElementById("studentsBody");
  body.innerHTML = "";

  state.students
    .filter((student) => [student.name, student.roll, student.className, student.motherName].some((value) => value.toLowerCase().includes(query)))
    .forEach((student) => {
      const result = calculateStudent(student);
      body.appendChild(row([
        student.roll,
        student.name,
        student.motherName || "-",
        student.className,
        result.average.toFixed(1),
        badge(student.resultLocked ? "Held" : "Clear", student.resultLocked, student.resultLocked ? "hold" : "pass"),
        actionButtons([
          ["Edit", () => editStudent(student.id)],
          [student.resultLocked ? "Release" : "Hold", () => toggleResultLock(student.id)],
          ["Delete", () => deleteStudent(student.id)],
        ]),
      ]));
    });

  if (!body.children.length) body.appendChild(emptyRow(7, "No matching students."));
}

function renderSubjects() {
  const body = document.getElementById("subjectsBody");
  body.innerHTML = "";
  state.subjects.forEach((subject) => {
    body.appendChild(row([
      subject.name,
      subject.max,
      actionButtons([
        ["Edit", () => editSubject(subject.id)],
        ["Delete", () => deleteSubject(subject.id)],
      ]),
    ]));
  });
  if (!state.subjects.length) body.appendChild(emptyRow(3, "No subjects yet."));
}

function renderResults() {
  const select = document.getElementById("resultStudentSelect");
  const selected = select.value || state.students[0]?.id || "";
  select.innerHTML = "";

  state.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = `${student.roll} - ${student.name}`;
    select.appendChild(option);
  });
  select.value = state.students.some((student) => student.id === selected) ? selected : state.students[0]?.id || "";

  const form = document.getElementById("marksForm");
  form.innerHTML = "";
  if (!select.value || !state.subjects.length) {
    form.innerHTML = '<p class="empty">Add students and subjects before entering marks.</p>';
    return;
  }

  state.subjects.forEach((subject) => {
    const label = document.createElement("label");
    label.textContent = `${subject.name} / ${subject.max}`;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = subject.max;
    input.required = true;
    input.dataset.subjectId = subject.id;
    input.value = getScore(select.value, subject.id);
    label.appendChild(input);
    form.appendChild(label);
  });

  const button = document.createElement("button");
  button.className = "primary-btn";
  button.type = "submit";
  button.textContent = "Save marks";
  form.appendChild(button);
}

function renderReports() {
  const query = document.getElementById("reportSearch").value.trim().toLowerCase();
  const head = document.getElementById("reportsHead");
  const body = document.getElementById("reportsBody");
  head.innerHTML = "";
  body.innerHTML = "";

  const headRow = document.createElement("tr");
  ["Rank", "Roll", "Name", "Mother", "Class", ...state.subjects.map((subject) => subject.name), "Average", "Grade", "Decision", "Finance", "Slip"]
    .forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
  head.appendChild(headRow);

  rankedStudents()
    .filter((student) => [student.name, student.roll, student.className, student.motherName].some((value) => value.toLowerCase().includes(query)))
    .forEach((student, index) => {
      body.appendChild(row([
        index + 1,
        student.roll,
        student.name,
        student.motherName || "-",
        student.className,
        ...state.subjects.map((subject) => getScore(student.id, subject.id)),
        student.result.average.toFixed(1),
        badge(student.result.grade, student.result.grade === "F"),
        student.result.status,
        badge(student.resultLocked ? "Held" : "Clear", student.resultLocked, student.resultLocked ? "hold" : "pass"),
        actionButtons([["View", () => openSlip(student.id)]]),
      ]));
    });

  if (!body.children.length) body.appendChild(emptyRow(11 + state.subjects.length, "No report records."));
}

function renderSettings() {
  document.getElementById("schoolName").value = state.settings.schoolName;
  document.getElementById("academicYear").value = state.settings.academicYear;
  document.getElementById("principalName").value = state.settings.principalName;
  document.getElementById("callCenter").value = state.settings.callCenter;
  document.getElementById("whatsappNumber").value = state.settings.whatsappNumber;
  document.getElementById("contactEmail").value = state.settings.contactEmail;
  document.getElementById("facebookPage").value = state.settings.facebookPage;
  document.getElementById("schoolAddress").value = state.settings.schoolAddress;
  document.getElementById("settingsAdminUsername").value = state.settings.adminUsername;
  document.getElementById("settingsAdminPassword").value = state.settings.adminPassword;
}

function row(cells) {
  const tr = document.createElement("tr");
  cells.forEach((cell) => {
    const td = document.createElement("td");
    if (cell instanceof Node) {
      td.appendChild(cell);
    } else {
      td.textContent = cell;
    }
    tr.appendChild(td);
  });
  return tr;
}

function emptyRow(colspan, message) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = colspan;
  td.className = "empty";
  td.textContent = message;
  tr.appendChild(td);
  return tr;
}

function badge(text, isFail = false, variant = "") {
  const span = document.createElement("span");
  span.className = `badge${isFail ? " fail" : ""}${variant ? ` ${variant}` : ""}`;
  span.textContent = text;
  return span;
}

function actionButtons(items) {
  const wrapper = document.createElement("div");
  wrapper.className = "top-actions";
  items.forEach(([label, handler]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-btn";
    button.textContent = label;
    button.title = label;
    button.addEventListener("click", handler);
    wrapper.appendChild(button);
  });
  return wrapper;
}

function editStudent(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student) return;
  const name = prompt("Full name", student.name);
  if (name === null) return;
  const roll = prompt("Roll number", student.roll);
  if (roll === null) return;
  const className = prompt("Class", student.className);
  if (className === null) return;
  const motherName = prompt("Mother's name", student.motherName || "");
  if (motherName === null) return;
  student.name = name.trim() || student.name;
  student.roll = roll.trim() || student.roll;
  student.className = className.trim() || student.className;
  student.motherName = motherName.trim() || student.motherName;
  saveState("Student updated");
}

function toggleResultLock(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student) return;
  if (student.resultLocked) {
    student.resultLocked = false;
    student.financeMessage = "";
    saveState("Result released");
    return;
  }

  const message = prompt(
    "Message shown to the student",
    student.financeMessage || "Fadlan la xidhiidh xafiiska maaliyadda si natiijadaada laguugu fasaxo."
  );
  if (message === null) return;
  student.resultLocked = true;
  student.financeMessage = message.trim() || "Fadlan la xidhiidh xafiiska maaliyadda si natiijadaada laguugu fasaxo.";
  saveState("Result held");
}

function deleteStudent(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student || !confirm(`Delete ${student.name}?`)) return;
  state.students = state.students.filter((item) => item.id !== id);
  delete state.marks[id];
  saveState("Student deleted");
}

function editSubject(id) {
  const subject = state.subjects.find((item) => item.id === id);
  if (!subject) return;
  const name = prompt("Subject name", subject.name);
  if (name === null) return;
  const max = Number(prompt("Max score", subject.max));
  if (!Number.isFinite(max) || max <= 0) return showToast("Max score must be a positive number");
  subject.name = name.trim() || subject.name;
  subject.max = max;
  Object.values(state.marks).forEach((studentMarks) => {
    if (Number(studentMarks[id]) > max) studentMarks[id] = max;
  });
  saveState("Subject updated");
}

function deleteSubject(id) {
  const subject = state.subjects.find((item) => item.id === id);
  if (!subject || !confirm(`Delete ${subject.name}?`)) return;
  state.subjects = state.subjects.filter((item) => item.id !== id);
  Object.values(state.marks).forEach((studentMarks) => delete studentMarks[id]);
  saveState("Subject deleted");
}

function openSlip(studentId) {
  const student = state.students.find((item) => item.id === studentId);
  if (!student) return;
  const slip = document.getElementById("resultSlip");
  slip.innerHTML = createSlipHtml(student);
  document.body.classList.add("printing-slip");
  document.getElementById("slipModal").classList.remove("hidden");

  // Fit slip for print and start celebration/animation
  fitSlipForPrint();
  const result = calculateStudent(student);
  if (result.status === "Pass") startCelebration("pass");
  else startCelebration("fail");

  // Refit just before print, and reset after print
  window.onbeforeprint = () => fitSlipForPrint();
  window.onafterprint = () => resetSlipScale();
}

function createSlipHtml(student) {
  const result = calculateStudent(student);
  const rank = rankedStudents().findIndex((item) => item.id === student.id) + 1;
  const safeSettings = {
    schoolName: escapeHtml(state.settings.schoolName),
    academicYear: escapeHtml(state.settings.academicYear),
    principalName: escapeHtml(state.settings.principalName),
    callCenter: escapeHtml(state.settings.callCenter),
    whatsappNumber: escapeHtml(state.settings.whatsappNumber),
    contactEmail: escapeHtml(state.settings.contactEmail),
    facebookPage: escapeHtml(state.settings.facebookPage),
    schoolAddress: escapeHtml(state.settings.schoolAddress),
  };
  const logoHtml = state.settings.logoDataUrl
    ? `<img class="slip-logo" src="${state.settings.logoDataUrl}" alt="School logo" />`
    : `<img class="slip-logo" src="${DEFAULT_SCHOOL_LOGO}" alt="School logo" />`;
  const safeStudent = {
    name: escapeHtml(student.name),
    roll: escapeHtml(student.roll),
    className: escapeHtml(student.className),
    motherName: escapeHtml(student.motherName || "-"),
    financeMessage: escapeHtml(student.financeMessage || "Fadlan la xidhiidh xafiiska maaliyadda si natiijadaada laguugu fasaxo."),
  };
  const decisionText = result.status === "Pass" ? "Gudbay" : "Dhacay";
  const decisionClass = result.status === "Pass" ? "success" : "danger";
  const resultCards = student.resultLocked
    ? infoCard("Go'aanka", "Natiijo xiran", "lock", "danger")
    : infoCard("Go'aanka", decisionText, "check", decisionClass);
  const metaCards = `
    <section class="student-info-section">
      <div class="section-title-row">
        <h2>MACLUUMAADKA ARDEYGA</h2>
        <span>IMTIXAAN FINAL AH</span>
      </div>
      <div class="slip-meta">
      ${infoCard("Tira-taxanaha", safeStudent.roll, "id")}
      ${infoCard("Magaca Ardeyga", safeStudent.name, "graduate")}
      ${infoCard("Magaca Hooyada", safeStudent.motherName, "person")}
      ${infoCard("Fasalka", safeStudent.className, "school")}
      ${infoCard("Sanad Dugsiyeedka", safeSettings.academicYear, "calendar")}
      ${resultCards}
      </div>
    </section>
  `;

  const header = `
    <header class="slip-head">
      <div class="slip-title-block">
        ${logoHtml}
        <div>
          <p class="eyebrow">Natiijada Imtixaanka Nakhliga</p>
          <h2 id="slipTitle">${safeSettings.schoolName}</h2>
        <strong>Xarunta: Hodan (KPP)</strong>
        </div>
      </div>
      <div>
        <strong>Tixraac</strong>
        <p>${safeSettings.principalName}</p>
      </div>
    </header>
    ${metaCards}
  `;

  const contactPanel = `
    <section class="contact-card">
      <h2>${iconSvg("office")} Xidhiidhka Xafiiska</h2>
      <p>${iconSvg("phone")} Call center: <a href="tel:+252618118464">+252618118464</a></p>
      <p>${iconSvg("whatsapp")} WhatsApp: <a href="https://wa.me/252684613207">+252684613207</a></p>
      <p>${iconSvg("mail")} Email: <a href="mailto:taysiirfoundation2017@gmail.com">taysiirfoundation2017@gmail.com</a></p>
      <p>${iconSvg("facebook")} Facebook: <a href="https://www.facebook.com/Taysiir.Schools">Booqo barta Facebook-ga ee TIS</a></p>
    </section>
  `;

  if (student.resultLocked) {
    return `
      ${header}
      <section class="result-locked">
        <div class="finance-message">
          <h2>${iconSvg("lock")} Natiijada si ku-meel-gaar ah ayaa loo xiray</h2>
          <p>${safeStudent.financeMessage}</p>
          <p>Call center: ${safeSettings.callCenter} | WhatsApp: ${safeSettings.whatsappNumber}</p>
        </div>
      </section>
      ${contactPanel}
      <footer class="slip-print-footer">${escapeHtml(state.settings.copyrightName)} | 2026. All rights are reserved.</footer>
    `;
  }

  return `
    ${header}
    <section class="subject-result-section">
      <h2>NATIIJADA MAADOOYINKA</h2>
      <div class="subject-table">
        <div class="subject-head">
          <span>Maadada</span>
          <span>Dhibcaha</span>
          <span>Boqolkiiba</span>
          <span>Darajada</span>
          <span>Faallo</span>
        </div>
        ${state.subjects.map((subject) => subjectResultRow(student, subject)).join("")}
      </div>
      ${resultSummaryCards(result, decisionText)}
    </section>
    <section class="special-note">
      <h2>${iconSvg("light")} Faallo Gaar ah</h2>
      <p>${buildSpecialNote(safeStudent.name, rank, result)}</p>
    </section>
    <button class="download-print-btn" type="button" onclick="window.print()">${iconSvg("download")} Ladag Natiijada ama Daabac</button>
    ${contactPanel}
    <footer class="slip-print-footer">${escapeHtml(state.settings.copyrightName)} | 2026. All rights are reserved.</footer>
  `;
}

function infoCard(label, value, icon, variant = "primary") {
  return `
    <article class="info-card ${variant}">
      <span class="card-icon">${iconSvg(icon)}</span>
      <div>
        <strong>${label}</strong>
        <p>${value}</p>
      </div>
    </article>
  `;
}

function subjectResultRow(student, subject) {
  const score = getScore(student.id, subject.id);
  const percent = subject.max ? (score / subject.max) * 100 : 0;
  const width = Math.max(0, Math.min(percent, 100));
  const grade = getGrade(percent);
  const level = subjectLevel(percent);
  return `
    <div class="subject-row ${level.className}">
      <strong>${escapeHtml(subject.name)}</strong>
      <div class="subject-score-cell">
        <span>${score.toFixed(2)} / ${Number(subject.max).toFixed(2)}</span>
        <div class="score-progress"><span class="${level.className}" style="width:${width}%"></span></div>
      </div>
      <span>${percent.toFixed(1)}%</span>
      <span>${grade}</span>
      <span>${level.comment}</span>
    </div>
  `;
}

function resultSummaryCards(result, decisionText) {
  const decisionClass = result.status === "Pass" ? "summary-success" : "summary-danger";
  return `
    <div class="result-summary-grid">
      <article class="summary-card summary-blue">
        <span class="summary-ghost">${iconSvg("calculator")}</span>
        <strong>DARAJADA</strong>
        <p>${result.totalScore.toFixed(2)}</p>
      </article>
      <article class="summary-card summary-soft">
        <span class="summary-ghost">${iconSvg("chart")}</span>
        <strong>CELCELISKA</strong>
        <p>${result.average.toFixed(2)}%</p>
      </article>
      <article class="summary-card ${decisionClass}">
        <span class="summary-ghost">${iconSvg("trophy")}</span>
        <strong>GO'AANKA</strong>
        <p>${decisionText} (${result.grade})</p>
        <small>${result.status === "Pass" ? "Hambalyo!" : "Dadaal dheeraad ah"}</small>
      </article>
    </div>
  `;
}

function subjectLevel(percent) {
  if (percent >= 90) return { className: "grade-excellent", comment: "Heer Sare" };
  if (percent >= 80) return { className: "grade-very-good", comment: "Aad u Wanaagsan" };
  if (percent >= 70) return { className: "grade-good", comment: "Wanaagsan" };
  if (percent >= 60) return { className: "grade-average", comment: "Dhexdhexaad" };
  if (percent >= 50) return { className: "grade-low", comment: "Hoose" };
  return { className: "grade-fail", comment: "U baahan dadaal" };
}

function buildSpecialNote(studentName, rank, result) {
  if (rank === 1 && result.status === "Pass") {
    return `${studentName}, Hambalyo! Waxaad noqotay ardayga kaalinta 1aad ee fasalka, waxaadna muujisay dadaal iyo natiijo aad u sarreysa. Horay u soco.`;
  }
  if (result.status === "Pass") {
    return `${studentName}, Hambalyo! Waad gudubtay imtixaanka final-ka. Sii wad dadaalkaaga si aad heer ka sii wanaagsan u gaarto.`;
  }
  return `${studentName}, waxaad u baahan tahay dadaal dheeraad ah iyo la-talin waxbarasho. Fadlan la xiriir macallimiintaada si qorshe horumarineed laguu siiyo.`;
}

function iconSvg(name) {
  const icons = {
    id: '<path d="M4 5h16v14H4z"/><path d="M8 9h4M8 13h8M15 9h2"/>',
    graduate: '<path d="m3 8 9-4 9 4-9 4z"/><path d="M7 10v4c0 2 10 2 10 0v-4"/><path d="M21 8v6"/>',
    person: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    school: '<path d="M3 21h18"/><path d="M5 21V9l7-4 7 4v12"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01M15 10h.01"/>',
    calendar: '<path d="M7 3v4M17 3v4"/><path d="M4 7h16v14H4z"/><path d="M4 11h16"/>',
    calculator: '<path d="M6 3h12v18H6z"/><path d="M9 7h6"/><path d="M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/>',
    trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M5 5H3v2a4 4 0 0 0 4 4"/><path d="M19 5h2v2a4 4 0 0 1-4 4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    lock: '<path d="M7 11V8a5 5 0 0 1 10 0v3"/><path d="M5 11h14v10H5z"/>',
    light: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c1 1 1 2 1 4h6c0-2 0-3 1-4a7 7 0 0 0-4-12z"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    office: '<path d="M4 21V5h10v16"/><path d="M14 9h6v12"/><path d="M8 9h2M8 13h2M8 17h2M17 13h.01M17 17h.01"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19 19 0 0 1-8.3-3 18.5 18.5 0 0 1-5.7-5.7 19 19 0 0 1-3-8.3A2 2 0 0 1 4.8 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.8 9.6a15 15 0 0 0 5.6 5.6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 1.7 2z"/>',
    whatsapp: '<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z"/><path d="M9 8c.5 3 2.5 5 6 6"/>',
    mail: '<path d="M4 4h16v16H4z"/><path d="m4 7 8 6 8-6"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    location: '<path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12z"/><circle cx="12" cy="9" r="2"/>',
  };
  return `<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.id}</svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function findStudentByLookup(value) {
  const lookup = value.trim().toLowerCase();
  return state.students.find((student) => (
    student.roll.toLowerCase() === lookup ||
    student.id.toLowerCase() === lookup
  ));
}

function exportCsv() {
  const headers = ["Rank", "Roll", "Name", "Mother", "Class", ...state.subjects.map((subject) => subject.name), "Total", "Average", "Grade", "Decision", "Finance"];
  const lines = [headers];
  rankedStudents().forEach((student, index) => {
    lines.push([
      index + 1,
      student.roll,
      student.name,
      student.motherName || "",
      student.className,
      ...state.subjects.map((subject) => getScore(student.id, subject.id)),
      student.result.totalScore,
      student.result.average.toFixed(1),
      student.result.grade,
      student.result.status,
      student.resultLocked ? "Held" : "Clear",
    ]);
  });
  downloadFile("final-results.csv", lines.map((line) => line.map(csvCell).join(",")).join("\n"), "text/csv");
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readLogoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Logo must be an image"));
      return;
    }
    if (file.size > 750 * 1024) {
      reject(new Error("Logo image must be smaller than 750 KB"));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read logo")));
    reader.readAsDataURL(file);
  });
}

/* ============== Fit-for-print and celebration functions ============== */
/* Fit the result slip inside printable A4 width (190mm) by scaling if needed */
function fitSlipForPrint() {
  const slip = document.getElementById("resultSlip");
  if (!slip) return;

  // measure reference A4 width in pixels by creating a temporary element of width 190mm
  const ruler = document.createElement("div");
  ruler.style.width = "190mm";
  ruler.style.position = "absolute";
  ruler.style.left = "-9999px";
  document.body.appendChild(ruler);
  const pageWidthPx = ruler.getBoundingClientRect().width || 794; // fallback
  document.body.removeChild(ruler);

  // measure content width
  const contentWidth = slip.getBoundingClientRect().width;
  const scale = Math.min(1, pageWidthPx / (contentWidth || pageWidthPx));
  slip.style.transform = `scale(${scale})`;
  slip.style.transformOrigin = "top left";

  // optionally reduce font-size slightly when scaling is small to improve readability
  slip.style.fontSize = scale < 0.86 ? `${Math.max(10, 12 * scale)}px` : "";
}

/* Reset scaling after print/closing */
function resetSlipScale() {
  const slip = document.getElementById("resultSlip");
  if (!slip) return;
  slip.style.transform = "";
  slip.style.fontSize = "";
}

let celebrationTimeout;
function startCelebration(type = "pass", duration = 2200) {
  stopCelebration();
  const slip = document.getElementById("resultSlip");
  if (!slip) return;

  // add class to slip-head for pass/fail effects
  const head = slip.querySelector(".slip-head");
  if (head) {
    head.classList.add(type === "pass" ? "celebrate-pass" : "celebrate-fail");
  }

  // only show confetti for pass
  if (type === "pass") {
    const overlay = document.createElement("div");
    overlay.className = "celebration-overlay";
    overlay.id = "celebrationOverlay";
    slip.appendChild(overlay);

    const colors = ["#22c55e", "#f59e0b", "#087df5", "#f97316", "#ca8a04", "#28a745", "#ff3b3b"];
    const pieces = 30;
    for (let i = 0; i < pieces; i++) {
      const el = document.createElement("div");
      el.className = "confetti";
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${-20 - Math.random() * 10}%`;
      el.style.background = colors[i % colors.length];
      el.style.transform = `translateY(-20vh) rotate(${Math.random() * 360}deg)`;
      el.style.opacity = "0";
      // staggered durations/delays for more natural effect
      el.style.animationDelay = `${Math.random() * 400}ms`;
      el.style.width = `${8 + Math.floor(Math.random() * 8)}px`;
      el.style.height = `${10 + Math.floor(Math.random() * 12)}px`;
      overlay.appendChild(el);
    }
  }

  celebrationTimeout = setTimeout(() => stopCelebration(), duration);
}

function stopCelebration() {
  clearTimeout(celebrationTimeout);
  const slip = document.getElementById("resultSlip");
  if (!slip) return;
  const head = slip.querySelector(".slip-head");
  if (head) {
    head.classList.remove("celebrate-pass", "celebrate-fail");
  }
  const overlay = document.getElementById("celebrationOverlay");
  if (overlay) overlay.remove();
}

/* ============== End fit/celebration ============== */

document.querySelectorAll(".nav-link").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.getElementById("studentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const student = {
    id: crypto.randomUUID(),
    name: document.getElementById("studentName").value.trim(),
    roll: document.getElementById("studentRoll").value.trim(),
    className: document.getElementById("studentClass").value.trim(),
    motherName: document.getElementById("studentMother").value.trim(),
    resultLocked: false,
    financeMessage: "",
  };
  if (state.students.some((item) => item.roll.toLowerCase() === student.roll.toLowerCase())) {
    return showToast("Roll number already exists");
  }
  state.students.push(student);
  state.marks[student.id] = {};
  event.target.reset();
  saveState("Student added");
});

document.getElementById("subjectForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const subject = {
    id: crypto.randomUUID(),
    name: document.getElementById("subjectName").value.trim(),
    max: Number(document.getElementById("subjectMax").value),
  };
  state.subjects.push(subject);
  event.target.reset();
  document.getElementById("subjectMax").value = 100;
  saveState("Subject added");
});

document.getElementById("marksForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const studentId = document.getElementById("resultStudentSelect").value;
  if (!studentId) return;
  state.marks[studentId] = state.marks[studentId] || {};
  [...event.target.querySelectorAll("input[data-subject-id]")].forEach((input) => {
    const subject = state.subjects.find((item) => item.id === input.dataset.subjectId);
    const score = Math.max(0, Math.min(Number(input.value), Number(subject.max)));
    state.marks[studentId][subject.id] = score;
  });
  saveState("Marks saved");
});

document.getElementById("schoolForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = {
    ...state.settings,
    schoolName: document.getElementById("schoolName").value.trim(),
    academicYear: document.getElementById("academicYear").value.trim(),
    principalName: document.getElementById("principalName").value.trim(),
    callCenter: document.getElementById("callCenter").value.trim(),
    whatsappNumber: document.getElementById("whatsappNumber").value.trim(),
    contactEmail: document.getElementById("contactEmail").value.trim(),
    facebookPage: document.getElementById("facebookPage").value.trim(),
    schoolAddress: document.getElementById("schoolAddress").value.trim(),
    adminUsername: document.getElementById("settingsAdminUsername").value.trim(),
    adminPassword: document.getElementById("settingsAdminPassword").value,
  };
  saveState("Settings saved");
});

document.querySelectorAll(".portal-tab").forEach((button) => {
  button.addEventListener("click", () => setPortalTab(button.dataset.portal));
});
document.getElementById("adminLoginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;
  if (username !== state.settings.adminUsername || password !== state.settings.adminPassword) {
    return showToast("Khaladaad ayaa jira!");
  }
  event.target.reset();
  showAdminApp();
});
document.getElementById("studentLookupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const student = findStudentByLookup(document.getElementById("studentLookupId").value);
  if (!student) return showToast("Cilad baa jidha!");
  showStudentPortal(student.id);
});
document.getElementById("logoutBtn").addEventListener("click", () => showAuth("admin"));
document.getElementById("studentBackBtn").addEventListener("click", () => showAuth("student"));
document.getElementById("studentPrintBtn").addEventListener("click", () => window.print());
document.getElementById("schoolLogoInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    state.settings.logoDataUrl = await readLogoFile(file);
    saveState("Logo saved");
  } catch (error) {
    showToast(error.message);
  }
  event.target.value = "";
});
document.getElementById("removeLogoBtn").addEventListener("click", () => {
  state.settings.logoDataUrl = "";
  saveState("Logo removed");
});

/* System logo handlers (for admin/auth brand) */
const systemLogoInput = document.getElementById("systemLogoInput");
if (systemLogoInput) {
  systemLogoInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state.settings.systemLogoDataUrl = await readLogoFile(file);
      saveState("System logo saved");
    } catch (error) {
      showToast(error.message);
    }
    event.target.value = "";
  });
}
const removeSystemLogoBtn = document.getElementById("removeSystemLogoBtn");
if (removeSystemLogoBtn) {
  removeSystemLogoBtn.addEventListener("click", () => {
    state.settings.systemLogoDataUrl = "";
    saveState("System logo removed");
  });
}

document.getElementById("resultStudentSelect").addEventListener("change", renderResults);
document.getElementById("studentSearch").addEventListener("input", renderStudents);
document.getElementById("reportSearch").addEventListener("input", renderReports);
document.getElementById("exportBtn").addEventListener("click", exportCsv);
document.getElementById("printBtn").addEventListener("click", () => window.print());
document.getElementById("closeSlipBtn").addEventListener("click", () => {
  stopCelebration();
  resetSlipScale();
  document.getElementById("slipModal").classList.add("hidden");
  document.body.classList.remove("printing-slip");
});
document.getElementById("printSlipBtn").addEventListener("click", () => window.print());
document.getElementById("downloadJsonBtn").addEventListener("click", () => {
  downloadFile("resultpro-backup.json", JSON.stringify(state, null, 2), "application/json");
});
document.getElementById("restoreInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    state = normalizeState(JSON.parse(await file.text()));
    saveState("Backup restored");
  } catch {
    showToast("Invalid backup file");
  }
  event.target.value = "";
});
document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all data to demo records?")) return;
  state = structuredClone(demoData);
  saveState("Demo data restored");
});

if (sessionStorage.getItem(AUTH_SESSION_KEY) === "true") {
  showAdminApp();
} else {
  showAuth("admin");
}