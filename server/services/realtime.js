/**
 * Socket.IO layer: live upload progress, shared-folder changes, Notes sync and
 * device presence. Large file bytes never travel over sockets — they stay on
 * plain HTTP; sockets only carry small status messages.
 */
const { Server } = require('socket.io');
const { ACCESS_PIN } = require('../config/settings');

let io = null;
/** socketId -> { id, name, connectedAt } */
const devices = new Map();

function deviceList() {
  return Array.from(devices.values()).sort((a, b) => a.connectedAt - b.connectedAt);
}

function initRealtime(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  // If a PIN protects the HTTP API, protect the live channel too.
  io.use((socket, next) => {
    if (!ACCESS_PIN) return next();
    const provided = socket.handshake.auth && socket.handshake.auth.pin;
    if (provided && provided === ACCESS_PIN) return next();
    next(new Error('A valid PIN is required.'));
  });

  io.on('connection', (socket) => {
    const requested = String((socket.handshake.auth && socket.handshake.auth.deviceName) || '')
      .slice(0, 40)
      .trim();
    const device = { id: socket.id, name: requested || `Device ${devices.size + 1}`, connectedAt: Date.now() };
    devices.set(socket.id, device);
    io.emit('devices:update', deviceList());
    socket.on('disconnect', () => {
      devices.delete(socket.id);
      io.emit('devices:update', deviceList());
    });
  });
  return io;
}

/** Safe to call before init (no-op), so controllers never crash if sockets are down. */
function emit(event, payload) {
  if (io) io.emit(event, payload);
}

module.exports = { initRealtime, emit, deviceList };
