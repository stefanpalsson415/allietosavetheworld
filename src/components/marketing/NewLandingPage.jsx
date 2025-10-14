// src/components/marketing/NewLandingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Brain, Heart, BarChart3, FileText, Bot,
  CheckCircle, ChevronRight, Play, Sparkles, Home, ClipboardList,
  TrendingUp, Shield, Book, MessageSquare, Award, DollarSign,
  Zap, Clock, Eye, Share2, Target, Lightbulb, Network, FolderOpen,
  Star, ArrowRight, Menu, X
} from 'lucide-react';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

const NewLandingPage = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState('calendar');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Feature categories for the product showcase
  const featureCategories = [
    {
      id: 'core',
      title: 'Family Management Hub',
      subtitle: 'Everything in one place',
      icon: Home,
      color: 'indigo',
      features: [
        {
          id: 'calendar',
          title: 'Smart Family Calendar',
          description: 'AI-powered scheduling that understands your family\'s rhythm',
          details: [
            'Voice, photo, and email event creation',
            'Automatic conflict detection',
            'Family availability tracking',
            'Smart reminders based on patterns'
          ],
          icon: Calendar,
          demo: '/demo/calendar.mp4'
        },
        {
          id: 'tasks',
          title: 'Balance & Task Management',
          description: 'Fair distribution of visible and invisible labor',
          details: [
            'Real-time workload tracking',
            'Mental load quantification',
            'Kanban-style task board',
            'Automated task sequences'
          ],
          icon: ClipboardList,
          demo: '/demo/tasks.mp4'
        },
        {
          id: 'documents',
          title: 'Document Hub',
          description: 'Never lose important information again',
          details: [
            'OCR document scanning',
            'Auto-categorization',
            'Provider contact management',
            'Quick AI-powered search'
          ],
          icon: FolderOpen,
          demo: '/demo/documents.mp4'
        }
      ]
    },
    {
      id: 'ai',
      title: 'AI Intelligence',
      subtitle: 'Your family\'s personal assistant',
      icon: Brain,
      color: 'purple',
      features: [
        {
          id: 'allie',
          title: 'Meet Allie',
          description: 'AI that truly understands your family',
          details: [
            'Natural conversation interface',
            'Proactive suggestions',
            'Learns from your patterns',
            'Remembers everything'
          ],
          icon: Bot,
          demo: '/demo/allie.mp4'
        },
        {
          id: 'knowledge',
          title: 'Knowledge Graph',
          description: 'See how everything connects',
          details: [
            'Visual information network',
            'Smart pattern recognition',
            'Relationship mapping',
            'Instant information retrieval'
          ],
          icon: Network,
          demo: '/demo/knowledge.mp4'
        }
      ]
    },
    {
      id: 'relationships',
      title: 'Relationship Tools',
      subtitle: 'Strengthen family bonds',
      icon: Heart,
      color: 'rose',
      features: [
        {
          id: 'couple',
          title: 'Strong Relationship',
          description: 'Research-backed couple support',
          details: [
            'Communication tracking',
            'Guided check-ins',
            'Progress visualization',
            'Expert strategies'
          ],
          icon: Heart,
          demo: '/demo/relationship.mp4'
        },
        {
          id: 'meetings',
          title: 'Family Meetings',
          description: 'Make family time count',
          details: [
            'Guided facilitation',
            'Topic suggestions',
            'Action tracking',
            'Meeting history'
          ],
          icon: Users,
          demo: '/demo/meetings.mp4'
        }
      ]
    },
    {
      id: 'kids',
      title: 'For Kids',
      subtitle: 'Fun and engaging for children',
      icon: Star,
      color: 'amber',
      features: [
        {
          id: 'chores',
          title: 'Chore & Reward System',
          description: 'Make responsibility fun',
          details: [
            'Visual chore charts',
            'Photo completion',
            'Family currency',
            'Reward marketplace'
          ],
          icon: Award,
          demo: '/demo/chores.mp4'
        },
        {
          id: 'tracking',
          title: 'Child Development',
          description: 'Track growth and milestones',
          details: [
            'Health records',
            'Education progress',
            'Activity management',
            'Milestone tracking'
          ],
          icon: TrendingUp,
          demo: '/demo/child.mp4'
        }
      ]
    }
  ];

  // Testimonials
  const testimonials = [
    {
      quote: "Allie has transformed how we manage our household. The mental load is finally visible and shared.",
      author: "Sarah M.",
      role: "Mother of 3",
      avatar: "/avatars/sarah.jpg"
    },
    {
      quote: "The AI actually understands our family's needs. It's like having a personal assistant who knows us.",
      author: "David L.",
      role: "Father of 2",
      avatar: "/avatars/david.jpg"
    },
    {
      quote: "My kids love the chore system! They're actually excited to help around the house now.",
      author: "Maria G.",
      role: "Mother of 4",
      avatar: "/avatars/maria.jpg"
    }
  ];

  // Trust indicators
  const trustIndicators = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your family data is encrypted and protected"
    },
    {
      icon: Eye,
      title: "Full Transparency",
      description: "See how AI makes decisions with clear explanations"
    },
    {
      icon: Users,
      title: "Family-First Design",
      description: "Built by parents, for parents"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MarketingHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 opacity-70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              The AI Assistant That
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Balances Your Family Life
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Allie learns your family's unique patterns to fairly distribute tasks, 
              organize information, and strengthen relationships - all in one intelligent platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/onboarding')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2" size={20} />
              </button>
              <button
                onClick={() => navigate('/survey/mini')}
                className="px-8 py-4 bg-white text-indigo-600 rounded-full text-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"
              >
                <Play className="mr-2" size={20} />
                Try Mini Assessment
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
        
        {/* Floating elements for visual interest */}
        <div className="absolute top-20 right-10 animate-float">
          <div className="w-16 h-16 bg-purple-200 rounded-full opacity-50" />
        </div>
        <div className="absolute bottom-20 left-10 animate-float-delayed">
          <div className="w-24 h-24 bg-indigo-200 rounded-full opacity-30" />
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-white border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center justify-center space-x-4">
                <indicator.icon size={32} className="text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{indicator.title}</h3>
                  <p className="text-sm text-gray-600">{indicator.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features Showcase */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything Your Family Needs
            </h2>
            <p className="text-xl text-gray-600">
              One platform that grows with your family
            </p>
          </div>

          {featureCategories.map((category, categoryIndex) => (
            <div key={category.id} className={`mb-20 ${categoryIndex % 2 === 1 ? 'bg-gray-50 -mx-4 px-4 py-12 rounded-3xl' : ''}`}>
              <div className="flex items-center mb-8">
                <category.icon size={32} className={`text-${category.color}-600 mr-4`} />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                  <p className="text-gray-600">{category.subtitle}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {category.features.map((feature) => (
                  <div
                    key={feature.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 cursor-pointer"
                    onClick={() => setActiveFeature(feature.id)}
                  >
                    <div className="flex items-start mb-4">
                      <div className={`p-3 bg-${category.color}-100 rounded-lg mr-4`}>
                        <feature.icon size={24} className={`text-${category.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-gray-600 mb-4">{feature.description}</p>
                      </div>
                    </div>
                    
                    <ul className="space-y-2">
                      {feature.details.map((detail, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>

                    <button className="mt-6 text-indigo-600 font-medium flex items-center hover:text-indigo-700">
                      Learn more
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Getting Started is Simple
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of families already using Allie
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Your Family",
                description: "Quick setup with our guided onboarding",
                icon: Users
              },
              {
                step: "2",
                title: "Let Allie Learn",
                description: "AI observes your patterns and preferences",
                icon: Brain
              },
              {
                step: "3",
                title: "Enjoy Balance",
                description: "Watch as tasks distribute fairly and life gets easier",
                icon: TrendingUp
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <step.icon size={32} className="text-indigo-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Families Love Allie
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of families experiencing true balance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
                <p className="text-gray-700 mb-6 italic text-lg">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4" />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Family Life?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start your free trial today and experience the difference AI can make
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/how-it-works')}
              className="px-8 py-4 bg-transparent text-white rounded-full text-lg font-semibold border-2 border-white hover:bg-white/10 transition-all"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default NewLandingPage;