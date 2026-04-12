import Redis from "ioredis";

const redisOptions = process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const redis = new Redis(redisOptions);

redis.on("connect", () => {
  console.log("🟥 Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

export default redis;
