const redis = require('./client');

/**
 * Save a message to a room's message list.
 * Keeps the newest 50 messages and expires the key after 24 hours.
 */
async function saveMessage(roomId, message) {
  const key = `messages:${roomId}`;
  await redis.lpush(key, JSON.stringify(message));
  await redis.ltrim(key, 0, 49);
  await redis.expire(key, 86400);
}

/**
 * Get the last 50 messages for a room (newest first).
 */
async function getMessages(roomId) {
  const key = `messages:${roomId}`;
  const raw = await redis.lrange(key, 0, 49);
  return raw.map((item) => {
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Delete a specific message from a room by its id.
 */
async function deleteMessage(roomId, messageId) {
  const key = `messages:${roomId}`;
  const raw = await redis.lrange(key, 0, 49);
  const filtered = raw.filter((item) => {
    try {
      const parsed = JSON.parse(item);
      return parsed.id !== messageId;
    } catch {
      return true;
    }
  });

  // Replace the list with filtered messages
  const pipeline = redis.pipeline();
  pipeline.del(key);
  for (const item of filtered) {
    pipeline.rpush(key, item);
  }
  if (filtered.length > 0) {
    pipeline.expire(key, 86400);
  }
  await pipeline.exec();
}

/**
 * Save a whisper to the sorted set with a timestamp score.
 */
async function saveWhisper(whisper) {
  const score = whisper.createdAt || Date.now();
  await redis.zadd('whispers', score, JSON.stringify(whisper));
}

/**
 * Get all whispers from the last 24 hours.
 */
async function getWhispers() {
  const now = Date.now();
  const since = now - 86400000;
  const raw = await redis.zrangebyscore('whispers', since, now);
  return raw.map((item) => {
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Check rate limit for a session token.
 * Window: 30 seconds. Returns the current count.
 */
async function checkRateLimit(sessionToken) {
  const key = `ratelimit:${sessionToken}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 30);
  }
  return count;
}

/**
 * Shadow-ban a session token for 1 hour.
 */
async function setShadowBan(sessionToken) {
  await redis.set(`shadowban:${sessionToken}`, 1, 'EX', 3600);
}

/**
 * Check if a session token is shadow-banned.
 */
async function isShadowBanned(sessionToken) {
  const val = await redis.get(`shadowban:${sessionToken}`);
  return val !== null;
}

/**
 * Increment the report count for a message.
 * Expires after 24 hours. Returns the new count.
 */
async function incrementReportCount(messageId) {
  const key = `reportcount:${messageId}`;
  const count = await redis.incr(key);
  await redis.expire(key, 86400);
  return count;
}

/**
 * Add a session token to a room's online set.
 */
async function addToOnline(roomId, sessionToken) {
  await redis.sadd(`online:${roomId}`, sessionToken);
}

/**
 * Remove a session token from a room's online set.
 */
async function removeFromOnline(roomId, sessionToken) {
  await redis.srem(`online:${roomId}`, sessionToken);
}

/**
 * Get the number of online users in a room.
 */
async function getOnlineCount(roomId) {
  return redis.scard(`online:${roomId}`);
}

/**
 * Collect all keys matching a pattern using SCAN (non-blocking).
 * @param {string} pattern
 * @returns {Promise<string[]>}
 */
async function scanKeys(pattern) {
  const keys = [];
  let cursor = '0';
  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== '0');
  return keys;
}

/**
 * Get the total number of online users across all rooms.
 */
async function getTotalOnline() {
  const keys = await scanKeys('online:*');
  if (keys.length === 0) return 0;
  const counts = await Promise.all(keys.map((key) => redis.scard(key)));
  return counts.reduce((sum, c) => sum + c, 0);
}

/**
 * Get an array of { roomId, count } for every room that has online users.
 */
async function getOnlineRooms() {
  const keys = await scanKeys('online:*');
  if (keys.length === 0) return [];
  const results = await Promise.all(
    keys.map(async (key) => {
      const roomId = key.replace('online:', '');
      const count = await redis.scard(key);
      return { roomId, count };
    })
  );
  return results.filter((r) => r.count > 0);
}

module.exports = {
  saveMessage,
  getMessages,
  deleteMessage,
  saveWhisper,
  getWhispers,
  checkRateLimit,
  setShadowBan,
  isShadowBanned,
  incrementReportCount,
  addToOnline,
  removeFromOnline,
  getOnlineCount,
  getTotalOnline,
  getOnlineRooms,
};
