const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log('Environment variables:');
  console.log(`- POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'localhost'}`);
  console.log(`- POSTGRES_DB: ${process.env.POSTGRES_DB || 'testdb'}`);
  console.log(`- POSTGRES_USER: ${process.env.POSTGRES_USER || 'postgres'}`);
});