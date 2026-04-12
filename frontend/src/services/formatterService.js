let worker = null;
let requestId = 0;
const pendingRequests = new Map();

/**
 * Initializes and returns the formatting Web Worker.
 * Using Vite's worker loading syntax.
 */
const getWorker = () => {
  if (!worker) {
    worker = new Worker(
      new URL("./formatter.worker.js", import.meta.url),
      { type: "module" }
    );
    
    worker.onmessage = (e) => {
      const { id, formatted, error } = e.data;
      const resolve = pendingRequests.get(id);
      if (resolve) {
        if (error) {
          console.warn(`Formatting worker error for request ${id}:`, error);
        }
        resolve(formatted); // Always resolve with something to prevent hanging
        pendingRequests.delete(id);
      }
    };

    worker.onerror = (err) => {
        console.error("Formatting Worker critical error:", err);
        // Clean up and allow restart
        worker.terminate();
        worker = null;
    };
  }
  return worker;
};

/**
 * Offloads formatting to the Web Worker and returns a Promise.
 */
export const formatCode = (code, filePath) => {
  // If no path is provided, we can't format accurately
  if (!filePath) return Promise.resolve(code);
  
  return new Promise((resolve) => {
    const id = requestId++;
    pendingRequests.set(id, resolve);
    
    // Safety timeout to prevent UI hang if worker dies
    setTimeout(() => {
        if (pendingRequests.has(id)) {
            const res = pendingRequests.get(id);
            res(code); // Fallback to original code
            pendingRequests.delete(id);
        }
    }, 5000);

    getWorker().postMessage({ code, filePath, id });
  });
};

// PRE-WARMING: Start the worker and preload Prettier modules as soon as this service is imported
const warmUpWorker = () => {
    const worker = getWorker();
    // Send a dummy request to prime the JIT compiler and load all imports
    worker.postMessage({ code: "const x = 1;", filePath: "warmup.js", id: -1 });
};
warmUpWorker();
