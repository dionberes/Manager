const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");
const totalTimeDisplay = document.getElementById("total-time");
const overtimeDisplay = document.getElementById("isOvertime");
const weekTable = document.getElementById("week-table");
const allTimeDisplay = document.querySelector(".all-time");
const weekOvertimeDisplay = document.querySelector(".week-overtime");
const saveEntryBtn = document.getElementById("save-entry");
const workProgressEl = document.getElementById("work-progress");
const weekdayCheckboxes = document.querySelectorAll(".weekday-checkbox");

const ctx = document.getElementById("myCustomChart").getContext("2d");
const weekdayConfig = [
    { full: 'Montag', short: 'Mo' },
    { full: 'Dienstag', short: 'Di' },
    { full: 'Mittwoch', short: 'Mi' },
    { full: 'Donnerstag', short: 'Do' },
    { full: 'Freitag', short: 'Fr' },
    { full: 'Samstag', short: 'Sa' },
    { full: 'Sonntag', short: 'So' }
];

const gradient = ctx.createLinearGradient(0, 0, 0, 200);
gradient.addColorStop(0, '#ff59596d');
gradient.addColorStop(1, '#ff595900');

function getWeekdayIndex(date) {
    const jsDay = date.getDay();
    return (jsDay + 6) % 7; // Monday = 0
}

function getWeekStart(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - getWeekdayIndex(copy));
    return copy;
}

function isSameWeek(dateA, dateB) {
    return getWeekStart(dateA).getTime() === getWeekStart(dateB).getTime();
}

function buildWeeklyChartData(entries) {
    const values = selectedWeekdays.map(() => 0);
    const today = new Date();

    entries.forEach((entry) => {
        const entryDate = new Date(entry.createdAt);
        if (!isSameWeek(entryDate, today)) return;
        if (!selectedWeekdays.includes(entry.weekday)) return;
        if (!Number.isFinite(entry.diff)) return;

        const index = selectedWeekdays.indexOf(entry.weekday);
        if (index < 0) return;

        values[index] += entry.diff / 60;
    });

    return values;
}

function updateWeekChart(entries) {
    weekChart.data.labels = getSelectedWeekdayShortLabels();
    weekChart.data.datasets[0].data = buildWeeklyChartData(entries);
    weekChart.update();
}

const chartConfig = {
    type: 'line',
    data: {
        labels: weekdayConfig.map((item) => item.short),
        datasets: [{
            label: 'Aktivität',
            data: [0, 0, 0, 0, 0, 0, 0],
            fill: true,
            backgroundColor: gradient,
            borderColor: '#FF5959',
            borderWidth: 4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#FF5959',
            pointBorderWidth: 1,
            pointRadius: 5,
            pointHoverRadius: 8,
            tension: .2
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { display: true },
                ticks: {
                    color: 'fddcdc',
                }
            },
            y: {
                display: false,
                suggestedMin: 0,
                suggestedMax: 10
            }
        },
        layout: {
            padding: {
                top: 20
            }
        }
    },
    plugins: [{
        id: 'customCircle',
        afterDraw: (chart) => {
            const { ctx, data, scales: { x, y } } = chart;
            const lastPointIndex = data.datasets[0].data.length - 1;
            const xPos = x.getPixelForValue(lastPointIndex);
            const yPos = y.getPixelForValue(data.datasets[0].data[lastPointIndex]);

            ctx.save();
            ctx.beginPath();
            ctx.arc(xPos, yPos, 12, 0, 2 * Math.PI);
            ctx.strokeStyle = 'transparent';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }]
};

const weekChart = new Chart(ctx, chartConfig);

const STORAGE_KEY = "manager-time-entries-v1";
const SETTINGS_KEY = "manager-settings-v1";

const settingsModal = document.getElementById("settings-modal");
const settingsBackdrop = document.getElementById("settings-modal-backdrop");
const openSettingsBtn = document.getElementById("open-settings");
const targetHoursInput = document.getElementById("target-hours-input");
const settingsSaveBtn = document.getElementById("settings-save");
const settingsCancelBtn = document.getElementById("settings-cancel");

const DEFAULT_WORKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

let selectedWeekdays = [...DEFAULT_WORKDAYS];

const DEFAULT_TARGET_HOURS = 7;
const MIN_TARGET_HOURS = 0.25;
const MAX_TARGET_HOURS = 24;

let totalMinutesSum = 0;
let currentDiff = 0;
let targetHours = DEFAULT_TARGET_HOURS;

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { targetHours: DEFAULT_TARGET_HOURS, selectedWeekdays: [...DEFAULT_WORKDAYS] };
        const parsed = JSON.parse(raw);
        let h = Number(parsed.targetHours);
        if (!Number.isFinite(h) || h <= 0) h = DEFAULT_TARGET_HOURS;
        h = Math.min(MAX_TARGET_HOURS, Math.max(MIN_TARGET_HOURS, h));

        const weekdays = Array.isArray(parsed.selectedWeekdays)
            ? parsed.selectedWeekdays.filter((day) => weekdayConfig.some((item) => item.full === day))
            : [...DEFAULT_WORKDAYS];

        return {
            targetHours: h,
            selectedWeekdays: weekdays.length > 0 ? weekdays : [...DEFAULT_WORKDAYS]
        };
    } catch {
        return { targetHours: DEFAULT_TARGET_HOURS, selectedWeekdays: [...DEFAULT_WORKDAYS] };
    }
}

