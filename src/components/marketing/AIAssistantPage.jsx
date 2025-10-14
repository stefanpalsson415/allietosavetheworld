import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Lock, Brain, Zap, Shield, 
  ArrowRight, Calendar, Heart, Star, BarChart, 
  Users, Check, Clock, Search, List, AlertTriangle,
  RefreshCw, Code, BookOpen, Database, FileText,
  Upload, Camera, Smartphone, Layers, 
  DownloadCloud, Eye, Cpu, Sparkles, PenTool,
  ShoppingBag, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

const AIAssistantPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-['Roboto']">
      {/* Header - using shared component */}
      <MarketingHeader activeLink="/ai-assistant" />
      
      {/* Hero Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-6">Meet Allie, Your Hyper-Intelligent Family Assistant</h1>
          <p className="text-xl font-light max-w-2xl mx-auto">
            Not just another AI chat—Allie learns from your family's unique patterns and data to provide personalized support exactly when you need it.
          </p>
          <div className="flex justify-center mt-8">
            <button 
              onClick={() => navigate('/onboarding')}
              className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-gray-100"
            >
              Try Allie Now
            </button>
          </div>
        </div>
      </section>
      
      {/* Introduction to Allie Chat */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block p-2 bg-purple-100 rounded-lg mb-4">
                <MessageSquare className="text-purple-600" size={24} />
              </div>
              <h2 className="text-3xl font-light mb-6">Introducing Allie Chat—Your Family's New Superpower</h2>
              <p className="text-lg mb-4 font-light">
                Allie Chat is light-years beyond generic AI assistants. It's equipped with advanced Natural Language Understanding that comprehends your family's unique patterns and needs.
              </p>
              <p className="text-lg mb-4 font-light">
                It doesn't just respond to your questions—it anticipates what you need before you even ask, thanks to its contextual awareness of your family dynamics.
              </p>
              <p className="text-lg font-light">
                Unlike other AI assistants that reset with each conversation, Allie learns from every interaction, building a comprehensive understanding of your family over time.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <Brain className="text-blue-600 mr-2" size={24} />
                Enhanced Intelligence
              </h3>
              <p className="text-gray-600 mb-4">
                Allie's advanced NLU capabilities set it apart from ordinary AI:
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <Sparkles className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Intent Recognition</p>
                    <p className="text-sm text-gray-600">
                      Allie understands what you're trying to accomplish, even when you phrase requests in different ways
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <Database className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Context Awareness</p>
                    <p className="text-sm text-gray-600">
                      Maintains memory of past conversations and your family's important information
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <PenTool className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Personalization Engine</p>
                    <p className="text-sm text-gray-600">
                      Creates increasingly tailored responses based on your family's unique needs and preferences
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Showcase */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light mb-4">What Can Allie Chat Do For Your Family?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Allie combines AI, behavioral science, and family systems expertise to create a comprehensive solution for all your family needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Calendar className="text-purple-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Calendar Mastery</h3>
              <p className="text-gray-600 text-sm">
                Allie doesn't just schedule events—it detects patterns, identifies conflicts, and suggests optimal timing based on your family's habits.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Combines data from multiple calendars
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Identifies schedule conflicts before they happen
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Suggests optimal scheduling times
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <Heart className="text-pink-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Relationship Insights</h3>
              <p className="text-gray-600 text-sm">
                Using advanced relationship science, Allie helps couples better understand patterns and improve communication.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Identifies communication patterns
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Suggests science-backed relationship strategies
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Detects workload imbalances in real-time
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <ShoppingBag className="text-green-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Wardrobe Concierge</h3>
              <p className="text-gray-600 text-sm">
                Allie helps parents manage the invisible burden of children's clothing management with AI-powered assistance.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Tracks children's sizes and growth patterns
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Alerts when it's time to replace outgrown items
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Manages hand-me-down cycles between siblings
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <AlertTriangle className="text-yellow-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Proactive Alerts</h3>
              <p className="text-gray-600 text-sm">
                Allie doesn't wait for you to ask—it monitors patterns and sends alerts before issues arise.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Detects potential scheduling conflicts
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Identifies overlapping commitments
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Predicts and prevents burnout
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <BarChart className="text-blue-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Workload Analytics</h3>
              <p className="text-gray-600 text-sm">
                Using proprietary algorithms, Allie quantifies the invisible and visible work in your household.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Measures both visible and invisible labor
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Analyzes workload distribution over time
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Suggests ways to create more balance
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Family Crisis Management</h3>
              <p className="text-gray-600 text-sm">
                When unexpected events happen, Allie helps coordinate resources and responses to keep your family on track.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Helps reorganize schedules during emergencies
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Suggests task redistribution when someone is ill
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Creates backup plans for unexpected events
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block p-2 bg-blue-100 rounded-lg mb-4">
              <RefreshCw className="text-blue-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">Continuous Learning & Adaptation</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Unlike static AI, Allie gets smarter with every interaction. Our proprietary learning system ensures Allie evolves with your family.
            </p>
          </div>
          
          <div className="bg-black text-white rounded-xl overflow-hidden">
            <div className="p-8">
              <h3 className="text-xl font-medium mb-6">The Allie Learning Flywheel</h3>
              <p className="mb-6 font-light">
                Every interaction makes Allie more personalized to your family's needs, creating a virtuous cycle of improvement:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center mx-auto mb-3">
                    <Clock size={20} />
                  </div>
                  <p className="text-sm text-center">
                    Every interaction builds a richer understanding of your family's unique dynamics
                  </p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center mx-auto mb-3">
                    <Brain size={20} />
                  </div>
                  <p className="text-sm text-center">
                    Each document uploaded enhances Allie's ability to provide relevant assistance
                  </p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center mx-auto mb-3">
                    <Zap size={20} />
                  </div>
                  <p className="text-sm text-center">
                    Regular AI updates bring new capabilities to enhance your family management experience
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Advanced AI */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block p-2 bg-indigo-100 rounded-lg mb-4">
              <Cpu className="text-indigo-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">Advanced AI That Keeps Learning</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Allie combines cutting-edge AI with continuous learning to create a system that grows with your family.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mr-4">
                  <Brain className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Natural Language Understanding</h3>
                  <p className="text-gray-600 text-sm font-light">
                    Allie's advanced NLU engine understands nuance, context, and intent—not just keywords.
                  </p>
                  <ul className="mt-3 space-y-1">
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Processes complex, ambiguous requests
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Understands family-specific terminology
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-4">
                  <Database className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Semantic Memory System</h3>
                  <p className="text-gray-600 text-sm font-light">
                    Unlike chatbots that forget your previous interactions, Allie builds a semantic memory of your family.
                  </p>
                  <ul className="mt-3 space-y-1">
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Remembers preferences and past decisions
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Builds connections between seemingly unrelated events
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-4">
                  <FileText className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Document Understanding</h3>
                  <p className="text-gray-600 text-sm font-light">
                    Allie can process and understand all types of family documents to extract relevant information.
                  </p>
                  <ul className="mt-3 space-y-1">
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Extracts details from school forms, medical records, and more
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Connects document content to your family calendar
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mr-4">
                  <Sparkles className="text-yellow-600" size={24} />
                </div>
                <div className="text-sm">
                  <h3 className="font-medium text-lg mb-2">Self-Improving System</h3>
                  <p className="text-gray-600 text-sm font-light">
                    Allie gets more personalized and helpful with every interaction.
                  </p>
                  <ul className="mt-3 space-y-1">
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Learns from successful and unsuccessful interactions
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Self-Revising Knowledge
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      Allie continuously updates its understanding of your family
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-8 rounded-lg text-white">
            <h3 className="text-xl font-medium mb-4">Beyond Ordinary AI</h3>
            <p className="mb-4">
              Unlike generic AI assistants, Allie combines cutting-edge NLU with family-specific data to create a truly personalized experience that evolves with your family.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <Clock size={20} />
                </div>
                <p className="text-sm text-center">
                  Every interaction builds a richer understanding of your family's unique dynamics
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <Brain size={20} />
                </div>
                <p className="text-sm text-center">
                  Generates increasingly personalized recommendations based on your feedback
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <Zap size={20} />
                </div>
                <p className="text-sm text-center">
                  Anticipates needs with greater accuracy as it learns your family's unique patterns
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Privacy and Safety */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block p-2 bg-green-100 rounded-lg mb-4">
              <Lock className="text-green-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">Privacy & Safety by Design</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Your family's data is sacred. That's why we've built Allie with privacy as our highest priority.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Shield className="text-green-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Private by Default</h3>
              <p className="text-gray-600 text-sm">
                All conversations with Allie stay within your family account and are never shared with other users.
              </p>
              <p className="mt-4 text-xs text-gray-500">
                "Allie keeps your family's data completely private. No data is ever shared outside your family account."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Database className="text-green-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Encrypted Storage</h3>
              <p className="text-gray-600 text-sm">
                Your family's sensitive information is protected with enterprise-grade encryption both in transit and at rest.
              </p>
              <p className="mt-4 text-xs text-gray-500">
                "We use bank-level encryption to ensure your family's private information remains secure."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Eye className="text-green-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Transparent Controls</h3>
              <p className="text-gray-600 text-sm">
                You always have complete visibility and control over what data Allie can access and learn from.
              </p>
              <p className="mt-4 text-xs text-gray-500">
                "We believe in transparency and putting you in control of your family's information."
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light mb-4">Experience Allie's Advanced AI Today</h2>
          <p className="text-xl opacity-80 mb-8 max-w-2xl mx-auto font-light">
            The only AI assistant that truly understands and evolves with your family.
          </p>
          <button 
            onClick={() => navigate('/onboarding')}
            className="px-8 py-4 bg-white text-black rounded-md font-medium hover:bg-gray-100"
          >
            Get Started with Allie
          </button>
        </div>
      </section>
      
      {/* Footer - using shared component */}
      <MarketingFooter />
    </div>
  );
};

export default AIAssistantPage;