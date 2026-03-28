const { v4: uuidv4 } = require('uuid');
const messageStore = require('../redis/messageStore');
const { moderate } = require('../middleware/moderator');

// Max messages per 30-second window before soft rate-limit
const RATE_LIMIT_THRESHOLD = 5;

/**
 * Derive a dominant mood from the last batch of messages.
 * Falls back to 'neutral' when there are no messages with moods.
 */
function getDominantMood(messages) {
  const tally = {};
  for (const msg of messages) {
    if (msg && msg.mood) {
      tally[msg.mood] = (tally[msg.mood] || 0) + 1;
    }
  }
  if (Object.keys(tally).length === 0) return 'neutral';
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
}

module.exports = (io, socket) => {
  // ------------------------------------------------------------------
  // join_room
  // ------------------------------------------------------------------
  socket.on('join_room', async ({ roomId, sessionToken, year, branch, mood } = {}) => {
    try {
      if (!roomId || !sessionToken) return;

      await messageStore.addToOnline(roomId, sessionToken);
      socket.join(roomId);

      // Persist meta on socket for later use
      socket.data.roomId = roomId;
      socket.data.sessionToken = sessionToken;
      socket.data.year = year;
      socket.data.branch = branch;
      socket.data.mood = mood;

      const [messages, onlineCount] = await Promise.all([
        messageStore.getMessages(roomId),
        messageStore.getOnlineCount(roomId),
      ]);

      const dominantMood = getDominantMood(messages);

      socket.emit('room_joined', { messages, onlineCount, dominantMood });
      io.to(roomId).emit('online_count', { roomId, count: onlineCount });
    } catch (err) {
      console.error('[roomHandlers] join_room error:', err);
    }
  });

  // ------------------------------------------------------------------
  // leave_room
  // ------------------------------------------------------------------
  socket.on('leave_room', async ({ roomId } = {}) => {
    try {
      if (!roomId) return;
      const sessionToken = socket.data.sessionToken;

      if (sessionToken) {
        await messageStore.removeFromOnline(roomId, sessionToken);
      }
      socket.leave(roomId);

      const onlineCount = await messageStore.getOnlineCount(roomId);
      io.to(roomId).emit('online_count', { roomId, count: onlineCount });
    } catch (err) {
      console.error('[roomHandlers] leave_room error:', err);
    }
  });

  // ------------------------------------------------------------------
  // send_message
  // ------------------------------------------------------------------
  socket.on(
    'send_message',
    async ({
      roomId,
      content,
      type = 'text',
      language,
      isSOS = false,
      sessionToken,
      handle,
      year,
      branch,
      mood,
    } = {}) => {
      try {
        if (!roomId || !content || !sessionToken) return;

        const shadowBanned = await messageStore.isShadowBanned(sessionToken);
        const rateCount = await messageStore.checkRateLimit(sessionToken);

        if (!shadowBanned && rateCount > RATE_LIMIT_THRESHOLD) {
          socket.emit('error', { message: 'You are sending messages too fast. Please slow down.' });
          return;
        }

        const { filtered } = moderate(content);

        const message = {
          id: uuidv4(),
          roomId,
          content: filtered,
          type,
          language: language || null,
          isSOS,
          handle: handle || 'Anonymous',
          year: year || null,
          branch: branch || null,
          mood: mood || null,
          createdAt: new Date().toISOString(),
          isShipIt: false,
        };

        await messageStore.saveMessage(roomId, message);

        if (shadowBanned) {
          // Ghost delivery — only the sender sees the message
          socket.emit('new_message', message);
        } else {
          io.to(roomId).emit('new_message', message);
        }

        if (isSOS) {
          io.emit('sos_broadcast', { message });
        }
      } catch (err) {
        console.error('[roomHandlers] send_message error:', err);
      }
    }
  );

  // ------------------------------------------------------------------
  // typing events
  // ------------------------------------------------------------------
  socket.on('typing_start', ({ roomId, handle } = {}) => {
    if (!roomId) return;
    socket.to(roomId).emit('typing', { handle: handle || 'Anonymous' });
  });

  socket.on('typing_stop', ({ roomId } = {}) => {
    if (!roomId) return;
    socket.to(roomId).emit('stop_typing', { handle: socket.data.handle || 'Anonymous' });
  });

  // ------------------------------------------------------------------
  // ship_it
  // ------------------------------------------------------------------
  socket.on('ship_it', async ({ handle, sessionToken } = {}) => {
    try {
      if (!sessionToken) return;

      const rateCount = await messageStore.checkRateLimit(sessionToken);
      if (rateCount > RATE_LIMIT_THRESHOLD) {
        socket.emit('error', { message: 'Too many actions. Please slow down.' });
        return;
      }

      io.emit('ship_it_broadcast', { handle: handle || 'Anonymous' });
    } catch (err) {
      console.error('[roomHandlers] ship_it error:', err);
    }
  });

  // ------------------------------------------------------------------
  // get_online
  // ------------------------------------------------------------------
  socket.on('get_online', async () => {
    try {
      const total = await messageStore.getTotalOnline();
      socket.emit('global_online', { total });
    } catch (err) {
      console.error('[roomHandlers] get_online error:', err);
    }
  });

  // ------------------------------------------------------------------
  // disconnect — clean up online presence
  // ------------------------------------------------------------------
  socket.on('disconnect', async () => {
    try {
      const { roomId, sessionToken } = socket.data || {};
      if (roomId && sessionToken) {
        await messageStore.removeFromOnline(roomId, sessionToken);
        const onlineCount = await messageStore.getOnlineCount(roomId);
        io.to(roomId).emit('online_count', { roomId, count: onlineCount });
      }

      const total = await messageStore.getTotalOnline();
      io.emit('global_online', { total });
    } catch (err) {
      console.error('[roomHandlers] disconnect cleanup error:', err);
    }
  });
};
