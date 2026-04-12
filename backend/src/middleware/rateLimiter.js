import redis from "../config/redis.js";

/**
 * Basic Redis-backed rate limiter
 * Drops concurrent connection floods using increment operations in a sliding window.
 */
export const rateLimit = (options) => {
    const { 
        windowMs = 60000, 
        max = 10, 
        message = "Too many requests, please slow down." 
    } = options || {};

    return async (req, res, next) => {
        try {
            // Track authenticated user ID, fallback to client IP
            const identifier = req.user ? req.user._id.toString() : req.ip;
            const routePrefix = (req.baseUrl || "") + (req.route ? req.route.path : req.path);
            const key = `rate-limit:${routePrefix}:${identifier}`;

            const requests = await redis.incr(key);

            if (requests === 1) {
                await redis.pexpire(key, windowMs);
            }

            if (requests > max) {
                return res.status(429).json({
                    success: false,
                    error: message
                });
            }

            next();
        } catch (error) {
            console.error("Redis Rate Limiter Error:", error);
            // Fail open if Redis crashes so users aren't locked out entirely
            next();
        }
    };
};
