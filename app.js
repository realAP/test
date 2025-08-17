const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Enhanced logging for debugging
console.log('🚀 Starting application...');
console.log('📊 Application Info:');
console.log(`- Node.js Version: ${process.version}`);
console.log(`- Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`- Port: ${port}`);
console.log(`- Process ID: ${process.pid}`);
console.log(`- Working Directory: ${process.cwd()}`);
console.log(`- Platform: ${process.platform}`);
console.log(`- Architecture: ${process.arch}`);

// Middleware with logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip || req.connection.remoteAddress}`);
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'testdb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Main route - show form and messages
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    const messages = result.rows;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Simple Message App</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 50px auto; 
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { 
                color: #333; 
                text-align: center;
                margin-bottom: 30px;
            }
            .form-section {
                background-color: #e8f4fd;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            input, textarea, button { 
                width: 100%; 
                padding: 12px; 
                margin: 8px 0; 
                border: 1px solid #ddd;
                border-radius: 5px;
                box-sizing: border-box;
            }
            button { 
                background-color: #007bff; 
                color: white; 
                border: none;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover { 
                background-color: #0056b3; 
            }
            .message { 
                background-color: #f8f9fa; 
                padding: 15px; 
                margin: 10px 0; 
                border-left: 4px solid #007bff;
                border-radius: 5px;
            }
            .message-author { 
                font-weight: bold; 
                color: #007bff; 
            }
            .message-time { 
                color: #666; 
                font-size: 12px; 
            }
            .message-content { 
                margin: 10px 0; 
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Simple Message App - Deployment Testing</h1>
            
            <div class="form-section">
                <h2>Add New Message</h2>
                <form action="/add" method="POST">
                    <input type="text" name="author" placeholder="Your name" required>
                    <textarea name="content" placeholder="Your message" rows="3" required></textarea>
                    <button type="submit">Send Message</button>
                </form>
            </div>

            <h2>Messages (${messages.length})</h2>
            ${messages.map(msg => `
                <div class="message">
                    <div class="message-author">${escapeHtml(msg.author)}</div>
                    <div class="message-content">${escapeHtml(msg.content)}</div>
                    <div class="message-time">${new Date(msg.created_at).toLocaleString()}</div>
                </div>
            `).join('')}
            
            ${messages.length === 0 ? '<p style="text-align: center; color: #666;">No messages yet. Be the first to post!</p>' : ''}
        </div>
    </body>
    </html>
    `;

    res.send(html);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send(`
      <h1>Database Error</h1>
      <p>Could not connect to database. Make sure PostgreSQL is running.</p>
      <p>Error: ${err.message}</p>
    `);
  }
});

// Add message route
app.post('/add', async (req, res) => {
  const { author, content } = req.body;
  
  if (!author || !content) {
    return res.status(400).send('Author and content are required');
  }

  try {
    await pool.query(
      'INSERT INTO messages (author, content, created_at) VALUES ($1, $2, NOW())',
      [author, content]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error inserting message:', err);
    res.status(500).send('Error saving message: ' + err.message);
  }
});

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Enhanced diagnostic endpoints for debugging
app.get('/debug/info', (req, res) => {
  console.log('🔍 Debug info requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    application: {
      name: 'simple-fullstack-app',
      version: '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      workingDirectory: process.cwd(),
      memoryUsage: process.memoryUsage()
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      POSTGRES_HOST: process.env.POSTGRES_HOST,
      POSTGRES_DB: process.env.POSTGRES_DB,
      POSTGRES_USER: process.env.POSTGRES_USER,
      POSTGRES_PORT: process.env.POSTGRES_PORT,
      // Don't expose password for security
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '[SET]' : '[NOT SET]',
      // Coolify specific variables
      COOLIFY_BRANCH: process.env.COOLIFY_BRANCH,
      COOLIFY_RESOURCE_UUID: process.env.COOLIFY_RESOURCE_UUID,
      COOLIFY_CONTAINER_NAME: process.env.COOLIFY_CONTAINER_NAME,
      SERVICE_URL_APP: process.env.SERVICE_URL_APP,
      SERVICE_FQDN_APP: process.env.SERVICE_FQDN_APP,
      COOLIFY_URL: process.env.COOLIFY_URL,
      COOLIFY_FQDN: process.env.COOLIFY_FQDN
    }
  });
});

app.get('/debug/db', async (req, res) => {
  console.log('🗄️ Database debug info requested');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) as message_count FROM messages');
    const dbVersion = await client.query('SELECT version()');
    client.release();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        messageCount: parseInt(result.rows[0].message_count),
        version: dbVersion.rows[0].version,
        config: {
          host: process.env.POSTGRES_HOST || 'localhost',
          database: process.env.POSTGRES_DB || 'testdb',
          user: process.env.POSTGRES_USER || 'postgres',
          port: process.env.POSTGRES_PORT || 5432
        }
      }
    });
  } catch (err) {
    console.error('❌ Database connection error:', err);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: err.message,
        code: err.code
      }
    });
  }
});

app.get('/debug/network', (req, res) => {
  console.log('🌐 Network debug info requested');
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    network: {
      hostname: os.hostname(),
      interfaces: networkInterfaces,
      request: {
        ip: req.ip || req.connection.remoteAddress,
        headers: req.headers,
        url: req.url,
        method: req.method,
        protocol: req.protocol,
        secure: req.secure
      }
    }
  });
});

// Enhanced network binding diagnostics
const server = app.listen(port, '0.0.0.0', () => {
  console.log('🚀 Server Successfully Started!');
  console.log('================================');
  console.log(`📍 Listening on: http://0.0.0.0:${port}`);
  console.log(`📍 Process ID: ${process.pid}`);
  console.log(`📍 Working Directory: ${process.cwd()}`);
  
  // Get network interface information
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  console.log('📡 Network Interfaces:');
  Object.keys(networkInterfaces).forEach(iface => {
    networkInterfaces[iface].forEach(details => {
      if (details.family === 'IPv4' && !details.internal) {
        console.log(`   ${iface}: ${details.address}`);
      }
    });
  });
  
  console.log('🌍 Environment Configuration:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- PORT: ${process.env.PORT || 3000}`);
  console.log(`- POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'localhost'}`);
  console.log(`- POSTGRES_DB: ${process.env.POSTGRES_DB || 'testdb'}`);
  console.log(`- POSTGRES_USER: ${process.env.POSTGRES_USER || 'postgres'}`);
  
  // Coolify-specific variables
  if (process.env.COOLIFY_RESOURCE_UUID) {
    console.log('🔷 Coolify Environment Detected:');
    console.log(`- COOLIFY_CONTAINER_NAME: ${process.env.COOLIFY_CONTAINER_NAME}`);
    console.log(`- SERVICE_FQDN_APP: ${process.env.SERVICE_FQDN_APP}`);
    console.log(`- COOLIFY_URL: ${process.env.COOLIFY_URL}`);
    console.log(`- COOLIFY_FQDN: ${process.env.COOLIFY_FQDN}`);
  }
  
  console.log('');
  console.log('🔗 Available Endpoints:');
  console.log('- Main App: /');
  console.log('- Health Check: /health');
  console.log('- Debug Info: /debug/info');
  console.log('- Database Status: /debug/db');
  console.log('- Network Info: /debug/network');
  console.log('- Connection Test: /debug/connection');
  console.log('');
  console.log('✅ Server is ready to accept connections!');
  
  // Test internal connectivity
  setTimeout(() => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/health',
      method: 'GET'
    }, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Internal health check passed - server is accessible locally');
      } else {
        console.log(`⚠️  Internal health check returned status: ${res.statusCode}`);
      }
    });
    
    req.on('error', (err) => {
      console.log(`❌ Internal health check failed: ${err.message}`);
    });
    
    req.end();
  }, 2000);
});

// Enhanced connection logging
server.on('connection', (socket) => {
  const remoteAddress = socket.remoteAddress;
  const remotePort = socket.remotePort;
  console.log(`🔗 New connection from ${remoteAddress}:${remotePort}`);
  
  socket.on('close', () => {
    console.log(`📤 Connection closed from ${remoteAddress}:${remotePort}`);
  });
  
  socket.on('error', (err) => {
    console.log(`❌ Socket error from ${remoteAddress}:${remotePort}: ${err.message}`);
  });
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
    process.exit(1);
  } else if (err.code === 'EACCES') {
    console.error(`❌ Permission denied to bind to port ${port}`);
    process.exit(1);
  } else {
    console.error(`❌ Server error: ${err.message}`);
    process.exit(1);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed. Process terminated.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed. Process terminated.');
    process.exit(0);
  });
});