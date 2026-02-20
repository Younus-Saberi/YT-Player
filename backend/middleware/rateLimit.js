import config from '../config.js';

const ipRequests = new Map();

export function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // Initialize or get requests for this IP
  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, []);
  }

  // Clean old requests (older than 1 minute)
  const requests = ipRequests.get(ip);
  const recentRequests = requests.filter((time) => time > oneMinuteAgo);
  ipRequests.set(ip, recentRequests);

  // Check rate limit
  const maxPerMinute = config.RATELIMIT_PER_MINUTE || 5;

  if (recentRequests.length >= maxPerMinute) {
    return res.status(429).json({
      success: false,
      message: `Rate limit exceeded. Max ${maxPerMinute} downloads per minute.`,
    });
  }

  // Add current request
  recentRequests.push(now);
  ipRequests.set(ip, recentRequests);

  next();
}

// Cleanup old IPs periodically
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [ip, requests] of ipRequests.entries()) {
    const recentRequests = requests.filter((time) => time > oneHourAgo);

    if (recentRequests.length === 0) {
      ipRequests.delete(ip);
    } else {
      ipRequests.set(ip, recentRequests);
    }
  }
}, 10 * 60 * 1000); // Cleanup every 10 minutes
