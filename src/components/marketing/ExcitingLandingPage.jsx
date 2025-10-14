import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ChevronDown, Play, Sparkles, Calendar, Users, 
  Brain, Heart, ClipboardList, Home, Star, MessageSquare,
  BarChart3, Zap, Shield, Eye, Globe, Smartphone
} from 'lucide-react';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

const ExcitingLandingPage = () => {
  const navigate = useNavigate();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Feature blocks with placeholders for screenshots
  const featureBlocks = [
    {
      id: 'smart-calendar',
      category: 'Family Management',
      title: 'From chaos to...',
      titleHighlight: 'Smart Calendar',
      subtitle: 'AI-powered scheduling that understands your family\'s rhythm',
      tags: ['Voice input', 'Photo scanning', 'Email parsing', 'Auto-conflict detection'],
      color: 'indigo',
      gradient: 'from-indigo-500 to-blue-600',
      bgPattern: 'bg-gradient-to-br from-indigo-50 to-blue-50',
      screenshot: '/screenshots/calendar-view.png', // Placeholder for your screenshot
      icon: Calendar,
      demo: {
        title: 'Say goodbye to double-booking',
        description: 'Just speak, snap, or forward - Allie handles the rest'
      }
    },
    {
      id: 'task-balance',
      category: 'Workload Balance',
      title: 'Make invisible work...',
      titleHighlight: 'Visible & Fair',
      subtitle: 'Real-time tracking of who\'s doing what',
      tags: ['Mental load tracking', 'Fair distribution', 'Task sequences', 'Workload analytics'],
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      bgPattern: 'bg-gradient-to-br from-purple-50 to-pink-50',
      screenshot: '/screenshots/task-balance.png', // Placeholder for your screenshot
      icon: BarChart3,
      demo: {
        title: 'See the full picture',
        description: 'Every task, every effort, fairly distributed'
      }
    },
    {
      id: 'allie-ai',
      category: 'AI Assistant',
      title: 'Your family\'s...',
      titleHighlight: 'AI Command Center',
      subtitle: 'Chat with Allie about anything family-related',
      tags: ['Natural conversation', 'Proactive suggestions', 'Memory recall', 'Smart reminders'],
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      bgPattern: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      screenshot: '/screenshots/allie-chat.png', // Placeholder for your screenshot
      icon: MessageSquare,
      demo: {
        title: 'Just ask Allie',
        description: '"When\'s soccer practice?" "Who\'s picking up groceries?" "Schedule date night"'
      }
    },
    {
      id: 'knowledge-graph',
      category: 'Information Hub',
      title: 'Never lose track of...',
      titleHighlight: 'Important Details',
      subtitle: 'Visual knowledge graph connects everything',
      tags: ['Document OCR', 'Provider contacts', 'Medical records', 'School info'],
      color: 'amber',
      gradient: 'from-amber-500 to-orange-600',
      bgPattern: 'bg-gradient-to-br from-amber-50 to-orange-50',
      screenshot: '/screenshots/knowledge-graph.png', // Placeholder for your screenshot
      icon: Brain,
      demo: {
        title: 'Everything connected',
        description: 'See how your family information relates and flows'
      }
    },
    {
      id: 'family-meetings',
      category: 'Relationship Tools',
      title: 'Turn chaos into...',
      titleHighlight: 'Quality Time',
      subtitle: 'Guided family meetings that actually work',
      tags: ['Meeting templates', 'Progress tracking', 'Action items', 'Fun activities'],
      color: 'rose',
      gradient: 'from-rose-500 to-red-600',
      bgPattern: 'bg-gradient-to-br from-rose-50 to-red-50',
      screenshot: '/screenshots/family-meeting.png', // Placeholder for your screenshot
      icon: Heart,
      demo: {
        title: 'Make meetings matter',
        description: 'Structured time that brings your family closer'
      }
    },
    {
      id: 'kids-system',
      category: 'For Kids',
      title: 'Make chores...',
      titleHighlight: 'Actually Fun',
      subtitle: 'Gamified system kids love',
      tags: ['Visual charts', 'Photo completion', 'Palsson Bucks', 'Reward store'],
      color: 'violet',
      gradient: 'from-violet-500 to-purple-600',
      bgPattern: 'bg-gradient-to-br from-violet-50 to-purple-50',
      screenshot: '/screenshots/kids-chores.png', // Placeholder for your screenshot
      icon: Star,
      demo: {
        title: 'Watch them volunteer',
        description: 'Kids racing to complete chores for rewards'
      }
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % featureBlocks.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featureBlocks.length]);

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      
      {/* Hero Section - Tana Style */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
              The inbox that thinks
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                like a parent.
              </span>
            </h1>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              One platform for calendars, tasks, documents, and decisions. 
              Powered by AI that actually understands families.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => navigate('/onboarding')}
                className="px-8 py-4 bg-black text-white rounded-xl text-lg font-semibold hover:bg-gray-800 transition-all flex items-center justify-center group"
              >
                Get Allie free
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button
                onClick={() => navigate('/demo/calendar')}
                className="px-8 py-4 bg-white text-black rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center"
              >
                <Play className="mr-2" size={20} />
                Watch demo
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Shield size={16} /> SOC 2 compliant
              </span>
              <span className="flex items-center gap-2">
                <Globe size={16} /> Works everywhere
              </span>
              <span className="flex items-center gap-2">
                <Smartphone size={16} /> iOS & Android
              </span>
            </div>
          </div>

          {/* Animated scroll indicator */}
          <div className="flex justify-center animate-bounce">
            <ChevronDown size={32} className="text-gray-400" />
          </div>
        </div>
      </section>

      {/* Feature Blocks - Tana/Notion Style */}
      {featureBlocks.map((feature, index) => (
        <section 
          key={feature.id} 
          className={`py-24 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              
              {/* Text Content */}
              <div className={`space-y-8 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <div>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {feature.category}
                  </span>
                  <h2 className="mt-2 text-5xl font-bold text-gray-900">
                    {feature.title}
                  </h2>
                  <h2 className={`text-5xl font-bold bg-gradient-to-r ${feature.gradient} text-transparent bg-clip-text`}>
                    {feature.titleHighlight}
                  </h2>
                </div>
                
                <p className="text-xl text-gray-600">
                  {feature.subtitle}
                </p>
                
                {/* Feature Tags */}
                <div className="flex flex-wrap gap-3">
                  {feature.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className={`px-4 py-2 rounded-full text-sm font-medium bg-${feature.color}-100 text-${feature.color}-800`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Demo Description */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-semibold text-lg mb-2">{feature.demo.title}</h3>
                  <p className="text-gray-600">{feature.demo.description}</p>
                </div>
                
                <button 
                  onClick={() => navigate('/onboarding')}
                  className="inline-flex items-center gap-2 text-lg font-semibold hover:gap-4 transition-all"
                >
                  See it in action
                  <ArrowRight size={20} />
                </button>
              </div>
              
              {/* Screenshot Area */}
              <div className={`relative ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className={`absolute inset-0 ${feature.bgPattern} rounded-3xl transform rotate-3`} />
                <div className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Placeholder for screenshot */}
                  <div className="aspect-[4/3] bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <feature.icon size={64} className="mx-auto mb-4 opacity-50" />
                      <p className="text-xl font-medium mb-2">Screenshot Placeholder</p>
                      <p className="text-gray-400">Add your {feature.id} screenshot here</p>
                      <p className="text-sm text-gray-500 mt-4">{feature.screenshot}</p>
                    </div>
                  </div>
                  
                  {/* Fake browser chrome */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-gray-900 flex items-center px-4 gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-gray-800 rounded px-4 py-1 text-xs text-gray-400">
                        app.allie.family/{feature.id}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements for visual interest */}
                <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-full opacity-20 animate-pulse`} />
                <div className={`absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full opacity-10 animate-pulse animation-delay-1000`} />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bottom CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to get your life back?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Join thousands of families already using Allie to find balance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-white text-black rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all"
            >
              Start free trial
            </button>
            <button
              onClick={() => navigate('/survey/mini')}
              className="px-8 py-4 bg-transparent text-white rounded-xl text-lg font-semibold border-2 border-white hover:bg-white hover:text-black transition-all"
            >
              Take assessment first
            </button>
          </div>
          <p className="mt-8 text-sm opacity-70">
            Free forever for basic features • No credit card required
          </p>
        </div>
      </section>

      <MarketingFooter />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default ExcitingLandingPage;