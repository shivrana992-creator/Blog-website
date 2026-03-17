const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Use writable path (works in Azure)
const BLOGS_FILE = path.join(process.cwd(), "blogs.json");

// Create file if not exists
if (!fs.existsSync(BLOGS_FILE)) {
  fs.writeFileSync(BLOGS_FILE, "[]");
}

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Read blogs
function readBlogs() {
  try {
    const data = fs.readFileSync(BLOGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Write blogs
function writeBlogs(blogs) {
  fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2));
}

app.get("/", (req, res) => {
  res.send("Hello World");
}

// Get all posts
app.get("/api/posts", (req, res) => {
  const blogs = readBlogs();
  res.json(blogs);
});

// Add post
app.post("/api/posts", (req, res) => {
  const { title, content, author } = req.body;

  if (!title || !content || !author) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const blogs = readBlogs();

  const newBlog = {
    id: Date.now(),
    title,
    content,
    author,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  blogs.unshift(newBlog);
  writeBlogs(blogs);

  res.status(201).json(newBlog);
});

// Delete post
app.delete("/api/posts/:id", (req, res) => {
  const id = parseInt(req.params.id);

  let blogs = readBlogs();
  const newBlogs = blogs.filter((b) => b.id !== id);

  if (blogs.length === newBlogs.length) {
    return res.status(404).json({ error: "Blog not found" });
  }

  writeBlogs(newBlogs);
  res.json({ success: true });
});

// Test route
app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Start server (IMPORTANT for Azure)
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
