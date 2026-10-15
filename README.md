# FinancePro (React + Vite + React Bootstrap)

    npm install
    npm run dev      # http://localhost:5173

- Navigation and page definitions live in `src/nav.js` (add a page there and it gets a route + sidebar entry).
- `src/pages/ListPage.jsx` renders every page; pass `rows` to show data.
- `src/api/client.js` is the axios instance for the Laravel API (unused for now; set `VITE_API_URL`).

## Alphalist screens

Needs the Laravel API in `../laravel-backend` running on port 8790 (`php artisan serve --port=8790`).
Vite proxies `/api` to it, so no CORS setup is needed. To point at another server, set `VITE_API_URL`.

Screens: Withholding Agents, TIN Library, QAP Entry (lines, CSV import/template, DAT preview/download, send to Alphalist),
1604-F Annual, DAT Tools (Analyze, Compare, Format Spec), BIR Alphalist (status, backups/restore, send history).
