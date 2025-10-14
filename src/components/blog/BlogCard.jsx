// BlogCard.jsx - Individual blog post card component
// Follows existing Card component patterns from Allie

import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

/**
 * BlogCard - Displays a single blog post card
 * @param {Object} post - Blog post object from Firestore
 */
function BlogCard({ post }) {
  // Format date safely
  const formattedDate = post.publishedDate
    ? format(post.publishedDate.toDate(), 'MMMM d, yyyy')
    : '';

  // Calculate reading time if available
  const readingTime = post.readingTime || estimateReadingTime(post.content || post.excerpt);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Hero Image */}
      {post.heroImage && (
        <Link to={`/blog/${post.slug}`} className="block">
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.heroImage.url}
              alt={post.heroImage.alt || post.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category & Reading Time */}
        <div className="flex items-center justify-between mb-3">
          {post.category && (
            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
              {post.category}
            </span>
          )}
          {readingTime && (
            <span className="text-xs text-gray-500">
              {readingTime} min read
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/blog/${post.slug}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
          <span>{formattedDate}</span>
          <Link
            to={`/blog/${post.slug}`}
            className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 transition-colors"
          >
            Read More
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Estimate reading time based on content length
 * @param {string} content - Content text
 * @returns {number} Estimated minutes
 */
function estimateReadingTime(content) {
  if (!content) return 5;
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export default BlogCard;
