# SabiRight: Vercel Deployment & Firestore Initialization Guide

This comprehensive guide explains how to deploy the SabiRight full-stack application (Vite React frontend + Express Node.js backend) to Vercel, and details exactly how **Google Cloud Firestore / Firebase Admin SDK** is initialized and configured for serverless production.

---

## 1. Important Note on your `.env` File
You noticed that your `.env` file was populated with several variables like `APP_ENV=PROD`, `RUNTIME_API_HOST=https://api.manus.im`, and `CODE_SERVER_DOMAIN`. 

These variables are **system-level defaults automatically injected by the Manus VM sandbox environment**. They are completely unrelated to SabiRight. We have overwritten your `.env` file with a clean, well-commented template containing only the variables actually used by the SabiRight platform (e.g., Supabase, Firebase, Gemini, Paystack). You can use this as your reference.

---

## 2. How Firestore is Initialized in SabiRight

SabiRight utilizes the `firebase-admin` SDK on the backend to interact with Firestore. This setup is located inside `server/firestoreStorage.ts` and `server/index.ts`. 

To allow the application to run seamlessly across local, hosting, and serverless (Vercel) environments, SabiRight is programmed to look for credentials in **three distinct fallback stages**:

```
 ┌─────────────────────────────────────────────────────────┐
 │ Stage 1: Local Service Account JSON File                │
 │ Looks for local .json credentials file in the root directory │
 └───────────────────────────┬─────────────────────────────┘
                             │ (If not found)
                             ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Stage 2: Stringified JSON Environment Variable          │
 │ Parses process.env.FIREBASE_SERVICE_ACCOUNT_JSON        │
 └───────────────────────────┬─────────────────────────────┘
                             │ (If not found)
                             ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Stage 3: Individual Environment Credentials (RECOMMENDED)│
 │ Uses Project ID, Client Email, and Private Key          │
 └─────────────────────────────────────────────────────────┘
```

### Why Stage 3 is Highly Recommended for Vercel
On Vercel, private keys contain multi-line characters (`-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----`). Copying and pasting actual newlines into Vercel's Environment Variables UI often breaks or truncates the key.

To solve this, SabiRight's Stage 3 utilizes individual environment variables and includes a built-in replacement for escaped newline characters:
```typescript
privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
```
This lets you paste your private key into Vercel as a single-line string with literal `\n` characters, which the application safely translates back into active multiline private keys at runtime.

---

## 3. Step-by-Step Vercel Deployment Guide

Follow these steps to deploy SabiRight onto Vercel with zero downtime.

### Step 1: Add `vercel.json` (Already Done!)
We have created a `vercel.json` in your project root. This file tells Vercel how to build SabiRight as a unified serverless application and how to route requests:
- **Builds**: Uses `@vercel/node` to compile and bundle the Express app (`server/index.ts`). It includes the generated static client files located in `dist/public/**`.
- **Routes**:
  - Requests starting with `/api/*` are directed to the Express app function.
  - Requests starting with `/uploads/*` are routed to Express static uploads.
  - Client static files (like Javascript and CSS assets under `/assets/*`) are served with optimal cache headers.
  - All other requests fall back to the Express server, which acts as a router returning the compiled React frontend (`index.html`).

### Step 2: Push to Git (GitHub/GitLab/Bitbucket)
Ensure your project files are pushed to your remote repository. Do **not** upload or commit `.env` or any sensitive Firebase JSON credential keys to Git (they are ignored by `.gitignore`).

### Step 3: Import Project in Vercel
1. Go to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your SabiRight repository.

### Step 4: Configure Project Build Settings
In the **Configure Project** screen, make sure your settings match the following:
* **Framework Preset**: `Other` (Do not select Vite or Create React App, as we are running a full-stack Express server).
* **Root Directory**: `./` (Root)
* **Build Command**: `npm run build && npx vite build`  
  *(This ensures that first, the TypeScript backend compiles, and second, Vite builds your React client assets directly into `dist/public`).*
* **Output Directory**: `dist`
* **Install Command**: `npm install` (or `pnpm install` / `yarn install`)

### Step 5: Configure Environment Variables
Expand the **Environment Variables** accordion and add the following required properties:

| Key | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Sets the application to production mode. |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string for Drizzle ORM. |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase endpoint for client-side queries (prefixed with `VITE_` for Vite). |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsIn...` | Client-side public Supabase key. |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsIn...` | privileged key for backend admin operations. |
| `GEMINI_API_KEY` | `AIzaSy...` | API Key for Gemini legal/intelligence helpers. |
| `PAYSTACK_SECRET_KEY` | `sk_live_xxxx` or `sk_test_xxxx` | Secret key for processing platform payments. |
| `FIREBASE_PROJECT_ID` | `legal-13d13` | Your Firebase Project ID. |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxx@...gserviceaccount.com` | Firebase Admin SDK client email. |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANB...\\n-----END PRIVATE KEY-----\n"` | Your Firebase service account private key. Wrap it in quotes, and replace all actual newlines with `\n` to keep it on a single line! |
| `ADMIN_SETUP_KEY` | `your-secure-setup-key` | Secured passphrase to access administrative dashboard setup. |

---

## 4. Verifying your Firestore Setup on Vercel

Once your deployment is complete, verify that Firestore was initialized successfully:

1. Visit your Vercel deployment URL.
2. In the Vercel Dashboard, go to your SabiRight Project > **Logs** tab.
3. Check the startup logs of your serverless function. You should see the following line confirming successful initialization:
   ```text
   Firebase Admin initialized via FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL env vars.
   ```
4. If you see warnings or initialization failures (such as `Firebase Admin not initialized`), check that you copied your `FIREBASE_PRIVATE_KEY` correctly, and that all standard `\n` line endings are present.

---

## 5. Troubleshooting Common Vercel Issues

* **Error: `PEM_read_bio_PrivateKey failed` / `Invalid PEM formatted key`**
  * **Cause**: Your `FIREBASE_PRIVATE_KEY` has lost its newline characters during copy-paste.
  * **Solution**: Ensure your private key has `\n` character strings instead of actual linebreaks, and that it starts with `-----BEGIN PRIVATE KEY-----\n` and ends with `\n-----END PRIVATE KEY-----\n`.
* **Vite static files not showing up (404 errors)**
  * **Cause**: Express server started before Vite compiled its build into `dist/public`.
  * **Solution**: Make sure the build command is set to `npm run build && npx vite build` (or similar sequence to build both elements), and verify your Vercel deployment includes `dist/public` folder files.
