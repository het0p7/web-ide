import { spawn } from "child_process";

const REQUIRED_IMAGES = [
  "node:22",
  "python:3.12",
  "gcc:14",
  "eclipse-temurin:17-jdk",
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
          const errorMsg = stderr.trim() || `Docker command failed with code ${code}`;
          reject(new Error(errorMsg));
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
