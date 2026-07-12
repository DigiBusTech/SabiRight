import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin with robust fallbacks
const serviceAccountPath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');
if (admin.apps.length === 0) {
  let initialized = false;

  // Stage 1: Local file
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'legal-13d13'
      });
      admin.firestore().settings({ ignoreUndefinedProperties: true });
      console.log("Firebase Admin initialized with service account (Project: legal-13d13).");
      initialized = true;
    } catch (err) {
      console.error("Failed to initialize Firebase Admin from local JSON file:", err);
    }
  }

  // Stage 2: JSON string from environment (with fallback safety if JSON is malformed)
  if (!initialized && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'legal-13d13'
      });
      admin.firestore().settings({ ignoreUndefinedProperties: true });
      console.log("Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_JSON env var.");
      initialized = true;
    } catch (err) {
      console.error("Failed to initialize Firebase Admin from FIREBASE_SERVICE_ACCOUNT_JSON env var:", err);
    }
  }

  // Stage 3: Individual credentials
  if (!initialized && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'legal-13d13',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || 'legal-13d13'
      });
      admin.firestore().settings({ ignoreUndefinedProperties: true });
      console.log("Firebase Admin initialized via FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL env vars.");
      initialized = true;
    } catch (err) {
      console.error("Failed to initialize Firebase Admin from individual env vars:", err);
    }
  }

  if (!initialized) {
    console.warn("Firebase service account file not found and no environment variables present. Firebase features may fail.");
  }
} else {
  console.log("Firebase Admin already initialized.");
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let resSent = false;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      console.log(logLine);
    }
  });

  next();
});

const server = createServer(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});

// Setup routes
registerRoutes(server, app).catch(console.error);

// Serve static files
const publicDir = path.resolve(process.cwd(), "dist/public");
app.use(express.static(publicDir));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(publicDir, "index.html"));
});

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`serving on port ${PORT}`);
  });
}

export default app;
