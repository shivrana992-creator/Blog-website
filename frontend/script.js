// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up dark mode toggle');
    
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    if (!themeToggle) {
        console.error('Theme toggle button not found!');
        return;
    }
    
    console.log('Theme toggle button found:', themeToggle);
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    console.log('Current theme from localStorage:', currentTheme);
    
    // Apply the saved theme
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '☀️ Light Mode';
        console.log('Applied dark mode');
    }
    
    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', function() {
        console.log('Theme toggle clicked!');
        body.classList.toggle('dark-mode');
        
        // Update button text and save preference
        if (body.classList.contains('dark-mode')) {
            themeToggle.textContent = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
            console.log('Switched to dark mode');
        } else {
            themeToggle.textContent = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
            console.log('Switched to light mode');
        }
    });
    
    console.log('Dark mode toggle setup complete');
});

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    // Function to show section
    function showSection(sectionId) {
        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all nav links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.querySelector(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Add active class to clicked nav link
        const activeLink = document.querySelector(`[href="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Close mobile menu if open
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            hamburgerBtn.classList.remove('active');
        }
    }
    
    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            showSection(targetId);
            
            // Update URL hash without scrolling
            history.pushState(null, null, targetId);
        });
    });
    
    // Handle hamburger menu toggle
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
                hamburgerBtn.classList.remove('active');
            }
        });
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        const hash = window.location.hash || '#home';
        showSection(hash);
    });
    
    // Show initial section based on URL hash
    const initialHash = window.location.hash || '#home';
    showSection(initialHash);
});

// Blog functionality (backend only, no localStorage)
document.addEventListener('DOMContentLoaded', function() {
    const blogForm = document.getElementById('blogForm');
    const clearFormBtn = document.getElementById('clearForm');
    const blogPostsContainer = document.getElementById('blogPosts');
    const API_URL = 'http://localhost:3000/api/posts';

    // Load blogs from backend
    loadBlogs();

    // Handle form submission
    if (blogForm) {
        blogForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(blogForm);
            const blogData = {
                title: formData.get('title'),
                content: formData.get('content'),
                author: formData.get('author')
            };
            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(blogData)
                });
                if (!res.ok) throw new Error('Failed to add blog');
                const newBlog = await res.json();
                addBlogToPage(newBlog, true);
                updateStatistics(document.querySelectorAll('.blog-post').length);
                showSuccessMessage('Blog post published successfully!');
                blogForm.reset();
                setTimeout(() => {
                    showSection('#posts');
                    document.querySelector('[href="#posts"]').classList.add('active');
                    document.querySelector('[href="#home"]').classList.remove('active');
                }, 1000);
            } catch (err) {
                alert('Error adding blog: ' + err.message);
            }
        });
    }

    // Handle clear form button
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', function() {
            blogForm.reset();
        });
    }

    // Load blogs from backend
    async function loadBlogs() {
        blogPostsContainer.innerHTML = '';
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error('Failed to fetch blogs');
            const blogs = await res.json();
            blogs.forEach(blog => addBlogToPage(blog, false));
            updateStatistics(blogs.length);
        } catch (err) {
            showSuccessMessage('Could not load blogs from server.');
            updateStatistics(0);
        }
    }

    // Add a blog post to the page
    function addBlogToPage(blogData, isNew) {
        const blogArticle = document.createElement('article');
        blogArticle.className = 'blog-post';
        blogArticle.setAttribute('data-blog-id', blogData.id);
        let deleteBtnHtml = '';
        if (typeof blogData.id === 'number') {
            // Only user-created posts get backend delete
            deleteBtnHtml = `<button class="delete-btn" onclick="deleteBlog(${blogData.id})" title="Delete this post">🗑️</button>`;
        }
        blogArticle.innerHTML = `
            <div class="blog-header">
                <h2>${blogData.title}</h2>
                ${deleteBtnHtml}
            </div>
            <p>${blogData.content}</p>
            <small>Posted on: ${blogData.date} | Author: ${blogData.author}</small>
        `;
        if (isNew && blogPostsContainer.firstChild) {
            blogPostsContainer.insertBefore(blogArticle, blogPostsContainer.firstChild); // always at top
        } else {
            blogPostsContainer.appendChild(blogArticle);
        }
    }

    // Delete blog post (backend)
    window.deleteBlog = async function(blogId) {
        // Ensure blogId is a number
        blogId = Number(blogId);
        if (isNaN(blogId)) return;
        if (confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
            try {
                const res = await fetch(`${API_URL}/${blogId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete blog');
                const blogElement = document.querySelector(`[data-blog-id="${blogId}"]`);
                if (blogElement) {
                    blogElement.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        blogElement.remove();
                        showSuccessMessage('Blog post deleted successfully!');
                        // Reload blogs to update stats
                        loadBlogs();
                    }, 300);
                }
            } catch (err) {
                alert('Error deleting blog: ' + err.message);
            }
        }
    };

    // Update statistics (count only backend blogs)
    function updateStatistics(backendCount) {
        const totalPosts = backendCount;
        const statElements = [
            'totalPosts', 'aboutTotalPosts'
        ];
        statElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id.includes('Posts')) {
                    element.textContent = totalPosts;
                }
            }
        });
    }

    // Show success message
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        const newBlogSection = document.querySelector('#new-blog');
        newBlogSection.insertBefore(successDiv, newBlogSection.firstChild);
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }

    // Show section (reused from navigation)
    function showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        const navLinks = document.querySelectorAll('.nav-link');
        sections.forEach(section => section.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        const targetSection = document.querySelector(sectionId);
        if (targetSection) targetSection.classList.add('active');
        const activeLink = document.querySelector(`[href="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');
    }
});