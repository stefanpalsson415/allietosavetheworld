// HeroPost.jsx - Featured blog post for homepage
// Eye-catching design to drive traffic to blog

import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

/**
 * HeroPost - Large featured blog post card for homepage
 * @param {Object} post - Featured blog post object
 */
function HeroPost({ post }) {
  if (!post) {
    return null;
  }

  const formattedDate = post.publishedDate
    ? format(post.publishedDate.toDate(), 'MMMM d, yyyy')
    : '';

  const readingTime = post.readingTime || 8;

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Hero Image */}
        {post.heroImage && (
          <Link to={`/blog/${post.slug}`} className="block relative h-64 md:h-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
            <img
              src={post.heroImage.url}
              alt={post.heroImage.alt || post.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {/* Featured Badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className="inline-block px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-full shadow-lg">
                ⭐ Featured
              </span>
            </div>
          </Link>
        )}

        {/* Content */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          {/* Category */}
          {post.category && (
            <div className="mb-4">
              <span className="inline-block px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                {post.category}
              </span>
            </div>
          )}

          {/* Title */}
          <Link to={`/blog/${post.slug}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors leading-tight">
              {post.title}
            </h2>
          </Link>

          {/* Excerpt */}
          <p className="text-lg text-gray-600 mb-6 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{readingTime} min read</span>
            {post.author && (
              <>
                <span>•</span>
                <span>By {post.author.name}</span>
              </>
            )}
          </div>

          {/* CTA Button */}
          <div>
            <Link
              to={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Read Full Article
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroPost;
