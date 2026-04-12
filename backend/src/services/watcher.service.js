import chokidar from "chokidar";
import { EventEmitter } from "events";

class WatcherService extends EventEmitter {
  constructor() {
    super();
    this.watchers = new Map(); // projectId -> chokidar instance
    this.projectCount = new Map(); // projectId -> count of active listeners
  }

  startWatching(projectId, projectRoot) {
    const pId = String(projectId);
    
    if (this.watchers.has(pId)) {
      this.projectCount.set(pId, (this.projectCount.get(pId) || 0) + 1);
      return;
    }

    console.log(`👁️  Starting watcher for project: ${pId} at ${projectRoot}`);
    
    const watcher = chokidar.watch(projectRoot, {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
      ],
      persistent: true,
      ignoreInitial: true,
      depth: 10,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });

    let timeout;
    const notify = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.emit("change", pId);
      }, 500);
    };

    watcher
      .on("add", notify)
      .on("unlink", notify)
      .on("addDir", notify)
      .on("unlinkDir", notify)
      .on("change", notify);

    this.watchers.set(pId, watcher);
    this.projectCount.set(pId, 1);
  }

  stopWatching(projectId) {
    const pId = String(projectId);
    const count = this.projectCount.get(pId) || 0;
    
    if (count <= 1) {
      const watcher = this.watchers.get(pId);
      if (watcher) {
        console.log(`🚫 Stopping watcher for project: ${pId}`);
        watcher.close();
        this.watchers.delete(pId);
      }
      this.projectCount.delete(pId);
    } else {
      this.projectCount.set(pId, count - 1);
    }
  }
}

export const watcherService = new WatcherService();
export default watcherService;
