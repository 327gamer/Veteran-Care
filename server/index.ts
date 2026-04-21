import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.set("trust proxy", 1);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => !req.path.startsWith("/api"),
});
app.use(globalLimiter);

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions, please try again later." },
});
app.use("/api/navigator-request", publicFormLimiter);
app.use("/api/partner-apply", publicFormLimiter);
app.use("/api/vob/submit", publicFormLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});
app.use("/api/admin/login", authLimiter);
app.use("/api/auth", authLimiter);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function cleanupTestRecords() {
  // Idempotent boot-time cleanup. Production has historical seed/test
  // records (ABC - 2, ABC 4, ABC - 6, LIVE PAYMENT TEST, etc.) that the
  // founder needs archived from public-facing surfaces. Runs every boot;
  // cheap when nothing matches. Uses pg pool already wired in pg-client.
  try {
    const { query: pgQuery } = await import("./pg-client");
    const archived = await pgQuery(
      `UPDATE trusted_services
         SET is_active = false,
             verification_status = 'rejected',
             name = '[ARCHIVED] ' || name
       WHERE name NOT ILIKE '[ARCHIVED]%'
         AND (
           name ~* '^\\s*A[BC]C[ -]*\\d+\\s*$'
           OR name ~* '^\\s*ACB[ -]*\\d+\\s*$'
           OR name ILIKE '%LIVE PAYMENT TEST%'
           OR name ILIKE '%test record%'
           OR name ILIKE '%test partner%'
           OR name ILIKE '%placeholder%'
           OR name ILIKE 'TEST %'
           OR name ILIKE 'Veteran Care'
           OR name ILIKE 'Veteran Care %'
         )
       RETURNING id, name`,
    );
    if (archived.length > 0) {
      console.log(`[boot-cleanup] archived ${archived.length} test records:`,
        archived.map((r: any) => r.name).join(", "));
    }
  } catch (err: any) {
    console.warn(`[boot-cleanup] skipped (${err?.message || err})`);
  }
}

async function ensureSubcategoryTags() {
  // Idempotent boot-time tag enforcement. Production DB drifts from dev DB
  // because direct dev-side SQL doesn't propagate. This guarantees a known
  // set of partners carries the subcategory_slugs they need to surface in
  // sub pages on Trusted Services. UPDATE-only — never inserts. Cheap when
  // already correct.
  const tagPlan: Array<{ namePattern: string; subs: string[] }> = [
    { namePattern: "BootPrint", subs: ["emergency-housing", "homeless-veteran-services", "transitional-housing"] },
    { namePattern: "Tri-County Veterans Support Network", subs: ["emergency-housing", "homeless-veteran-services"] },
    { namePattern: "Navy Mutual Aid Association", subs: ["life-insurance"] },
    { namePattern: "AAFMAA", subs: ["life-insurance"] },
    { namePattern: "VA Life Insurance (VALife)", subs: ["life-insurance"] },
    { namePattern: "VALife", subs: ["life-insurance"] },
  ];
  try {
    const { query: pgQuery } = await import("./pg-client");
    for (const t of tagPlan) {
      const updated = await pgQuery(
        `UPDATE trusted_services
            SET subcategory_slugs = (
              SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(subcategory_slugs, '{}'::text[]) || $2::text[]))
            )
          WHERE name ILIKE $1
            AND NOT (subcategory_slugs @> $2::text[])
          RETURNING id, name, subcategory_slugs`,
        [`%${t.namePattern}%`, t.subs],
      );
      if (updated.length > 0) {
        console.log(`[boot-tags] tagged ${updated.length} for "${t.namePattern}":`,
          updated.map((r: any) => `${r.name} -> ${JSON.stringify(r.subcategory_slugs)}`).join("; "));
      }
    }
  } catch (err: any) {
    console.warn(`[boot-tags] skipped (${err?.message || err})`);
  }
}

(async () => {
  await cleanupTestRecords();
  await ensureSubcategoryTags();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
