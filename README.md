# FinancePro (React + Vite + React Bootstrap)

    npm install
    npm run dev      # http://localhost:5173

- Navigation and page definitions live in `src/nav.js` (add a page there and it gets a route + sidebar entry).
- `src/pages/ListPage.jsx` renders every page; pass `rows` to show data.
- `src/lib/api/client.js` is the axios instance; it sends the login token on every request.

## Backend: alphalist-api

Login and the Alphalist screens use **alphalist-api** (`C:\Users\norma\Downloads\DAT\alphalist-api`). Start it first:
double-click `Start Alphalist API.bat` there, or run `php artisan serve --host=127.0.0.1 --port=8791`.
Vite proxies `/api` to port 8791, so no CORS setup is needed. To point at another server, set `VITE_API_URL`.

- **Sign in:** use an alphalist-api user (email or username). The first one is `ADMIN_USERNAME` / `ADMIN_PASSWORD` in that API's `.env`.
- **The API layer:** `src/lib/api/alphalist.js` adapts the API's HRIS-style endpoints (`isSuccess` responses,
  `create/…`, `update/…/{id}`, `…/{id}/archive`) to what the screens use.
- **Other pages:** the accounting pages (Sales, Purchases, Journals…) still use local demo data.
- **Retired backend:** `../laravel-backend` is no longer used.

Screens:
- **Withholding Agents** and **TIN Library**
- **QAP Entry**: 1601-EQ and 1601-FQ lines, type-a-TIN auto-fill, CSV import and template, DAT preview and download, send to Alphalist
- **1604-E Annual** and **1604-F Annual**
- **DAT Tools**: Analyze, Compare, Format Spec
- **BIR Alphalist**: status, upload a DAT, backups and restore, send history
