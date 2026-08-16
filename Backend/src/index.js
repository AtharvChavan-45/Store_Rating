const app = require('./app');
const { testConnection } = require('./db/connection');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {

  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('CRITICAL ERROR: Could not establish a database connection. Exiting application...');
    process.exit(1);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started and listening on port ${PORT}`);
  });
};

startServer();
