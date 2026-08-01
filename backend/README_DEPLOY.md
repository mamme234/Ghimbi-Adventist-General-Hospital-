# Deployment instructions for the Backend (Render)

This document explains how to deploy the backend service to Render and the required environment variables.

1) Render setup
- Create a new Web Service on Render
- Connect your GitHub repository: mamme234/Ghimbi-Adventist-General-Hospital-
- Branch: main
- Root directory: backend
- Runtime: Node
- Region: select nearest (e.g., oregon)
- Build Command: npm ci
- Start Command: npm start
- Health Check Path: /health
- Auto Deploy: enabled (optional)

2) Environment variables (set these via Render Dashboard -> Environment)
- NODE_ENV=production
- PORT=5000
- FRONTEND_URL=https://ghimbi-adventist-general-hospital-2.vercel.app
- MONGO_URI (MongoDB Atlas connection string)
- JWT_SECRET (generate a strong random value)
- REFRESH_TOKEN_SECRET (generate a strong random value)
- ADMIN_EMAIL, ADMIN_PASSWORD (initial admin credentials)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (if using email)
- STORAGE_PROVIDER, STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY (if using S3)
- PAYMENT_PROVIDER, PAYMENT_PUBLIC_KEY, PAYMENT_SECRET_KEY, PAYMENT_WEBHOOK_SECRET (if using payments)
- SMS_PROVIDER, SMS_API_KEY, SMS_API_SECRET, SMS_SENDER (if using SMS)

3) Optional deploy-time scripts
- The repository contains scripts/migrate.js and scripts/createIndexes.js stubs.
- If you implement migration/index scripts, the package.json includes a "render:predeploy" script that runs these before deployment.
- Alternatively, run migrations manually after first deploy.

4) Database (MongoDB Atlas)
- Create a dedicated MongoDB Atlas cluster and a database user with a strong password.
- Set MONGO_URI to the connection string (SRV) in Render environment variables.
- Configure IP Access List in Atlas to allow Render's outbound IPs or allow access from anywhere (0.0.0.0/0) if needed temporarily.

5) Websockets (Socket.IO)
- The server uses Socket.IO and should work on Render Web Services. Ensure server binds to 0.0.0.0 and uses process.env.PORT.
- If using Vercel proxy rewrites, prefer direct backend Socket.IO connection to the Render URL.

6) Health checks & logs
- Verify /health returns status: healthy
- Check Render logs for errors connecting to Mongo or missing env vars.

7) Backups
- Use MongoDB Atlas managed backups or implement backup.js and schedule backups externally.

If you want me to open a PR with these files, or to modify additional files (README, nginx.conf, etc.), tell me and I will continue.
