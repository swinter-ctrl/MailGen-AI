# AI Cold Email Generator (Monorepo)

A fully dockerized full-stack MERN application that uses AI to generate customized cold emails, LinkedIn DMs, and follow-up emails based on user prompts.

## Features Added
- **Monorepo setup**: Single `package.json` to install and run the entire stack concurrently.
- **Docker**: Multi-stage production image (client build + slim Node runtime) and Docker Compose with MongoDB.
- **CI/CD via GitHub Actions**: Build, Docker smoke test against MongoDB, image publish to GHCR, and Render deploys only after checks pass.

---

## 🚀 How to Run Locally (Using Concurrently)

**1. Install all dependencies**  
Run this command from the root folder (it installs root, server, and client Node dependencies):
\`\`\`bash
npm run install-all
\`\`\`

**2. Setup your Environment Variables**  
- Create a `.env` in the `/server` folder based on `.env.example`. Make sure your `MONGO_URI` is correctly pointing to your preferred MongoDB instance.  
- Create a `.env` in the `/client` folder with: `VITE_API_URL=http://localhost:5000/api`

**3. Run the Monorepo**  
Start both the Frontend and Backend simultaneously:
\`\`\`bash
npm run dev
\`\`\`
The GUI will be on `http://localhost:5173` and the API firmly rooted at `http://localhost:5000`.

---

## 🐳 How to Run with Docker

The app ships as a single production image built with a multi-stage `Dockerfile`:
1. **Stage 1** builds the React client with Vite.
2. **Stage 2** installs only the server's production dependencies and serves both the API and the built client from one Node container (runs as a non-root user, with a built-in health check).

`docker-compose.yml` runs that image alongside MongoDB 7.

**Steps:**
1. Make sure Docker Desktop is running.
2. Create `server/.env` (see `SETUP_AND_DEPLOYMENT.md`). Compose reads `GROQ_API_KEY`, `JWT_SECRET`, `EMAIL_USER` and `EMAIL_PASS` from it and points `MONGODB_URI` at the bundled Mongo container automatically.
3. Build and start:
   ```bash
   docker compose up --build
   ```
4. Open http://localhost:5000. Health check: http://localhost:5000/api/health

To stop: `docker compose down` (add `-v` to also delete the database volume).

---

## 🔁 CI/CD (GitHub Actions Pipeline)

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

| Job | What it does |
|-----|--------------|
| **Build & check** | Installs client and server dependencies with `npm ci`, syntax-checks the server, and builds the client with Vite. |
| **Docker build & smoke test** | Builds the production image, starts it against a real MongoDB service container, and checks that `/api/health` reports the DB connected, the frontend is served, and unknown API routes return 404. |
| **Publish** (main only) | Pushes the image to GitHub Container Registry as `ghcr.io/<owner>/mailgen-ai:latest` and `:<commit-sha>`. |

**Continuous deployment:** the Render service uses *Auto-Deploy: After CI Checks Pass*, so Render only deploys a commit once this pipeline is green.

---

## Deployment Guide (Free Tier)

### Deploying Backend on Render

1. Create an account on [Render](https://render.com/).
2. Push this whole repository to GitHub.
3. On Render, click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. Configure the Web Service:
   - **Name**: ai-cold-email-backend
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`  *(Make sure to use node instead of nodemon for production)*
   - **Instance Type**: Free
6. Under **Environment Variables**, add all the variables from your `.env` file (e.g. `MONGO_URI`, `JWT_SECRET`, `AI_API_KEY`).
7. Click **Create Web Service**.

### Deploying Frontend on Vercel

1. Create an account on [Vercel](https://vercel.com/).
2. Click **Add New... > Project** and import your GitHub repository.
3. Configure the Project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your newly minted Backend URL + `/api` (e.g., `https://ai-backend.onrender.com/api`)
5. Click **Deploy**. Vercel will deploy your frontend seamlessly.
6. **Important**: Remember to go back to Render and update your backend `FRONTEND_URL` Variable to the Vercel domain to dodge tricky CORS errors.
