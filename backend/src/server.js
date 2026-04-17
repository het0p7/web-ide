import "./config/env.js";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { initTerminalWS } from "./ws/terminal.ws.js";
import projectRoutes from "./routes/project.routes.js";
import userRoutes from "./routes/user.js";
import { dockerService } from "./services/docker.service.js";
import { sessionCleanupService } from "./services/session-cleanup.service.js";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler.js";


const app = express();
const server = http.createServer(app);

// ===============================
// Middleware
// ===============================
app.use(helmet());
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
// Using the cors middleware above instead
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// ===============================
// Health Check
// ===============================
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Web IDE backend running" });
});

// ===============================
// Routers
// ===============================
app.use("/api/projects", projectRoutes);
app.use("/api/v1", userRoutes);

// ===============================
// Error Handler
// ===============================
app.use(errorHandler);

// ===============================
// Configuration
// ===============================
const DEFAULT_PORT = 5000;
const FALLBACK_PORT = 5001;
const PORT = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/neweditor";

// ===============================
// Helpers
// ===============================
function listen(serverPort) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(serverPort, () => {
      server.off("error", reject);
      console.log(`🚀 Server running on port ${serverPort}`);
      resolve(serverPort);
    });
  });
}

// ===============================
// Bootstrap Function
// ===============================
async function startServer() {
  try {
    // 1️⃣ Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // 3️⃣ Start Express server
    let runningPort;
    try {
      runningPort = await listen(PORT);
    } catch (error) {
      if (error.code === "EADDRINUSE") {
        console.warn(
          `⚠️ Port ${PORT} is already in use. Falling back to ${FALLBACK_PORT}.`,
        );
        runningPort = await listen(FALLBACK_PORT);
      } else {
        throw error;
      }
    }

    // 4️⃣ Post-start tasks (background)
    // We don't await ensureImages so the server can handle requests immediately
    dockerService.ensureImages().catch((err) => {
      console.error("❌ Background Docker verification failed:", err.message);
    });

    // Start Orphan Container Cleanup Service
    sessionCleanupService.start();

    // Initialize WebSocket only after HTTP server is listening
    initTerminalWS(server);
  } catch (error) {
    console.error("❌ Server startup failed:");
    console.error(error); // Log the full error object for better debugging
    process.exit(1);
  }
}

// ===============================
// Start Application
// ===============================
startServer();
