import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.REDIS_URL) {
  console.error("❌ REDIS_URL not found in .env");
  process.exit(1);
}

const localClient = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

const remoteClient = new Redis(process.env.REDIS_URL);

async function migrate() {
  console.log("🚀 Starting Redis Migration...");
  console.log(`Source: 127.0.0.1:6379`);
  console.log(`Destination: ${process.env.REDIS_URL.split('@')[1]}`); // Mask credentials in logs
  
  try {
    let cursor = "0";
    let count = 0;
    
    do {
      const [newCursor, keys] = await localClient.scan(cursor);
      cursor = newCursor;
      
      for (const key of keys) {
        // Use DUMP to get the binary representation
        const buffer = await localClient.dumpBuffer(key);
        // Get TTL in milliseconds
        const ttl = await localClient.pttl(key);
        
        // RESTORE on remote
        // If ttl is < 0, it means no expiry. Use 0 for RESTORE.
        const restoreTtl = ttl > 0 ? ttl : 0;
        
        try {
          await remoteClient.restore(key, restoreTtl, buffer, "REPLACE");
          console.log(`✅ Migrated: ${key}`);
          count++;
        } catch (err) {
          console.error(`❌ Failed to migrate key ${key}:`, err.message);
        }
      }
    } while (cursor !== "0");
    
    console.log(`\n🎉 Migration complete! Transferred ${count} keys.`);
  } catch (err) {
    console.error("💥 Fatal error during migration:", err);
  } finally {
    localClient.quit();
    remoteClient.quit();
  }
}

migrate();
