const net = require('net');

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find the next available port starting from a given port
 * @param {number} startPort - Starting port number
 * @param {number} maxPort - Maximum port number to try (default: 65535)
 * @returns {Promise<number>} - Available port number
 */
async function findAvailablePort(startPort, maxPort = 65535) {
  for (let port = startPort; port <= maxPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${maxPort}`);
}

/**
 * Get the port to use, either from environment or find next available
 * @param {number} defaultPort - Default port to try first
 * @returns {Promise<number>} - Port number to use
 */
async function getAvailablePort(defaultPort = 3000) {
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
  
  // If the environment port is available, use it
  if (await isPortAvailable(envPort)) {
    return envPort;
  }
  
  // If environment port is in use, find the next available port
  console.log(`Port ${envPort} is in use, searching for next available port...`);
  const availablePort = await findAvailablePort(envPort + 1);
  console.log(`Found available port: ${availablePort}`);
  
  return availablePort;
}

module.exports = {
  isPortAvailable,
  findAvailablePort,
  getAvailablePort
};