const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const BLOGS_FILE = path.join(__dirname, 'blogs.json');

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper to read blogs from file
function readBlogs() {
  if (!fs.existsSync(BLOGS_FILE)) return [];
  const data = fs.readFileSync(BLOGS_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to write blogs to file
function writeBlogs(blogs) {
  fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
}

// Get all blog posts
app.get('/api/posts', (req, res) => {
  const blogs = readBlogs();
  res.json(blogs);
});

// Add a new blog post
app.post('/api/posts', (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content || !author) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const blogs = readBlogs();
  const newBlog = {
    id: Date.now(),
    title,
    content,
    author,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  };
  blogs.unshift(newBlog);
  writeBlogs(blogs);
  res.status(201).json(newBlog);
});

// Delete a blog post by id
app.delete('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  let blogs = readBlogs();
  const initialLength = blogs.length;
  blogs = blogs.filter(blog => blog.id !== id);
  if (blogs.length === initialLength) {
    return res.status(404).json({ error: 'Blog not found' });
  }
  writeBlogs(blogs);
  res.json({ success: true });
});

// (Optional) Hello message endpoint
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the website.`);
});
