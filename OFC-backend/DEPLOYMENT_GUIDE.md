# Backend Deployment (Free Tier)

Below are two free options that work well with this Node backend. Both deploy directly from your GitHub repo.

## Option A: Railway (free monthly credits)

1) Login to https://railway.app and connect your GitHub account.
2) New Project → Deploy from GitHub Repo → select `Obsidian-File-Core`.
3) Root Directory: `OFC-backend`
4) Build Command: `npm install`
5) Start Command: `node index.js`
6) Add Environment Variables in Railway project settings:
   - `MONGO_URI` = {{MONGO_URI}}
   - Any others you use (e.g., `JWT_SECRET`, `REDIS_URL` if applicable)
7) Click Deploy. Railway will build and start your service.

Notes:
- Railway free tier provides monthly credits; small apps can run within these limits.

## Option B: Koyeb (free hobby instance)

1) Login to https://www.koyeb.com and connect your GitHub account.
2) Create an App → Deploy from Git → Choose `Obsidian-File-Core` → Branch `main`.
3) Select the `OFC-backend` path.
4) Set the buildpack to NodeJS (auto-detected) or use the Dockerfile (provided here).
5) Environment variables:
   - `MONGO_URI` = {{MONGO_URI}}
6) Expose port `5000` (the app listens on PORT=5000).
7) Deploy.

## CORS / Frontend URL
If you deploy the frontend to GitHub Pages, your public site URL will be:
`https://RamaKrishnaReddyIndela.github.io/Obsidian-File-Core`

Make sure your backend CORS config allows this origin, for example in `OFC-backend/index.js`:

```js path=null start=null
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5001',
    'https://RamaKrishnaReddyIndela.github.io'
  ],
  credentials: true,
}));
```

Adjust as needed if your frontend domain differs.