# Full Stack Deployment Guide (Vercel & Netlify)

This guide provides step-by-step instructions for taking the web app you built in AI Studio and deploying it to a production environment.

---

## PART 1: PROJECT ANALYSIS

### 1. What type of project AI Studio exports

This project is an **Express + React (Vite)** full-stack application.

- **Frontend**: React via Vite (`vite build`)
- **Backend (API)**: Express via Node.js (`server.ts` starting a local API)
- **Database**: Prisma + PostgreSQL/SQLite (`db.ts`)
- **Authentication**: Firebase Admin SDK (`firebase-admin`)

### 2. How to identify this

If you look at the `package.json`, you will see:

- `"dev": "tsx server.ts"`: This indicates the main entry point is a backend Node server, which also serves the frontend.
- `"build": "vite build"`: This means the frontend uses Vite for compilation.
- Dependencies such as `express`, `@prisma/client`, and `firebase-admin` show it is a full-stack Node.js project.

---

## PART 2: REQUIRED FILE STRUCTURE

Before deploying, ensure you have these essential files.

### MUST Exist:

- `package.json` (defines scripts and dependencies)
- `.env` (contains your secret API keys - **Never push this to GitHub!**)
- `server.ts` (API routes and backend logic)
- `prisma/schema.prisma` (Database models)
- `src/` (Frontend React code)
- `firebase-applet-config.json` (Public Firebase settings)

### What to NOT upload:

