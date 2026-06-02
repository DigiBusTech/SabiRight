import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'legal-13d13'
  });
  admin.firestore().settings({ ignoreUndefinedProperties: true });
  console.log("Firebase Admin initialized with service account (Project: legal-13d13).");
} else {
  console.warn("Firebase service account file not found. Firebase features may fail.");
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

(async () => {
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after setting up routes
  if (process.env.NODE_ENV === "development") {
    // We would setup vite here if needed for the client
  } else {
    // Serve static files in production
  }

  await registerRoutes(server, app);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`serving on port ${PORT}`);
  });
})();
