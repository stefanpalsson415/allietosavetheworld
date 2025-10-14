import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { DollarSign, TrendingUp, Target, Flag } from 'lucide-react';

const FinancingSummarySlide = () => {
  return (
    <SlideTemplate
      title="Financing Overview"
      subtitle="Our capital strategy to build a category-defining company"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <DollarSign className="mr-2" size={24} />
            Funding History & Current Round
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white bg-opacity-80 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-2">Pre-Seed Round (Completed)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-800">$750,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-800">March 2024</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valuation:</span>
                  <span className="font-medium text-gray-800">$4.5M Cap SAFE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lead Investor:</span>
                  <span className="font-medium text-gray-800">Family Tech Ventures</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Key Milestones:</span>
                  <span className="font-medium text-gray-800">MVP, Beta Users</span>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-100 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-2">Seed Round (Current)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Target Amount:</span>
                  <span className="font-medium text-indigo-900">$3.5 Million</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Structure:</span>
                  <span className="font-medium text-indigo-900">Priced Round</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pre-Money Valuation:</span>
                  <span className="font-medium text-indigo-900">$12 Million</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-indigo-900">$1.2M Committed</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Timeline:</span>
                  <span className="font-medium text-indigo-900">Closing by July 2025</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Key Milestones:</span>
                  <span className="font-medium text-indigo-900">10K users, B2B Launch</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-60 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Future Financing (Projected)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Series A:</span>
                  <span className="font-medium text-gray-800">$10M (Q3 2026)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Series B:</span>
                  <span className="font-medium text-gray-800">$25M (2027)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <Flag className="mr-2 text-indigo-600" size={24} />
            Use of Funds
          </h3>
          
          <div className="mb-5">
            <p className="text-gray-700 mb-4">
              The $3.5M seed round will fund us through the next 18 months, with a focus on achieving three core objectives:
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-2">Product Development (45%)</h4>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-indigo-600">1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Scale engineering team to build premium features and tier structure
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-indigo-600">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enhance knowledge graph capabilities and AI insights engine
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-indigo-600">3</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Build enterprise features and integration capabilities
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-2">Go-to-Market (35%)</h4>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-purple-600">1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Build growth marketing team and referral engine
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-purple-600">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Scale customer acquisition channels to reach 100K users
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-purple-600">3</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Launch B2B sales function for enterprise partnerships
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-l-4 border-amber-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-2">Operations & Team (20%)</h4>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Scale infrastructure for growth and enhanced security
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Build customer success team for premium tier support
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">3</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Implement scalable operations processes and systems
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Target size={18} className="text-indigo-600 mr-2" />
              <h4 className="font-medium text-gray-800">Runway & Targets</h4>
            </div>
            <p className="text-sm text-gray-700">
              This funding provides an 18-month runway to reach key milestones for Series A, including 100K active users, 
              35K paying subscribers, and initial B2B partnerships, with projected $5.4M ARR by Q3 2026.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Ideal Investor Profile" 
          icon={<Target size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            We're seeking strategic partners who bring more than capital to help us build a category-defining company:
          </p>
          <div className="space-y-2">
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <h4 className="text-xs font-medium text-blue-800 mb-1">Domain Expertise</h4>
              <p className="text-xs text-gray-700">
                Experience in family tech, SaaS, consumer subscription, or mental health/wellness
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <h4 className="text-xs font-medium text-blue-800 mb-1">Growth & B2B Network</h4>
              <p className="text-xs text-gray-700">
                Connections to potential enterprise customers and growth marketing expertise
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <h4 className="text-xs font-medium text-blue-800 mb-1">Long-Term Vision</h4>
              <p className="text-xs text-gray-700">
                Alignment with our mission to transform family coordination and relationships
              </p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Path to Series A" 
          icon={<TrendingUp size={24} />} 
          className="bg-gradient-to-br from-purple-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            Key metrics and milestones we'll achieve to position for a successful Series A:
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Users:</span>
              <span className="font-medium text-indigo-800">100,000+</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Paying Subscribers:</span>
              <span className="font-medium text-indigo-800">35,000+</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Annual Recurring Revenue:</span>
              <span className="font-medium text-indigo-800">$5.4 Million</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gross Margin:</span>
              <span className="font-medium text-indigo-800">78%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">B2B Partnerships:</span>
              <span className="font-medium text-indigo-800">10+ enterprise clients</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">LTV:CAC Ratio:</span>
              <span className="font-medium text-indigo-800">3.9:1</span>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Capital Efficiency" 
          icon={<DollarSign size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700 mb-3">
            We're building a capital-efficient business with sustainable unit economics:
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current Monthly Burn:</span>
              <div className="flex items-center">
                <span className="font-medium text-amber-800">$120K</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Post-Funding Burn:</span>
              <div className="flex items-center">
                <span className="font-medium text-amber-800">$195K</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Revenue per Employee:</span>
              <div className="flex items-center">
                <span className="font-medium text-amber-800">$195K</span>
                <span className="text-xs text-green-600 ml-1">(Year 3)</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Path to Profitability:</span>
              <div className="flex items-center">
                <span className="font-medium text-amber-800">Q2 2026</span>
                <span className="text-xs text-green-600 ml-1">(projected)</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Customer Payback Period:</span>
              <div className="flex items-center">
                <span className="font-medium text-amber-800">3.9 months</span>
                <span className="text-xs text-green-600 ml-1">(Year 2)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-5 bg-white rounded-xl shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Investment Opportunity</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <DollarSign size={18} className="text-indigo-600 mr-2" />
              Seed Round Details
            </h4>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Round Size:</span>
                <span className="font-medium text-gray-800">$3.5 Million</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pre-Money Valuation:</span>
                <span className="font-medium text-gray-800">$12 Million</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Post-Money Valuation:</span>
                <span className="font-medium text-gray-800">$15.5 Million</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Minimum Investment:</span>
                <span className="font-medium text-gray-800">$250,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Lead Investor Terms:</span>
                <span className="font-medium text-gray-800">$1M+ for board seat</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Instrument:</span>
                <span className="font-medium text-gray-800">Preferred Equity</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Employee Option Pool:</span>
                <span className="font-medium text-gray-800">15% (post-financing)</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <Target size={18} className="text-indigo-600 mr-2" />
              Strategic Partnerships
            </h4>
            
            <p className="text-sm text-gray-700 mb-3">
              Beyond capital, we're looking for investors who can help unlock strategic opportunities:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-indigo-600">1</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-indigo-800">Enterprise Connections</span> - 
                  Introductions to potential B2B customers in corporate wellness, healthcare, and education
                </p>
              </div>
              
              <div className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-indigo-600">2</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-indigo-800">Growth Expertise</span> - 
                  Strategic guidance on scaling consumer subscription businesses and optimizing acquisition
                </p>
              </div>
              
              <div className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-indigo-600">3</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-indigo-800">Technical Talent</span> - 
                  Access to specialized AI/ML talent and advisors in knowledge graph technology
                </p>
              </div>
              
              <div className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-indigo-600">4</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-indigo-800">Future Financing</span> - 
                  Relationships with growth-stage investors for future Series A/B rounds
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default FinancingSummarySlide;