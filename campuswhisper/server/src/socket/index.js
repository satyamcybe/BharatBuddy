module.exports = (io) => {
  const roomHandlers = require('./roomHandlers');
  const sosHandlers = require('./sosHandlers');
  const whisperHandlers = require('./whisperHandlers');

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    roomHandlers(io, socket);
    sosHandlers(io, socket);
    whisperHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};
