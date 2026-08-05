# AI Cold Email Generator (Monorepo)

A fully dockerized full-stack MERN application that uses AI to generate customized cold emails, LinkedIn DMs, and follow-up emails based on user prompts.

## Features Added
- **Monorepo setup**: Single `package.json` to install and run the entire stack concurrently.
- **Docker & Docker Compose**: Bootstraps the Node API, React Frontend, and MongoDB database automatically in isolated containers.
- **CI/CD via GitHub Actions**: Ensures that all dependencies install correctly and frontend builds continuously upon pushing changes to GitHub.

---

## 🚀 How to Run Locally (Using Concurrently)

**1. Install all dependencies**  
Run this command from the root folder (it installs root, server, and client Node dependencies):
\`\`\`bash
npm run install:all
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

If you prefer using Docker, you don't even need to install Node locally. Docker Compose will spin up 3 instances automatically:
1. React Frontend Container
2. Node API Container
3. MongoDB Database Container

**Steps:**
1. Be in the root folder.
2. Ensure Docker Desktop is open and running.
3. Build and spin up the architecture:
   \`\`\`bash
   docker-compose up --build
   \`\`\`
   *(Note: This uses the environment variables configured within the `docker-compose.yml` file. Update the secrets inside that file before running it in production).*

To stop containers:
\`\`\`bash
docker-compose down
\`\`\`

---

## 🔁 CI/CD (GitHub Actions Pipeline)

This repository includes a `.github/workflows/pipeline.yml` file. 

Whenever you push to `main` (or create a Pull Request against it), GitHub Actions will automatically:
- Checkout your code.
- Setup Node.js v18.
- Install Root, Client, and Server dependencies respectively.
- Run a `npm run build` on your `/client` to ensure Vite successfully bundles the frontend. 

It prevents bad pushes from making it effectively resolving broken dependencies early on.

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
