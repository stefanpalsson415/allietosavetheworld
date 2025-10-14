// run-proxy.js - Simple wrapper to start the proxy server
const { spawn } = require('child_process');
const path = require('path');

const proxyPath = path.join(__dirname, 'src', 'simple-proxy.js');
console.log(`Starting proxy from: ${proxyPath}`);

// Start the proxy server process
const proxy = spawn('node', [proxyPath], {
  stdio: 'inherit',
  env: process.env
});

proxy.on('error', (err) => {
  console.error('Failed to start proxy server:', err);
});

console.log('Proxy server wrapper initialized, waiting for proxy to start...');