const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");
const totalTimeDisplay = document.getElementById("total-time");
const overtimeDisplay = document.getElementById("isOvertime");
const weekTable = document.getElementById("week-table");
const allTimeDisplay = document.querySelector(".all-time");
const saveEntryBtn = document.getElementById("save-entry");

const STORAGE_KEY = "manager-time-entries-v1";

let totalMinutesSum = 0;
let currentDiff = 0;

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

    if (!start || !end) {
        totalTimeDisplay.textContent = "00:00";
        overtimeDisplay.textContent = "+00:00";
        overtimeDisplay.style.color = "#bdbdbd";
        currentDiff = 0;
        return;
    }

    currentDiff = parseDiffFromTimes(start, end);
    totalTimeDisplay.textContent = formatDiff(currentDiff);

    const diffOvertime = currentDiff - (7 * 60);
    const oHours = Math.floor(Math.abs(diffOvertime) / 60);
    const oMinutes = Math.abs(diffOvertime) % 60;
    const sign = diffOvertime >= 0 ? "+" : "-";

    overtimeDisplay.style.color = diffOvertime >= 0 ? "green" : "red";
    overtimeDisplay.textContent = `${sign}${String(oHours).padStart(2, "0")}:${String(oMinutes).padStart(2, "0")}`;
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

startTimeInput.addEventListener("change", updatePreview);
endTimeInput.addEventListener("change", updatePreview);
saveEntryBtn.addEventListener("click", saveEntry);
loadEntries();