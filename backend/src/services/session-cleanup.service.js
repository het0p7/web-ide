import docker from "../config/docker.js";
import redis from "../config/redis.js";

const CHECK_INTERVAL = 60 * 1000; // every 60 seconds

class SessionCleanupService {
  start() {
    setInterval(async () => {
      try {
        // Use label filter — only inspect containers we created, not the entire Docker host
        const containers = await docker.listContainers({
          all: true,
          filters: JSON.stringify({ label: ["sessionKey"] }),
        });

        for (const containerInfo of containers) {
          const labels = containerInfo.Labels || {};
          const sessionKey = labels.sessionKey;
          if (!sessionKey) continue;

          const exists = await redis.exists(sessionKey);

          // Redis key expired → session is dead → forcefully remove container
          if (!exists) {
            console.log(`🧹 Removing expired session container: ${containerInfo.Id.slice(0, 12)}`);
            const container = docker.getContainer(containerInfo.Id);
            try {
              await container.remove({ force: true });
            } catch (err) {
              console.error("❌ Failed to remove container:", containerInfo.Id.slice(0, 12), err.message);
            }
          }
        }
      } catch (err) {
        console.error("❌ Cleanup worker error:", err.message);
      }
    }, CHECK_INTERVAL);

    console.log("🧹 Session cleanup worker started");
  }
}

export const sessionCleanupService = new SessionCleanupService();
export default sessionCleanupService;