function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getTargetMinutes() {
    return targetHours * 60;
}

function getSelectedWeekdayShortLabels() {
    return selectedWeekdays.map((fullDay) => {
        const item = weekdayConfig.find((d) => d.full === fullDay);
        return item ? item.short : fullDay.slice(0, 2);
    });
}

function applySelectedWeekdayCheckboxes() {
    weekdayCheckboxes.forEach((checkbox) => {
        checkbox.checked = selectedWeekdays.includes(checkbox.value);
    });
}

function applyTargetToProgressUi() {
    workProgressEl.max = targetHours;
    workProgressEl.min = 0;
}

function openSettingsModal() {
    targetHoursInput.value = String(targetHours);
    applySelectedWeekdayCheckboxes();
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

    const selected = Array.from(weekdayCheckboxes)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);

    selectedWeekdays = selected.length > 0 ? selected : [...DEFAULT_WORKDAYS];

    saveSettings({ targetHours: targetHours, selectedWeekdays });
    applyTargetToProgressUi();
    closeSettingsModal();
    loadEntries();
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

    if (weekOvertimeDisplay) {
        const activeDays = selectedWeekdays.length;
        const weeklyTargetMinutes = targetHours * activeDays * 60;
        const weekDiff = totalMinutesSum - weeklyTargetMinutes;
        const absHours = Math.floor(Math.abs(weekDiff) / 60);
        const absMinutes = Math.abs(weekDiff) % 60;
        const sign = weekDiff >= 0 ? "+" : "-";

        weekOvertimeDisplay.textContent = `Überstunden diese Woche: ${sign}${String(absHours).padStart(2, "0")}:${String(absMinutes).padStart(2, "0")}`;
        weekOvertimeDisplay.style.color = weekDiff >= 0 ? "green" : "red";
    }
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
    deleteBtn.textContent = "×";
    deleteBtn.classList.add("btn");
    deleteBtn.onclick = function () {
        const entries = loadFromStorage().filter((e) => e.id !== entry.id);
        saveToStorage(entries);
        loadEntries();
    };

    tableDiv.appendChild(textSpan);
    tableDiv.appendChild(deleteBtn);
    weekTable.appendChild(tableDiv);
}

function loadEntries() {
    const entries = loadFromStorage();
    const currentWeekEntries = entries.filter((entry) => isSameWeek(new Date(entry.createdAt), new Date()));
    const visibleEntries = currentWeekEntries.filter((entry) => selectedWeekdays.includes(entry.weekday));

    weekTable.innerHTML = "";
    totalMinutesSum = 0;

    visibleEntries.forEach((entry) => {
        renderEntry(entry);
        totalMinutesSum += entry.diff;
    });

    updateAllTimeDisplay();
    updateWeekChart(entries);
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

    loadEntries();

    startTimeInput.value = "";
    endTimeInput.value = "";
    updatePreview();
}

const settings = loadSettings();
selectedWeekdays = settings.selectedWeekdays;
targetHours = settings.targetHours;
applyTargetToProgressUi();

startTimeInput.addEventListener("change", updatePreview);
endTimeInput.addEventListener("change", updatePreview);
saveEntryBtn.addEventListener("click", saveEntry);

if (openSettingsBtn) openSettingsBtn.addEventListener("click", openSettingsModal);
if (settingsCancelBtn) settingsCancelBtn.addEventListener("click", closeSettingsModal);
if (settingsBackdrop) settingsBackdrop.addEventListener("click", closeSettingsModal);
if (settingsSaveBtn) settingsSaveBtn.addEventListener("click", persistTargetFromInput);

targetHoursInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") persistTargetFromInput();
    if (e.key === "Escape") closeSettingsModal();
});

loadEntries();
updatePreview();
