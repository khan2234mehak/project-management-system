require('dotenv').config();
const http = require('http');
const app = require('./app');
const { testConnection } = require('./config/db');
const initSocket = require('./sockets');
const { attachIo: attachIoToNotifications } = require('./utils/notificationService');
const { attachIo: attachIoToTasks } = require('./controllers/taskController');
const { attachIo: attachIoToComments } = require('./controllers/commentController');

const PORT = process.env.PORT || 5007;

const server = http.createServer(app);
const io = initSocket(server);

// Give the notification service and controllers access to the io instance
// so they can emit real-time events without circular imports.
attachIoToNotifications(io);
attachIoToTasks(io);
attachIoToComments(io);

(async () => {
  const connected = await testConnection();
  if (!connected) {
    console.warn('⚠️  Starting server without a verified DB connection. API calls that touch the DB will fail until MySQL is reachable.');
  }

  server.listen(PORT, () => {
    console.log(`🚀 PMS API server listening on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Storage provider: ${process.env.STORAGE_PROVIDER || 'local'}`);
  });
})();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
