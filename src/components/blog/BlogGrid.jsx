// BlogGrid.jsx - Grid layout for blog post cards
// Follows Allie's responsive grid patterns

import React from 'react';
import BlogCard from './BlogCard';

/**
 * BlogGrid - Responsive grid layout for blog posts
 * @param {Array} posts - Array of blog post objects
 * @param {string} emptyMessage - Message to show when no posts
 */
function BlogGrid({ posts, emptyMessage = "No blog posts yet. Check back soon!" }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-gray-600 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map(post => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default BlogGrid;
