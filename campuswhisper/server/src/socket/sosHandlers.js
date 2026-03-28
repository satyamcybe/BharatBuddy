const messageStore = require('../redis/messageStore');

module.exports = (io, socket) => {
  /**
   * sos_help — join the dedicated SOS room and receive its message history.
   */
  socket.on('sos_help', async ({ roomId } = {}) => {
    try {
      socket.join('sos');

      const [messages, onlineCount] = await Promise.all([
        messageStore.getMessages('sos'),
        messageStore.getOnlineCount('sos'),
      ]);

      socket.emit('room_joined', {
        messages,
        onlineCount,
        dominantMood: 'support',
      });
    } catch (err) {
      console.error('[sosHandlers] sos_help error:', err);
    }
  });
};
