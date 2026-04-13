import { spawn } from "child_process";

const REQUIRED_IMAGES = [
  "node:22-slim",
  "python:3.12-slim",
  "frolvlad/alpine-gcc",
  "eclipse-temurin:17-jre-alpine",
];

class DockerService {
  runCommand(args) {
    return new Promise((resolve, reject) => {
      const process = spawn("docker", args);

      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("error", reject);

      process.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(stderr || "Docker command failed"));
        }
      });
    });
  }

  async imageExists(image) {
    try {
      await this.runCommand(["image", "inspect", image]);
      return true;
    } catch {
      return false;
    }
  }

  async pullImage(image) {
    console.log(`📦 Pulling image: ${image}`);
    await this.runCommand(["pull", image]);
    console.log(`✅ Pulled: ${image}`);
  }

  async ensureImages() {
    console.log("🔍 Checking required Docker images...");

    for (const image of REQUIRED_IMAGES) {
      const exists = await this.imageExists(image);

      if (!exists) {
        await this.pullImage(image);
      } else {
        console.log(`✔ Image exists: ${image}`);
      }
    }

    console.log("🐳 Docker image verification complete");
  }
}

export const dockerService = new DockerService();
export default dockerService;
