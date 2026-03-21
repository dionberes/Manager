# Manager Time App

Kleine Zeiterfassungs-App mit Node/Express Backend.

## Lokal starten

```bash
npm install
npm start
```

Dann im Browser: `http://localhost:3000`

## Direkt auf GitHub hochladen

```bash
git init
git add .
git commit -m "Initial app with backend persistence"
git branch -M main
git remote add origin <DEIN_GITHUB_REPO_URL>
git push -u origin main
```

## Online deployen (Render)

1. Repo auf GitHub erstellen und pushen.
2. Auf [Render](https://render.com) einloggen.
3. `New +` -> `Blueprint` wählen.
4. GitHub Repo verbinden.
5. Render liest automatisch `render.yaml` und startet den Service.

Danach bekommst du eine URL wie `https://dein-app-name.onrender.com`.
