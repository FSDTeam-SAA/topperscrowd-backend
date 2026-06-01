import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";

// Global rate limiter - Added 'validate' to stop the proxy error
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, try again later.",
  validate: { xForwardedForHeader: false }, // <--- Fixes the error
});

// Login-specific rate limiter
export const loginLimiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, try again later.",
  validate: { xForwardedForHeader: false }, // <--- Fixes the error
});

const corsOptions = {
  // Added your production port 5001 to the whitelist
  origin: [
    "http://localhost:3000", 
    "http://localhost:3001", 
    "http://localhost:5001", 
    "https://kathorianpublishingllc.com",
    "https://www.kathorianpublishingllc.com",
    "https://www.kathorianpublishingllc.com/admin-dashboard",
    "https://kathorianpublishingllc.com/admin-dashboard",
    "https://www.kathorianpublishingllc.com/auth",
    "https://kathorianpublishingllc.com/auth"
  ],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

export const applySecurity = (app: Application) => {
  app.use(globalLimiter);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: true,
    }),
  );
  app.use(helmet.frameguard({ action: "deny" }));
  app.use(helmet.noSniff());

  app.use(cors(corsOptions));

  app.use(
    hpp({
      whitelist: [],
    }),
  );
  app.use(compression());

  // FIXED: Increased limits to 50mb so your PATCH requests don't fail
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
};