# Frontend (React + Vite)

This folder is the React 19 + Vite 8 + Tailwind CSS 4 single-page app for
Jan & Jimels Party Needs.

- Full frontend documentation: `../docs/05-FRONTEND.md`
- Project entry guide for AI agents: `../AGENTS.md`
- Theming (navy/gold tokens): `../docs/07-DESIGN-SYSTEM.md`
- PDF generator: `../docs/06-PDF-GENERATION.md`

## Run

```powershell
npm.cmd install
# NOTE: the parent folder name contains an apostrophe, so npm scripts fail on
# Windows — run vite directly:
node node_modules\vite\bin\vite.js          # dev server on 5173 (proxies /api)
node node_modules\vite\bin\vite.js build    # production build → ../backend/frontend_dist
node node_modules\oxlint\bin\oxlint src     # lint
```
