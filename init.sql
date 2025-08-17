-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    author VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data for testing
INSERT INTO messages (author, content) VALUES 
    ('Alice', 'Welcome to our simple message app! This is perfect for testing deployment strategies.'),
    ('Bob', 'Great idea! I can easily modify the styling and text to test different deployments.'),
    ('Charlie', 'The Docker setup makes it super easy to spin up and test changes quickly.'),
    ('Diana', 'Love how minimal this is - everything in one place for rapid iteration!');

-- Create an index on created_at for better performance when ordering messages
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);