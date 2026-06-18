const { v4: uuidv4 } = require('uuid');
const messageStore = require('../redis/messageStore');
const { moderate } = require('../middleware/moderator');

module.exports = (io, socket) => {
  // Send existing whispers from the last 24 hours to newly connected client
  (async () => {
    try {
      const whispers = await messageStore.getWhispers();
      socket.emit('whisper_history', { whispers });
    } catch (err) {
      console.error('[whisperHandlers] whisper_history error:', err);
    }
  })();

  /**
   * send_whisper — broadcast an anonymous whisper to all connected clients.
   */
  socket.on('send_whisper', async ({ content } = {}) => {
    try {
      if (!content || typeof content !== 'string') return;

      const { filtered } = moderate(content);

      const whisper = {
        id: uuidv4(),
        content: filtered,
        createdAt: Date.now(),
      };

      await messageStore.saveWhisper(whisper);
      io.emit('new_whisper', { ...whisper });
    } catch (err) {
      console.error('[whisperHandlers] send_whisper error:', err);
    }
  });
};
