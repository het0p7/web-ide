import docker from "../config/docker.js";
import redis from "../config/redis.js";
import path from "path";
import os from "os";

const SESSION_PREFIX = "session";
export const SESSION_TTL_SECONDS = 60 * 30; // 30 minutes
// export const SESSION_TTL_SECONDS = 30; // for testing

function getSessionKey(userId, projectId) {
  return `${SESSION_PREFIX}:${userId}:${projectId}`;
}

function getImageForLanguage(language) {
  switch (language) {
    case "javascript":
      return "node:22-slim";
    case "python":
      return "python:3.12-slim";
    case "c":
    case "cpp":
      return "frolvlad/alpine-gcc";
    case "java":
      return "eclipse-temurin:17-jre-alpine";
    default:
      throw new Error("Unsupported language");
  }
}

class SessionService {
  async createSession({ userId, projectId, language }) {
    const key = getSessionKey(userId, projectId);

    const existingRaw = await redis.get(key);

    if (existingRaw) {
      const existing = JSON.parse(existingRaw);

      try {
        const container = docker.getContainer(existing.containerId);
        const info = await container.inspect();

        if (info.State.Running) {
          return existing; // reuse running container
        }
      } catch {
        // container missing → create new one
      }
    }

    const basePath = process.env.BASE_PROJECT_PATH;
    const localProjectRoot = path.resolve(
      basePath,
      String(userId),
      String(projectId),
    );

    // If running on EC2 via Docker-in-Docker, we need the HOST path for the mount
    const hostBasePath = process.env.HOST_PROJECT_PATH;
    const projectRootForBind = hostBasePath 
      ? path.join(hostBasePath, String(userId), String(projectId)) 
      : localProjectRoot;

    const image = getImageForLanguage(language);

    // Enforce Concurrent Session Ceiling
    const activeKey = `active_sessions:${userId}`;
    
    // Auto-prune dead sessions using their keys
    const members = await redis.smembers(activeKey);
    for (const member of members) {
      if (!(await redis.get(getSessionKey(userId, member)))) {
        await redis.srem(activeKey, member);
      }
    }

    // Check bounds
    const activeCount = await redis.scard(activeKey);
    const isMember = await redis.sismember(activeKey, String(projectId));
    if (activeCount >= 3 && !isMember) {
      throw new Error("Maximum concurrent sessions (3) reached. Please stop another active environment first.");
    }

    const uid = os.userInfo().uid;
    const gid = os.userInfo().gid;
    
    // On Windows, uid/gid are -1. We enforce 1000:1000 to drop privileges.
    // If backend runs as root (uid=0), we also force 1000:1000 to ensure safety.
    const isValidUnixUser = uid > 0 && gid > 0;
    const userStr = isValidUnixUser ? `${uid}:${gid}` : "1000:1000";

    // Write bashrc to /tmp (world-writable) so it works whether we run as root or a mapped user.
    const bashrcPath = "/tmp/.ide_bashrc";

    const containerConfig = {
      Image: image,
      Tty: true,
      WorkingDir: "/workspace",
      Env: [
        "TERM=xterm-256color",
        "npm_config_cache=/tmp/npm-cache",
        "PIP_CACHE_DIR=/tmp/pip-cache"
      ],
      Hostname: "workspace",

      // Container sets up a custom bashrc for colored prompts and aliases, then idles.
      // The actual bash session is created by docker exec in terminal.ws.js using this rcfile.
      // This prevents "bash inside bash" nesting that causes garbage terminal output.
      Cmd: [
        "sh",
        "-c",
        `echo "export PS1='\\[\\033[1;32m\\]\\u@\\h\\[\\033[0m\\]:\\[\\033[1;34m\\]\\w\\[\\033[0m\\]\\$ '" > ${bashrcPath} && echo "alias ls='ls --color=auto'" >> ${bashrcPath} && echo "alias ll='ls -la --color=auto'" >> ${bashrcPath} && echo "alias grep='grep --color=auto'" >> ${bashrcPath} && sleep infinity`
      ],

      Labels: {
        sessionKey: key,
      },

      HostConfig: {
        Binds: [
          `${projectRootForBind}:/workspace`
        ],
        Memory: 2048 * 1024 * 1024,
        NanoCPUs: 1 * 1e9,
        PidsLimit: 256,
        SecurityOpt: ["no-new-privileges"],
      },
    };

    // Always enforce the non-root user
    containerConfig.User = userStr;

    const container = await docker.createContainer(containerConfig);

    await container.start();

    const sessionData = {
      containerId: container.id,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    await redis.set(
      key,
      JSON.stringify(sessionData),
      "EX",
      SESSION_TTL_SECONDS,
    );

    // Track active project
    await redis.sadd(activeKey, String(projectId));
    // Set an expiration so it cleans itself up if tracking gets orphaned
    await redis.expire(activeKey, SESSION_TTL_SECONDS * 2);

    return sessionData;
  }

  async getSession(userId, projectId) {
    const key = getSessionKey(userId, projectId);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async stopSession(userId, projectId) {
    const key = getSessionKey(userId, projectId);
    const data = await redis.get(key);

    if (!data) return;

    const { containerId } = JSON.parse(data);

    try {
      const container = docker.getContainer(containerId);
      await container.stop();
      await container.remove();
    } catch (err) {
      console.error("Error stopping container:", err.message);
    }

    await redis.del(key);
    await redis.srem(`active_sessions:${userId}`, String(projectId));
  }

  async updateActivity(userId, projectId) {
    const key = getSessionKey(userId, projectId);
    const data = await redis.get(key);

    if (!data) return;

    const session = JSON.parse(data);
    session.lastActiveAt = Date.now();

    await redis.set(key, JSON.stringify(session), "EX", SESSION_TTL_SECONDS);
  }
}

export const sessionService = new SessionService();
export default sessionService;
