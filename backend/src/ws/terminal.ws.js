import { WebSocketServer } from "ws";
import { PassThrough } from "stream";
import docker from "../config/docker.js";
import redis from "../config/redis.js";
import { SESSION_TTL_SECONDS } from "../services/session.service.js";
import { watcherService } from "../services/watcher.service.js";
import { BASE_DIR } from "../services/filesystem.service.js";
import path from "path";
import jwt from "jsonwebtoken";
import os from "os";

// Keep track of connected clients per project
const projectClients = new Map(); // projectId -> Set<ws>

// Keep persistent exec streams alive per session so reconnects re-attach to the same bash
// Map key: `${userId}:${projectId}` → { stream, stdout, stderr, execInstance }
const activeStreams = new Map();

// Setup global watcher listener
watcherService.on("change", (projectId) => {
  const clients = projectClients.get(String(projectId));
  if (clients && clients.size > 0) {
    const message = JSON.stringify({ type: "treeUpdate" });
    clients.forEach(ws => {
      if (ws.readyState === 1) ws.send(message);
    });
  }
});

function getSessionKey(userId, projectId) {
  return `session:${userId}:${projectId}`;
}

export function initTerminalWS(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws/terminal",
  });

  wss.on("error", (err) => {
    console.error("WebSocket server error:", err);
  });

  wss.on("connection", async (ws, req) => {
    let stdout;
    let execInstance;

    try {
      const url = new URL(req.url, "http://localhost");
      
      // Enforce WS Origin policies to prevent Cross-Site WebSocket Hijacking
      const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.FRONTEND_URL];
      const origin = req.headers.origin;
      if (origin && !allowedOrigins.includes(origin)) {
         ws.send("Authentication failed: Origin policy violation.\r\n");
         ws.close(1008, "Policy Violation");
         return;
      }
      
      const cookieHeader = req.headers.cookie || "";
      const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
      if (!tokenMatch) {
         ws.send("Authentication failed: No token provided.\r\n");
         ws.close();
         return;
      }
      
      let decodedId;
      try {
         const decoded = jwt.verify(tokenMatch[1], process.env.JWT_SECRET);
         decodedId = decoded.id;
      } catch (err) {
         ws.send("Authentication failed: Invalid token.\r\n");
         ws.close();
         return;
      }
      
      const userId = decodedId;
      const projectId = url.searchParams.get("projectId");
      let initialCols = parseInt(url.searchParams.get("cols")) || 80;
      let initialRows = parseInt(url.searchParams.get("rows")) || 24;
      if (initialCols < 10) initialCols = 80;
      if (initialRows < 10) initialRows = 24;

      if (!userId || !projectId) {
        ws.close();
        return;
      }

      // Register client for project updates
      if (!projectClients.has(projectId)) {
        projectClients.set(projectId, new Set());
      }
      projectClients.get(projectId).add(ws);

      // Start watching project directory
      const projectRoot = path.join(BASE_DIR, String(userId), String(projectId));
      watcherService.startWatching(projectId, projectRoot);

      const sessionKey = getSessionKey(userId, projectId);
      const sessionDataRaw = await redis.get(sessionKey);

      if (!sessionDataRaw) {
        ws.send("No active session. Please reload the page.\r\n");
        ws.close();
        return;
      }

      const { containerId } = JSON.parse(sessionDataRaw);
      const container = docker.getContainer(containerId);

      const info = await container.inspect();
      if (!info.State.Running) {
        await container.start();
      }

      const streamKey = `${userId}:${projectId}`;

      // Re-attach to an existing exec if available, otherwise create a new one
      if (activeStreams.has(streamKey)) {
        const existing = activeStreams.get(streamKey);
        stdout = existing.stdout;
        execInstance = existing.execInstance;
      } else {
        const uid = os.userInfo().uid;
        const gid = os.userInfo().gid;
        const isValidUnixUser = uid > 0 && gid > 0;
        const userStr = isValidUnixUser ? `${uid}:${gid}` : "1000:1000";

        execInstance = await container.exec({
          Cmd: ["sh"],
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
          User: userStr,
          Env: [
            "TERM=xterm-256color",
            "FORCE_COLOR=1",
            "COLORTERM=truecolor",
            `COLUMNS=${initialCols}`,
            `LINES=${initialRows}`
          ],
        });

        const rawStream = await execInstance.start({
          hijack: true,
          stdin: true,
        });

        // BUG FIX #2: Properly demultiplex the Docker stream.
        // Even with Tty:true, Docker may prepend 8-byte frame headers on certain setups.
        // demuxStream strips those headers so only clean terminal bytes reach xterm.js.
        // We pass rawStream as both the stdin writer (later) AND demux it for output.
        const stdoutPass = new PassThrough();
        const stderrPass = new PassThrough();
        docker.modem.demuxStream(rawStream, stdoutPass, stderrPass);

        // BUG FIX #4: Register data handler BEFORE stream.resume() to avoid dropping
        // early bytes (e.g. the initial prompt) that arrive before the handler is wired.
        // PassThrough streams buffer until a listener is attached, so we register first.
        stdout = stdoutPass;

        // Merge stderr into stdout so both go to the terminal
        stderrPass.on("data", (chunk) => {
          if (stdoutPass.writable) stdoutPass.push(chunk);
        });

        activeStreams.set(streamKey, { rawStream, stdout: stdoutPass, execInstance });

        // When the exec stream itself ends, clean up
        rawStream.on("end", () => activeStreams.delete(streamKey));
        rawStream.on("error", () => activeStreams.delete(streamKey));
      }

      // Resize TTY to match client dimensions
      try {
        await execInstance.resize({ h: initialRows, w: initialCols });
      } catch (e) {
        // Non-fatal
      }

      // Forward clean container output → this WebSocket client
      const dataHandler = (chunk) => {
        if (ws.readyState === 1) ws.send(chunk);
      };
      stdout.on("data", dataHandler);

      ws.on("message", async (data) => {
        try {
          const stringData = data.toString();
          const parsed = JSON.parse(stringData);

          if (parsed.type === "resize") {
            const safeCols = Math.max(10, parsed.cols || 80);
            const safeRows = Math.max(10, parsed.rows || 24);
            try {
              await execInstance.resize({ h: safeRows, w: safeCols });
            } catch (e) {}
            return;
          }

          if (parsed.type === "heartbeat") {
            await redis.expire(sessionKey, SESSION_TTL_SECONDS);
            return;
          }
        } catch (e) {
          // Not JSON → raw terminal input
        }

        const existing = activeStreams.get(streamKey);
        if (existing?.rawStream?.writable) {
          existing.rawStream.write(data);
          await redis.expire(sessionKey, SESSION_TTL_SECONDS);
        }
      });

      ws.on("close", () => {
        // Unregister client
        const clients = projectClients.get(projectId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) projectClients.delete(projectId);
        }

        // Stop watching if no more clients in this project
        watcherService.stopWatching(projectId);

        // Remove just this client's listener — do NOT end the stream (keeps bash alive for reconnect)
        stdout.removeListener("data", dataHandler);
      });

    } catch (err) {
      console.error("WebSocket terminal error:", err);
      try { ws.close(); } catch {}
    }
  });

  console.log("🟢 Terminal WebSocket initialized");
}
