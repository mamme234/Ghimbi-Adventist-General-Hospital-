# Frontend deployment notes (Vercel)

This frontend is a static multi-page site located in the `frontend/` directory. Use Vercel to deploy quickly.

1) Import project into Vercel
- New Project -> Import Git Repository -> select mamme234/Ghimbi-Adventist-General-Hospital-
- During import set:
  - Root Directory: frontend
  - Framework Preset: Other (Static Site)
  - Build Command: (leave blank)
  - Output Directory: (leave blank)

2) Environment variables (only if your client JS reads them)
- If your client expects an API base URL variable, set it in Vercel. Example names:
  - API_BASE_URL = https://<render-backend-url>
  - NEXT_PUBLIC_API_URL = https://<render-backend-url>

3) Proxying /api (optional)
- The repository contains frontend/vercel.json with a rewrite that proxies `/api/*` to the Render backend.
- If you keep the rewrite, call `/api/...` from the client and you won't need to set the backend URL in the client.

4) Service Worker & PWA
- Verify `sw.js` scope and manifest.json configuration after deployment.
- Check caching strategy to avoid serving stale content during updates.

5) Verify
- Visit the deployed Vercel URL and confirm index.html loads with assets.
- Use browser devtools network tab to confirm API requests route to `/api/...` and don't show CORS errors.

