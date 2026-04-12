import { spawn } from "child_process";
import path from "path";

/**
 * Map language → Docker image + execution command
 * Supports compilation where required.
 */
function getExecutionConfig(language, entryPoint) {
  switch (language) {
    case "javascript":
      return {
        image: "node:24",
        command: ["node", entryPoint],
        timeoutMs: 10000,
      };

    case "python":
      return {
        image: "python:3.15-rc",
        command: ["python", entryPoint],
        timeoutMs: 10000,
      };

    case "c":
      return {
        image: "gcc:latest",
        command: ["bash", "-c", `gcc ${entryPoint} -o program && ./program`],
        timeoutMs: 15000,
      };

    case "cpp":
      return {
        image: "gcc:latest",
        command: ["bash", "-c", `g++ ${entryPoint} -o program && ./program`],
        timeoutMs: 15000,
      };

    case "java":
      return {
        image: "eclipse-temurin:25-jdk",
        command: [
          "bash",
          "-c",
          `javac ${entryPoint} && java ${path.basename(entryPoint, ".java")}`,
        ],
        timeoutMs: 25000,
      };

    default:
      throw new Error("Unsupported language");
  }
}

class ExecutionService {
  async executeStateless({ userId, projectId, language, entryPoint }) {
    return new Promise((resolve, reject) => {
      try {
        if (!entryPoint) {
          throw new Error("Entry point not defined");
        }

        const basePath = process.env.BASE_PROJECT_PATH;
        if (!basePath) {
          throw new Error("BASE_PROJECT_PATH not configured");
        }

        const projectRoot = path.resolve(
          basePath,
          String(userId),
          String(projectId),
        );

        const { image, command, timeoutMs = 10000 } = getExecutionConfig(language, entryPoint);

        const dockerArgs = [
          "run",
          "--rm",

          // 🔒 Security Restrictions
          "--network=none",
          "--memory=256m",
          "--cpus=0.5",
          "--pids-limit=64",
          "--security-opt",
          "no-new-privileges",

          // 🔐 Run as non-root user
          "--user",
          "1000:1000",

          // 🔐 Make container root filesystem read-only
          "--read-only",

          // Allow writable temp directory
          "--tmpfs",
          "/tmp",

          // Mount project folder as writable workspace
          "-v",
          `${projectRoot}:/workspace:rw`,

          "-w",
          "/workspace",

          image,
          ...command,
        ];

        const dockerProcess = spawn("docker", dockerArgs);

        let stdout = "";
        let stderr = "";

        // Execution timeout (adaptive based on language compiling needs)
        const timeout = setTimeout(() => {
          dockerProcess.kill("SIGKILL");
        }, timeoutMs);

        dockerProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        dockerProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        dockerProcess.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        dockerProcess.on("close", (code) => {
          clearTimeout(timeout);

          resolve({
            stdout,
            stderr,
            exitCode: code,
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const executionService = new ExecutionService();
export default executionService;
