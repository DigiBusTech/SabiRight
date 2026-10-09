import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import path from "path";
import { startInboundBotWorker } from "./bots/inboundBotWorker.js";

const app = express();
app.use(express.json({ limit: '12mb', verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: false }));

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Minimal in-memory rate limiter for abuse-prone endpoints (per IP)
const hits = new Map<string, { n: number; reset: number }>();
const limited = /^\/api\/(auth|payments|ai|civic|bots)/;
app.use((req, res, next) => {
  if (!limited.test(req.path) || /webhook|callback/.test(req.path)) return next();
  const key = `${req.ip}:${req.path.split('/')[2]}`;
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) hits.set(key, { n: 1, reset: now + 60_000 });
  else if (++h.n > 120) return res.status(429).json({ message: 'Too many requests, slow down.' });
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

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

// Setup routes and start the durable bot inbox poller on long-running servers.
registerRoutes(server, app)
  .then(() => startInboundBotWorker())
  .catch(error => console.error("[Server] Route registration failed:", error));

// Fallback for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

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
