// server.js
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app'); // ✅ use the exported app here
const { encrypt } = require('./utils/customEncrypter');
const { analyticsSocketHandler } = require('./utils/analyticsSocket');
const Booking = require('./models/Booking');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket logic
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  analyticsSocketHandler(socket);

  socket.on('joinRoom', (bookingId) => {
    socket.join(bookingId);
  });

  socket.on('sendMessage', async ({ bookingId, senderId, text, senderName }) => {
    const encryptedText = encrypt(text);
    const message = {
      sender: senderId,
      text: encryptedText,
      timestamp: new Date(),
      status: 'sent'
    };

    await Booking.findByIdAndUpdate(bookingId, { $push: { messages: message } });

    io.to(bookingId).emit('receiveMessage', {
      ...message,
      text, // send decrypted to frontend
      sender: {
        _id: senderId,
        fullName: senderName
      }
    });
  });

  socket.on('userTyping', (bookingId) => {
    socket.to(bookingId).emit('userTyping');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// Start server only if not in test mode
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 LawyerUp firing on port ${PORT}`);
  });
}

// Export app for Supertest (no need to export server)
module.exports = app;