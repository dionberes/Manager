const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(__dirname));

async function readEntries() {
    try {
        const raw = await fs.readFile(DB_PATH, "utf8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

async function writeEntries(entries) {
    await fs.writeFile(DB_PATH, JSON.stringify(entries, null, 2), "utf8");
}

app.get("/api/entries", async (_req, res) => {
    const entries = await readEntries();
    res.json(entries);
});

app.post("/api/entries", async (req, res) => {
    const { start, end, diff, weekday } = req.body;
    if (!start || !end || typeof diff !== "number" || !weekday) {
        return res.status(400).json({ error: "Invalid entry payload" });
    }

    const entries = await readEntries();
    const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        start,
        end,
        diff,
        weekday,
        createdAt: new Date().toISOString()
    };
    entries.push(entry);
    await writeEntries(entries);
    return res.status(201).json(entry);
});

app.delete("/api/entries/:id", async (req, res) => {
    const entries = await readEntries();
    const nextEntries = entries.filter((entry) => entry.id !== req.params.id);

    if (nextEntries.length === entries.length) {
        return res.status(404).json({ error: "Entry not found" });
    }

    await writeEntries(nextEntries);
    return res.status(204).send();
});

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
