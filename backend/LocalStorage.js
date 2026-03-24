const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");
const totalTimeDisplay = document.getElementById("total-time");
const overtimeDisplay = document.getElementById("isOvertime");
const weekTable = document.getElementById("week-table");
const allTimeDisplay = document.querySelector(".all-time");
const saveEntryBtn = document.getElementById("save-entry");
const workProgressEl = document.getElementById("work-progress");

const STORAGE_KEY = "manager-time-entries-v1";
const SETTINGS_KEY = "manager-settings-v1";

const settingsModal = document.getElementById("settings-modal");
const settingsBackdrop = document.getElementById("settings-modal-backdrop");
const openSettingsBtn = document.getElementById("open-settings");
const targetHoursInput = document.getElementById("target-hours-input");
const settingsSaveBtn = document.getElementById("settings-save");
const settingsCancelBtn = document.getElementById("settings-cancel");

const DEFAULT_TARGET_HOURS = 7;
const MIN_TARGET_HOURS = 0.25;
const MAX_TARGET_HOURS = 24;

let totalMinutesSum = 0;
let currentDiff = 0;
let targetHours = DEFAULT_TARGET_HOURS;

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { targetHours: DEFAULT_TARGET_HOURS };
        const parsed = JSON.parse(raw);
        let h = Number(parsed.targetHours);
        if (!Number.isFinite(h) || h <= 0) h = DEFAULT_TARGET_HOURS;
        h = Math.min(MAX_TARGET_HOURS, Math.max(MIN_TARGET_HOURS, h));
        return { targetHours: h };
    } catch {
        return { targetHours: DEFAULT_TARGET_HOURS };
    }
}

function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getTargetMinutes() {
    return targetHours * 60;
}

function applyTargetToProgressUi() {
    workProgressEl.max = targetHours;
    workProgressEl.min = 0;
}

function openSettingsModal() {
    targetHoursInput.value = String(targetHours);
    settingsModal.hidden = false;
    targetHoursInput.focus();
}

function closeSettingsModal() {
    settingsModal.hidden = true;
}

function persistTargetFromInput() {
    let h = parseFloat(targetHoursInput.value);
    if (!Number.isFinite(h)) h = DEFAULT_TARGET_HOURS;
    h = Math.min(MAX_TARGET_HOURS, Math.max(MIN_TARGET_HOURS, h));
    targetHours = h;
    saveSettings({ targetHours: targetHours });
    applyTargetToProgressUi();
    closeSettingsModal();
    updatePreview();
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveToStorage(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function parseDiffFromTimes(start, end) {
    const s = start.split(":");
    const e = end.split(":");
    const startMinutes = parseInt(s[0], 10) * 60 + parseInt(s[1], 10);
    let endMinutes = parseInt(e[0], 10) * 60 + parseInt(e[1], 10);

    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }
    return endMinutes - startMinutes;
}

function formatDiff(diff) {
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} h`;
}

function updateAllTimeDisplay() {
    const h = Math.floor(totalMinutesSum / 60);
    const m = totalMinutesSum % 60;
    allTimeDisplay.textContent = `${h}h ${String(m).padStart(2, "0")}m`;
}

function updatePreview() {
    const start = startTimeInput.value;
    const end = endTimeInput.value;
    const targetMinutes = getTargetMinutes();

    if (!start || !end) {
        totalTimeDisplay.textContent = "00:00";
        overtimeDisplay.textContent = "+00:00";
        overtimeDisplay.style.color = "#bdbdbd";
        currentDiff = 0;
        workProgressEl.value = targetHours;
        return;
    }

    currentDiff = parseDiffFromTimes(start, end);
    totalTimeDisplay.textContent = formatDiff(currentDiff);

    const diffOvertime = currentDiff - targetMinutes;
    const oHours = Math.floor(Math.abs(diffOvertime) / 60);
    const oMinutes = Math.abs(diffOvertime) % 60;
    const sign = diffOvertime >= 0 ? "+" : "-";

    overtimeDisplay.style.color = diffOvertime >= 0 ? "green" : "red";
    overtimeDisplay.textContent = `${sign}${String(oHours).padStart(2, "0")}:${String(oMinutes).padStart(2, "0")}`;

    const remainingMinutes = Math.max(0, targetMinutes - currentDiff);
    workProgressEl.value = remainingMinutes / 60;
}

function renderEntry(entry) {
    const tableDiv = document.createElement("div");
    tableDiv.classList.add("table");
    tableDiv.id = `entry-${entry.id}`;

    const textSpan = document.createElement("span");
    textSpan.textContent = `${entry.weekday}: ${formatDiff(entry.diff)}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.classList.add("btn");
    deleteBtn.onclick = function () {
        const entries = loadFromStorage().filter((e) => e.id !== entry.id);
        saveToStorage(entries);
        totalMinutesSum -= entry.diff;
        updateAllTimeDisplay();
        tableDiv.remove();
    };

    tableDiv.appendChild(textSpan);
    tableDiv.appendChild(deleteBtn);
    weekTable.appendChild(tableDiv);
}

function loadEntries() {
    const entries = loadFromStorage();
    weekTable.innerHTML = "";
    totalMinutesSum = 0;

    entries.forEach((entry) => {
        renderEntry(entry);
        totalMinutesSum += entry.diff;
    });

    updateAllTimeDisplay();
}

function saveEntry() {
    const start = startTimeInput.value;
    const end = endTimeInput.value;
    if (!start || !end) {
        return;
    }

    const diff = parseDiffFromTimes(start, end);
    const weekday = new Date().toLocaleDateString("de-DE", { weekday: "long" });

    const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        start,
        end,
        diff,
        weekday,
        createdAt: new Date().toISOString()
    };

    const entries = loadFromStorage();
    entries.push(entry);
    saveToStorage(entries);

    renderEntry(entry);
    totalMinutesSum += entry.diff;
    updateAllTimeDisplay();

    startTimeInput.value = "";
    endTimeInput.value = "";
    updatePreview();
}

targetHours = loadSettings().targetHours;
applyTargetToProgressUi();

startTimeInput.addEventListener("change", updatePreview);
endTimeInput.addEventListener("change", updatePreview);
saveEntryBtn.addEventListener("click", saveEntry);

openSettingsBtn.addEventListener("click", openSettingsModal);
settingsCancelBtn.addEventListener("click", closeSettingsModal);
settingsBackdrop.addEventListener("click", closeSettingsModal);
settingsSaveBtn.addEventListener("click", persistTargetFromInput);

targetHoursInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") persistTargetFromInput();
    if (e.key === "Escape") closeSettingsModal();
});

loadEntries();
updatePreview();
