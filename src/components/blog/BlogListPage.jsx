// BlogListPage.jsx - Main blog listing page
// Integrated with Allie's existing infrastructure

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BlogService from '../../services/BlogService';
import BlogGrid from './BlogGrid';

function BlogListPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Check if user is actually logged in
  const isActuallyLoggedIn = currentUser && currentUser.uid;

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        setError(null);

        // Add 10-second timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout - please try again')), 10000)
        );

        const postsPromise = BlogService.getAllPosts();
        const allPosts = await Promise.race([postsPromise, timeoutPromise]);

        setPosts(allPosts);
      } catch (err) {
        console.error('Error loading blog posts:', err);
        setError(err.message || 'Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  // Get unique categories
  const categories = ['all', ...new Set(posts.map(p => p.category).filter(Boolean))];

  // Filter posts by category
  const filteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg">{error}</p>
          <Link
            to="/"
            className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Blog - Research & Insights | Check Allie</title>
        <meta
          name="description"
          content="Research-backed insights on cognitive load, mental load redistribution, family management, and AI-powered family harmony strategies from Check Allie."
        />
        <meta property="og:title" content="Blog - Research & Insights | Check Allie" />
        <meta property="og:description" content="Evidence-based strategies for reducing cognitive load and reclaiming family balance" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Navigation - matches home page */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>Allie</h1>
          <div className="flex items-center space-x-2 sm:space-x-6">
            <button
              onClick={() => navigate('/vision')}
              className="text-sm sm:text-base text-gray-700 hover:text-black transition-colors hidden sm:block"
            >
              Long Vision
            </button>
            <button
              onClick={() => navigate('/investors')}
              className="text-sm sm:text-base text-gray-700 hover:text-black transition-colors hidden sm:block"
            >
              Investors
            </button>
            <button
              onClick={() => navigate('/blog')}
              className="text-sm sm:text-base text-gray-700 hover:text-black transition-colors hidden sm:block"
            >
              Blog
            </button>
            {isActuallyLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors sm:bg-transparent sm:px-0 sm:text-base sm:hover:text-black"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="px-4 sm:px-4 py-2 sm:py-2 text-sm sm:text-base bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white py-16 md:py-24 mt-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                Research & Insights
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-6">
                Evidence-based strategies for reducing cognitive load and reclaiming family balance
              </p>
              <p className="text-lg text-blue-200">
                Explore research on mental load distribution, Power Features, AI-driven family management, and more.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Posts' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Blog Grid */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Results Count */}
          <div className="mb-8">
            <p className="text-gray-600">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </p>
          </div>

          {/* Grid */}
          <BlogGrid posts={filteredPosts} />
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-16 mt-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Reduce Your Mental Load?
            </h2>
            <p className="text-xl mb-8 text-orange-100">
              Experience AI-powered family management that actually works. Join thousands of families reclaiming balance with Allie.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/onboarding"
                className="inline-block bg-white text-orange-600 font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Your Free Trial →
              </Link>
              <Link
                to="/"
                className="inline-block border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white/10 transition-colors"
              >
                Take Balance Quiz
              </Link>
            </div>
            <p className="text-sm text-orange-100 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default BlogListPage;
