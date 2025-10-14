// src/components/blog/NotionBlogHomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Calendar, Clock, ChevronRight, Tag,
  TrendingUp, BookOpen, Users, Brain, Heart, Home,
  ArrowRight, X
} from 'lucide-react';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

const NotionBlogHomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Blog categories
  const categories = [
    { id: 'all', name: 'All Posts', icon: BookOpen },
    { id: 'family-balance', name: 'Family Balance', icon: Users },
    { id: 'parenting-tips', name: 'Parenting Tips', icon: Heart },
    { id: 'productivity', name: 'Productivity', icon: TrendingUp },
    { id: 'research', name: 'Research & Insights', icon: Brain },
    { id: 'product-updates', name: 'Product Updates', icon: Home }
  ];

  // Featured/hero post
  const featuredPost = {
    id: 'workload-balance',
    title: 'The Mental Load: Making Invisible Work Visible',
    excerpt: 'Discover how AI can help quantify and fairly distribute the invisible labor in your household.',
    category: 'family-balance',
    author: 'Kimberly Palsson',
    date: '2024-03-15',
    readTime: '7 min read',
    image: '/blog/mental-load-hero.jpg',
    featured: true
  };

  // Blog posts (keeping existing content)
  const blogPosts = [
    {
      id: 'kids-survey',
      title: 'Building AI That Kids Love: Designing the Perfect Family Survey',
      excerpt: 'How we created an engaging, age-appropriate survey system that helps AI understand each child\'s unique needs.',
      category: 'product-updates',
      author: 'Shane Culp',
      date: '2024-03-10',
      readTime: '5 min read',
      image: '/blog/kids-survey.jpg',
      tags: ['AI', 'Children', 'Product Design']
    },
    {
      id: 'relationship-research',
      title: 'What 50 Years of Relationship Research Tells Us About Balance',
      excerpt: 'Key findings from decades of research on couple dynamics and how they inform Allie\'s relationship features.',
      category: 'research',
      author: 'Dr. Sarah Johnson',
      date: '2024-03-08',
      readTime: '10 min read',
      image: '/blog/relationship-research.jpg',
      tags: ['Research', 'Relationships', 'Science']
    },
    {
      id: 'ai-parenting',
      title: 'Can AI Really Understand Your Family? The Science Says Yes',
      excerpt: 'Breaking down how machine learning can capture family patterns while respecting privacy and maintaining trust.',
      category: 'research',
      author: 'Stefan Palsson',
      date: '2024-03-05',
      readTime: '8 min read',
      image: '/blog/ai-family.jpg',
      tags: ['AI', 'Technology', 'Trust']
    },
    {
      id: 'chore-gamification',
      title: '5 Ways to Make Chores Fun for Kids (Backed by Behavioral Science)',
      excerpt: 'Evidence-based strategies for turning household tasks into engaging activities that kids actually enjoy.',
      category: 'parenting-tips',
      author: 'Kimberly Palsson',
      date: '2024-03-01',
      readTime: '6 min read',
      image: '/blog/chores-fun.jpg',
      tags: ['Chores', 'Kids', 'Gamification']
    },
    {
      id: 'calendar-chaos',
      title: 'From Calendar Chaos to Coordination: A Family\'s Journey',
      excerpt: 'How the Johnson family went from missing appointments to seamless scheduling with AI assistance.',
      category: 'family-balance',
      author: 'Guest: The Johnson Family',
      date: '2024-02-28',
      readTime: '4 min read',
      image: '/blog/calendar-success.jpg',
      tags: ['Case Study', 'Calendar', 'Success Story']
    },
    {
      id: 'fair-play-allie',
      title: 'Fair Play Meets AI: How Allie Implements Eve Rodsky\'s Framework',
      excerpt: 'Exploring how we\'ve integrated Fair Play principles into Allie\'s task distribution algorithms.',
      category: 'family-balance',
      author: 'Stefan Palsson',
      date: '2024-02-25',
      readTime: '7 min read',
      image: '/blog/fair-play.jpg',
      tags: ['Fair Play', 'Balance', 'Methodology']
    }
  ];

  // Filter posts based on search and category
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      {/* Hero Section - Notion Style */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              The Allie Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Insights on family balance, parenting in the digital age, and building 
              technology that strengthens relationships.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all flex items-center ${
                  selectedCategory === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon size={16} className="mr-2" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post - Large Card */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="group cursor-pointer"
            onClick={() => navigate(`/blog/${featuredPost.id}`)}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                    Featured
                  </span>
                  <span className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    {formatDate(featuredPost.date)}
                  </span>
                  <span className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    By {featuredPost.author}
                  </p>
                  <span className="text-indigo-600 font-medium flex items-center group-hover:gap-2 transition-all">
                    Read more
                    <ArrowRight size={16} className="ml-1" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No posts found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map(post => (
                <article
                  key={post.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/blog/${post.id}`)}
                >
                  <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(post.date)}
                        </span>
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          By {post.author}
                        </p>
                        <ChevronRight size={20} className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get Family Balance Tips Weekly
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of parents receiving research-backed insights and practical tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-500">
            No spam, unsubscribe anytime.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default NotionBlogHomePage;