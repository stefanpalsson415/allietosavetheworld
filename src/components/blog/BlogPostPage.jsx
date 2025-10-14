// BlogPostPage.jsx - Individual blog post display with SEO
// Integrated with Allie's infrastructure

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BlogService from '../../services/BlogService';
import BlogComments from './BlogComments';
import KeyTakeaways from './KeyTakeaways';
import CTABox from './CTABox';
import BlogGrid from './BlogGrid';

function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        setError(null);

        // Add 10-second timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout - please try again')), 10000)
        );

        const postPromise = BlogService.getPostBySlug(slug);
        const postData = await Promise.race([postPromise, timeoutPromise]);

        if (!postData) {
          setError('Post not found');
          return;
        }

        setPost(postData);

        // Increment view count
        BlogService.incrementViewCount(postData.id);

        // Fetch related posts (don't let this block the page)
        try {
          const related = await BlogService.getRelatedPosts(postData, 3);
          setRelatedPosts(related);
        } catch (relatedErr) {
          console.warn('Failed to load related posts:', relatedErr);
          // Continue anyway - related posts are optional
        }
      } catch (err) {
        console.error('Error loading blog post:', err);
        setError(err.message || 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This blog post doesn\'t exist.'}</p>
          <Link
            to="/blog"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = post.publishedDate
    ? format(post.publishedDate.toDate(), 'MMMM d, yyyy')
    : '';

  const readingTime = post.readingTime || 8;

  return (
    <>
      <Helmet>
        <title>{post.metaTitle || `${post.title} | Check Allie Blog`}</title>
        <meta name="description" content={post.metaDescription || post.excerpt} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.heroImage && <meta property="og:image" content={post.heroImage.url} />}
        <meta property="og:url" content={`https://checkallie.com/blog/${post.slug}`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        {post.heroImage && <meta name="twitter:image" content={post.heroImage.url} />}

        {/* Article metadata */}
        {post.publishedDate && (
          <meta property="article:published_time" content={post.publishedDate.toDate().toISOString()} />
        )}
        {post.author && <meta property="article:author" content={post.author.name} />}
        {post.tags && post.tags.forEach(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.heroImage?.url,
            "datePublished": post.publishedDate?.toDate().toISOString(),
            "dateModified": post.updatedDate?.toDate().toISOString() || post.publishedDate?.toDate().toISOString(),
            "author": {
              "@type": "Person",
              "name": post.author?.name || "Allie Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Check Allie",
              "logo": {
                "@type": "ImageObject",
                "url": "https://checkallie.com/logo512.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://checkallie.com/blog/${post.slug}`
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/blog')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </button>
          </div>
        </div>

        {/* Hero Image */}
        {post.heroImage && (
          <div className="w-full bg-white">
            <div className="max-w-4xl mx-auto">
              <img
                src={post.heroImage.url}
                alt={post.heroImage.alt || post.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          </div>
        )}

        {/* Article Header */}
        <article className="bg-white">
          <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Category Badge */}
            {post.category && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                  {post.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-200">
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

            {/* AI Summary (if available) */}
            {post.aiSummary && (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-8 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-3xl mr-4">🤖</div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-900 mb-2">
                      Allie's Take
                    </h3>
                    <p className="text-purple-800">
                      {post.aiSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {post.keyTakeaways && post.keyTakeaways.length > 0 && (
              <KeyTakeaways takeaways={post.keyTakeaways} />
            )}

            {/* Article Content - with text selection support for comments */}
            <div
              id="blog-content"
              className="prose prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-gray-200">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA Box */}
            <CTABox />

            {/* Email Signup - Get new posts */}
            <div className="mt-12 mb-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  📬 Get New Posts in Your Inbox
                </h3>
                <p className="text-gray-600 mb-6">
                  Join 1,000+ families getting research-backed insights on reducing mental load
                </p>
                <form className="flex flex-col sm:flex-row gap-3 justify-center">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 max-w-md px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
                <p className="text-sm text-gray-500 mt-3">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </div>
            </div>

            {/* Comment Instructions - Always Visible */}
            <div className="mt-12 mb-6 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <div className="flex items-start">
                <MessageCircle className="text-yellow-600 mt-1 mr-3" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    💬 Add Comments & Highlights
                  </h3>
                  <p className="text-gray-700 mb-2">
                    <strong>How to comment:</strong> Highlight any text in the article above, then add your thoughts!
                  </p>
                  {!currentUser && (
                    <p className="text-sm text-gray-600">
                      <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                        Log in
                      </Link>
                      {' '}or{' '}
                      <Link to="/onboarding" className="text-blue-600 hover:underline font-semibold">
                        create a free account
                      </Link>
                      {' '}to start commenting
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Related Articles
                </h2>
                <BlogGrid posts={relatedPosts} />
              </div>
            )}
          </div>
        </article>

        {/* Google Docs-style commenting */}
        {post && <BlogComments postId={post.id} />}
      </div>
    </>
  );
}

export default BlogPostPage;
