import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, MessageSquare, Calendar, Camera, Clock, Bell, 
  Search, ArrowRight, CheckCircle, Smartphone, Upload,
  AlertCircle, Bookmark, Star, Download, RefreshCw, 
  Users, Heart, FileText, BookOpen, Image, Mic, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

const FamilyMemoryPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-['Roboto']">
      {/* Header - using shared component */}
      <MarketingHeader activeLink="/family-memory" />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-6">Family Memory</h1>
          <p className="text-xl font-light max-w-2xl mx-auto">
            Your family's collective knowledge, memories, and documents—organized, searchable, and always available when you need it.
          </p>
          <div className="flex justify-center mt-8">
            <button 
              onClick={() => navigate('/signup')}
              className="px-6 py-3 bg-white text-indigo-600 rounded-md font-medium hover:bg-gray-100 mr-4"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => navigate('/how-it-works')}
              className="px-6 py-3 border border-white text-white rounded-md font-medium hover:bg-white hover:bg-opacity-10"
            >
              See How It Works
            </button>
          </div>
        </div>
      </section>
      
      {/* Introduction */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block p-2 bg-indigo-100 rounded-lg mb-4">
              <Brain className="text-indigo-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">The Power of Collective Memory</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Never lose important information or documents again—Family Memory creates a secure, shared knowledge base for your entire household.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <Brain className="text-indigo-600 mr-2" size={24} />
                Key Features
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <Search className="text-indigo-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Smart Document Search</p>
                    <p className="text-sm text-gray-600">
                      Find any document instantly with AI-powered semantic search that understands the meaning behind your request
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <Upload className="text-indigo-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Effortless Document Processing</p>
                    <p className="text-sm text-gray-600">
                      Upload any document format—Allie automatically extracts, categorizes, and connects the important information
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <Bell className="text-indigo-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Smart Reminders</p>
                    <p className="text-sm text-gray-600">
                      Allie automatically identifies important dates and deadlines in your documents and creates proactive reminders
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-lg mb-4 font-light">
                Every family manages hundreds of documents, details, and memories—from medical records to school forms to important dates. But this information is often scattered across email inboxes, drawers, and individual memories.
              </p>
              <p className="text-lg mb-4 font-light">
                Family Memory creates a unified knowledge system that captures, organizes, and makes accessible all this information when you need it, preventing the countless "Where did we put that?" moments that consume family time and energy.
              </p>
              <p className="text-lg font-light">
                Using advanced AI, Family Memory doesn't just store documents—it understands them, connecting related information and making everything searchable in natural language.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light mb-4">How Family Memory Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              A simple process that turns document chaos into organized knowledge
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <Upload className="text-indigo-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">1. Upload Anything</h3>
              <p className="text-gray-600 text-sm">
                Simply upload or forward documents of any type—paper forms (via photo), PDFs, emails, digital documents, even images.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  School forms & communications
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Medical records & insurance
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Sports & activity schedules
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <Brain className="text-indigo-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">2. AI Processing</h3>
              <p className="text-gray-600 text-sm">
                Allie's AI automatically extracts important information, categorizes documents, and creates connections between related items.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  OCR for paper documents
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Named entity recognition
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Date & deadline extraction
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <Search className="text-indigo-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">3. Instant Access</h3>
              <p className="text-gray-600 text-sm">
                Find anything instantly with natural language search or browse by categories. Information is available to all family members.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Ask using everyday language
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Access from any device
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                  Secure, role-based sharing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Benefits */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light mb-4">Key Benefits</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              How Family Memory transforms document management for busy households
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-4">
                  <Clock className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Save Time & Reduce Stress</h3>
                  <p className="text-gray-600 text-sm">
                    The average family spends 5+ hours per month looking for documents and information. Family Memory eliminates this wasted time completely.
                  </p>
                  <div className="mt-3 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                    <p className="italic">"I used to spend hours searching for forms, medical records, and school information. Now I just ask Allie and everything is there instantly." - Sarah W., mother of 3</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-4">
                  <AlertCircle className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Never Miss Important Deadlines</h3>
                  <p className="text-gray-600 text-sm">
                    Family Memory automatically identifies forms that need to be returned, registrations that need to be renewed, and appointments that need to be scheduled.
                  </p>
                  <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <p className="italic">"Allie reminded me about our insurance renewal 2 weeks before the deadline—something I would have completely forgotten about." - Michael T.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mr-4">
                  <Users className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Share the Mental Load</h3>
                  <p className="text-gray-600 text-sm">
                    Family Memory allows all family members to access important information, reducing the burden on one person to remember everything.
                  </p>
                  <div className="mt-3 text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                    <p className="italic">"For the first time, both my partner and I have equal access to all our family info. No more 'I don't know where that is' situations." - James K.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mr-4">
                  <Smartphone className="text-yellow-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">On-Demand Access Anywhere</h3>
                  <p className="text-gray-600 text-sm">
                    Access your family's information from any device, whether you're at a doctor's appointment, school meeting, or traveling.
                  </p>
                  <div className="mt-3 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    <p className="italic">"Being able to pull up our insurance card and medical history during an unexpected ER visit was truly invaluable." - Lisa M.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block p-2 bg-blue-100 rounded-lg mb-4">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">Family Memory in Action</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              How families like yours are using Family Memory to simplify life
            </p>
          </div>
          
          <div className="space-y-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-medium mb-4">School Document Management</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 mb-4">
                    From permission slips to report cards, school generates endless paperwork that needs to be tracked, completed, and referenced.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Automatically categorize school communications
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Track permission forms and their due dates
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Maintain records of report cards and assessments
                    </li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 italic mb-3">Ask Allie:</p>
                  <p className="font-medium mb-2">"Where's Emma's permission form for the science museum trip?"</p>
                  <p className="text-sm text-gray-600 italic">Allie instantly retrieves the form, noting it needs to be signed and returned by Friday.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-medium mb-4">Medical Record Management</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 mb-4">
                    Keep all your family's medical information organized and accessible—from immunization records to insurance details to medication schedules.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Store and organize all medical records
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Track medication schedules and dosages
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Quick access to insurance information
                    </li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 italic mb-3">Ask Allie:</p>
                  <p className="font-medium mb-2">"When was Michael's last tetanus shot?"</p>
                  <p className="text-sm text-gray-600 italic">Allie instantly retrieves the date from his immunization record and notes that he'll need a booster in 3 years.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-medium mb-4">Family Knowledge Base</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 mb-4">
                    Create a shared repository of family knowledge—from recipes to home maintenance details to children's clothing sizes.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Store important household information
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Track children's sizes and preferences
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      Document family recipes and traditions
                    </li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 italic mb-3">Ask Allie:</p>
                  <p className="font-medium mb-2">"What size shoes does Jamie wear now?"</p>
                  <p className="text-sm text-gray-600 italic">Allie provides the current size and notes that based on growth patterns, Jamie will likely need a new size in about 3 months.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Security Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Info className="text-gray-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-3">Your Family's Privacy & Security</h3>
                <p className="text-gray-600 mb-4">
                  We understand that your family's documents and information are deeply personal and private. That's why we've built Family Memory with the highest standards of privacy and security:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">End-to-end encryption for all documents and data</p>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">Role-based access control for sensitive information</p>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">Your data is never used to train AI models or shared with third parties</p>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">SOC 2 compliance and regular security audits</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light mb-4">Transform Your Family's Information Management</h2>
          <p className="text-xl opacity-80 mb-8 font-light max-w-2xl mx-auto">
            Join thousands of families who've eliminated document chaos and information overload with Family Memory
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white text-indigo-600 rounded-md font-medium hover:bg-gray-100"
          >
            Start Your Free Trial
          </button>
          <p className="mt-4 text-sm opacity-80">No credit card required. 30-day free trial.</p>
        </div>
      </section>
      
      {/* Footer - using shared component */}
      <MarketingFooter />
    </div>
  );
};

export default FamilyMemoryPage;