- `node_modules/` (This is generated on the server)
- `.env` (These exact keys are configured in the hosting provider's dashboard)
- `dist/` (Generated during the build step)

---

## PART 3: ENVIRONMENT VARIABLES

To make your app work in the real world, you must provide your private API keys. Since AI Studio automatically injects some background keys for you, exporting the project means you need to define them explicitly.

Inside the root directory, create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgres://user:password@host:port/dbname"

# AI Models
GEMINI_API_KEY="your_gemini_key_here"
GROQ_API_KEY="your_groq_key_here"

# Authentication (Firebase Admin)
FIREBASE_PROJECT_ID="your_project_id"
FIREBASE_CLIENT_EMAIL="your_service_account_email"
FIREBASE_PRIVATE_KEY="your_private_key"

# Payment (Razorpay)
RAZORPAY_KEY="your_razorpay_key_id"
RAZORPAY_SECRET="your_razorpay_secret"
```

_Note: In Vercel or Netlify, you will copy-paste these exact Key-Value pairs into their **Environment Variables** dashboard manually._

---

## PART 4: LOCAL SETUP (MANDATORY)

Always test your app locally on your computer before pushing to Vercel/Netlify.

1. **Open the project in VS Code**.
2. **Install modules**:
   ```bash
   npm install
   ```
   _(If you get a dependency error, verify you are on Node 18 or 20 (`node -v`))_
3. **Set up the Database schema**:
   _(Assuming you have configured your `DATABASE_URL` in `.env`)_
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. **Run the developer server**:
   ```bash
   npm run dev
   ```
5. **Test**: Open `http://localhost:3000` in your browser. Create an account, test generation, and confirm Razorpay behaves correctly.

---

## PART 5: VERCEL DEPLOYMENT (PRIMARY)

Vercel defaults to static frontend hosting. Because your app uses an **Express Server (`server.ts`)**, you MUST configure Vercel to treat your Express routes as serverless functions.

### Step 1: Push code to GitHub

Run `git init`, `git add .`, `git commit -m "Initial commit"`, and push to a new GitHub repository. Ensure `.env` is ignored via `.gitignore`!

### Step 2: Configure Vercel specific settings

Create a file named `vercel.json` in the ROOT folder:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/dist/$1"
    }
  ]
}
```

_Required code change in `server.ts`_:
Scroll to the bottom of `server.ts`.
Change from:

```typescript
app.listen(3000, () => {
  console.log("Server running");
});
```

To allowing Vercel to intercept the app:

```typescript
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(3000, () => console.log("Server running on port 3000"));
}
export default app;
```

Push these code changes.

### Step 3: Vercel Setup

1. Go to **vercel.com** and click **"Add New Project"**.
2. **Import** your GitHub Repository.
3. Keep the **Framework Preset** as `Vite`.
4. **Build Command**: `npx prisma generate && npm run build` _(Mandatory for Prisma apps)_.
5. **Output Directory**: `dist`
6. **Environment Variables**: Paste everything from your local `.env` here.
7. Click **Deploy**.

---

## PART 6: NETLIFY DEPLOYMENT (SECONDARY)

Netlify is trickier for full Express apps. Without major rewrites to use `netlify-functions`, Netlify handles standard Vite static builds better than full Express integration. _It is strongly recommended to use Vercel using the steps in Part 5._

If you must use Netlify, you typically separate your code:

1. Move all API logic in `server.ts` to `netlify/functions/`.
2. Set Build Command: `npx prisma generate && npm run build`
3. Publish Directory: `dist`
4. Set Environment Variables dynamically in **Site settings > Environment Variables**.

---

## PART 7: COMMON ERRORS + FIXES

**1. "API works in AI Studio but fails after deploy" (500 Error)**
_Cause:_ The environment variables are not correctly configured in your Vercel Dashboard.
_Fix:_ Go to Project Settings -> Environment Variables. Ensure you added `GROQ_API_KEY`, Firebase, and Razorpay keys. Redeploy your app for them to take effect.

**2. "CORS Errors" on API requests**
_Cause:_ If deployed frontend targets separated API domains inappropriately, or trailing slashes cause problems.
_Fix:_ Check `vercel.json` rewrites. By using the rewrite configuration provided in Part 5, the frontend and API share the exact same domain, bypassing CORS errors instantly.

**3. "Prisma Client (Module not found)"**
_Cause:_ Vercel caches `node_modules` before generating Prisma schema types.
_Fix:_ Modify your build command in the Vercel dashboard to: `npx prisma generate && npm run build`

**4. "Process.env undefined" locally in Vite**
_Cause:_ React components can not natively read Node `process.env`.
_Fix:_ Vite only allows reading variables starting with `VITE_` via `import.meta.env`. E.g. `VITE_FIREBASE_KEY`. _Never expose secure private keys to Vite variables._

**5. "Rate limits / API errors"**
_Cause:_ Hitting 429 errors from Groq.
_Fix:_ This is external to Vercel. Reduce output tokens or add multiple fallback handling.

---

## PART 8: AI STUDIO VS REAL DEPLOYMENT DIFFERENCE

Your web application automatically "works magic" in AI Studio because:

1. **Background execution**: AI Studio seamlessly spins up `server.ts` in an internal Docker container that stays constantly awake.
2. **Cron Jobs**: In `server.ts`, you have a node-cron job (`cron.schedule("0 0 * * *", ...)`). Because Serverless platforms like Vercel sleep when there are no requests, **long-running WebSocket servers and local Node `cron` jobs will simply stop working**. _Fix:_ Port your cron reset logic to an independent `/api/cron` route and ping it daily using Vercel Cron.
3. **Environment Injection**: AI Studio silently manages keys behind the scenes for you (like standard Gemini configs). You must reconstruct those explicitly using `.env` files outside the environment.

---

## PART 9: HOW TO UPDATE WEBSITE AFTER DEPLOY

Never manually upload files. Follow this automated Continuous Integration (CI) flow:

1. **Make changes** in VS Code locally. Test via `npm run dev`.
2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Update payment feature"
   ```
3. **Push to GitHub**:
   ```bash
   git push origin main
   ```
4. **Vercel will Automatically Redeploy**: Within seconds of pushing, Vercel gets the signal, builds your app, and swaps the production link with zero downtime.

---

## PART 10: PERFORMANCE + BEST PRACTICES

- **Secure API Keys**: Keep API calls that demand `GROQ_API_KEY` or `GEMINI_API_KEY` entirely within `server.ts`. Never move these fetch calls to the frontend React components where users can steal them from the network tab.
- **Relational Integrity**: Make sure Firebase users and PostgreSQL users sync correctly. Rely on the Firebase User ID as the identifier across both platforms.
- **Reduce UI Re-Renders**: Your React frontend should cache server responses when possible instead of demanding AI generation for every keystroke.
- **Serverless DB Connections**: Serverless functions crash standard databases. Make sure your database provider (e.g. Supabase, Neon) supports connection pooling for serverless architectures.
