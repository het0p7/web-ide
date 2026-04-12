import fs from "fs/promises";
import path from "path";

const rawBasePath = process.env.BASE_PROJECT_PATH || "./storage/projects";

export const BASE_DIR = path.resolve(rawBasePath);

// Ensure the base project folder exists synchronously on boot
import fsSync from "fs";
if (!fsSync.existsSync(BASE_DIR)) {
  fsSync.mkdirSync(BASE_DIR, { recursive: true });
}

/**
 * Resolve and validate a path inside project root.
 */
function resolveSafePath(userId, projectId, relativePath = "") {
  const projectRoot = path.join(BASE_DIR, String(userId), String(projectId));
  const fullPath = path.resolve(projectRoot, relativePath);

  if (!fullPath.startsWith(projectRoot)) {
    throw new Error("Path traversal detected");
  }

  return { projectRoot, fullPath };
}

class FilesystemService {
  async ensureProjectRoot(userId, projectId) {
    const { projectRoot } = resolveSafePath(userId, projectId);
    await fs.mkdir(projectRoot, { recursive: true });
    return projectRoot;
  }

  async deleteProjectRoot(userId, projectId) {
    const { projectRoot } = resolveSafePath(userId, projectId);
    await fs.rm(projectRoot, { recursive: true, force: true });
  }

  async createFolder({ userId, projectId, folderPath }) {
    const { fullPath } = resolveSafePath(userId, projectId, folderPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  async createFile({ userId, projectId, filePath, content = "" }) {
    if (Buffer.byteLength(content, "utf8") > 5 * 1024 * 1024) {
        throw new Error("File content exceeds 5MB limit");
    }
    const { fullPath } = resolveSafePath(userId, projectId, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf8");
  }

  async readFile({ userId, projectId, filePath }) {
    const { fullPath } = resolveSafePath(userId, projectId, filePath);
    return await fs.readFile(fullPath, "utf8");
  }

  async updateFile({ userId, projectId, filePath, content }) {
    if (Buffer.byteLength(content, "utf8") > 5 * 1024 * 1024) {
        throw new Error("File content exceeds 5MB limit");
    }
    const { fullPath } = resolveSafePath(userId, projectId, filePath);
    await fs.writeFile(fullPath, content, "utf8");
  }

  async deleteFile({ userId, projectId, filePath }) {
    const { fullPath } = resolveSafePath(userId, projectId, filePath);
    await fs.unlink(fullPath);
  }

  async deleteFolder({ userId, projectId, folderPath }) {
    const { fullPath } = resolveSafePath(userId, projectId, folderPath);
    await fs.rm(fullPath, { recursive: true, force: true });
  }

  async renamePath({ userId, projectId, oldPath, newPath }) {
    const { projectRoot } = resolveSafePath(userId, projectId);

    const oldResolved = path.resolve(projectRoot, oldPath);
    const newResolved = path.resolve(projectRoot, newPath);

    // 🔒 Path traversal protection
    if (
      !oldResolved.startsWith(projectRoot) ||
      !newResolved.startsWith(projectRoot)
    ) {
      throw new Error("Path traversal detected");
    }

    // Ensure source exists
    try {
      await fs.access(oldResolved);
    } catch {
      throw new Error("Source file or folder does not exist");
    }

    // Ensure destination directory exists
    await fs.mkdir(path.dirname(newResolved), { recursive: true });

    // Safe rename with clean error handling
    try {
      await fs.rename(oldResolved, newResolved);
    } catch (err) {
      if (err.code === "EEXIST") {
        throw new Error("Destination already exists");
      }
      throw err;
    }
  }

  async listTree(userId, projectId, currentPath = "") {
    const { fullPath } = resolveSafePath(userId, projectId, currentPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const result = [];

    for (const entry of entries) {
      const relative = path.join(currentPath, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        result.push({
          name: entry.name,
          type: "folder",
          path: relative,
          children: await this.listTree(userId, projectId, relative),
        });
      } else {
        result.push({
          name: entry.name,
          type: "file",
          path: relative,
        });
      }
    }

    return result;
  }
}

export const filesystemService = new FilesystemService();
export default filesystemService;
