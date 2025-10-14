import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, Quote } from './components';
import { 
  ArrowRight, 
  Target, 
  Users, 
  DollarSign, 
  Flag, 
  Calendar, 
  Briefcase,
  Clock,
  Check,
  Activity
} from 'lucide-react';

const NextStepsSlide = () => {
  return (
    <SlideTemplate 
      title="Next Steps" 
      subtitle="Join us in rebalancing families and creating household equality"
    >
      <div className="grid grid-cols-12 gap-4 h-full">
        
        {/* Immediate Actions */}
        <div className="col-span-6">
          <Card
            icon={<Clock size={20} />}
            title="Immediate Milestones (30-90 Days)"
            className="bg-gradient-to-br from-indigo-50 to-white h-full"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-md font-semibold text-indigo-700 flex items-center">
                  <Target className="mr-2" size={16} />
                  Product Development
                </h4>
                <ul className="ml-6 text-sm space-y-1">
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Improve task weight visualization and analysis dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Launch enhanced provider integration framework</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Finalize family knowledge graph architecture</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-md font-semibold text-indigo-700 flex items-center">
                  <Users className="mr-2" size={16} />
                  User Growth
                </h4>
                <ul className="ml-6 text-sm space-y-1">
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Reach 600 daily active users</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Achieve 14-day retention rate of 40%</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Launch targeted growth experiments in key markets</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-md font-semibold text-indigo-700 flex items-center">
                  <DollarSign className="mr-2" size={16} />
                  Financial
                </h4>
                <ul className="ml-6 text-sm space-y-1">
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Complete seed funding round ($2.5M target)</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Establish core team with first 7 key hires</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={14} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Implement financial tracking and reporting system</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Key Milestones for Next 12 Months */}
        <div className="col-span-6">
          <Card
            icon={<Flag size={20} />}
            title="Key Milestones (Next 12 Months)"
            className="h-full"
          >
            <div className="space-y-4">
              {/* Timeline visualization */}
              <div className="border-l-2 border-indigo-500 ml-2 pl-6 space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-700 flex items-center">
                    <Calendar className="mr-2" size={16} />
                    Q3 2025
                  </h4>
                  <ul className="list-disc ml-5 mt-1 text-sm text-gray-700 space-y-1">
                    <li>Launch Beta Provider Network with 250+ providers</li>
                    <li>Reach 2,000 active households</li>
                    <li>Release task weighting v2 algorithm</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-indigo-700 flex items-center">
                    <Calendar className="mr-2" size={16} />
                    Q4 2025
                  </h4>
                  <ul className="list-disc ml-5 mt-1 text-sm text-gray-700 space-y-1">
                    <li>Complete premium tier launch with 15% conversion rate</li>
                    <li>Establish first corporate partnerships (3-5 companies)</li>
                    <li>Scale to 20 full-time team members</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-indigo-700 flex items-center">
                    <Calendar className="mr-2" size={16} />
                    Q1 2026
                  </h4>
                  <ul className="list-disc ml-5 mt-1 text-sm text-gray-700 space-y-1">
                    <li>Reach 5,000 active households</li>
                    <li>Launch full family dashboard with relationship insights</li>
                    <li>Begin Series A fundraising process ($8-10M target)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-indigo-700 flex items-center">
                    <Calendar className="mr-2" size={16} />
                    Q2 2026
                  </h4>
                  <ul className="list-disc ml-5 mt-1 text-sm text-gray-700 space-y-1">
                    <li>Complete Series A funding</li>
                    <li>Reach 10,000 active households</li>
                    <li>Launch enterprise solution for family-friendly employers</li>
                    <li>Begin geographic expansion beyond initial test markets</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <h4 className="text-md font-semibold text-indigo-700 flex items-center mb-2">
                  <Activity className="mr-2" size={16} />
                  Key Performance Indicators
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <p className="font-semibold">User Metrics:</p>
                    <ul className="list-disc ml-5 text-xs">
                      <li>Daily Active Users</li>
                      <li>14-day & 30-day Retention</li>
                      <li>Time in App (Growing)</li>
                    </ul>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Business Metrics:</p>
                    <ul className="list-disc ml-5 text-xs">
                      <li>Premium Conversion Rate</li>
                      <li>Unit Economics (CAC/LTV)</li>
                      <li>Referral Rate</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Bottom section */}
        <div className="col-span-12">
          <Card
            icon={<Briefcase size={20} />}
            title="Investment Offer"
            className="bg-gradient-to-r from-indigo-100 to-white"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-indigo-800">Seed Round Details</h4>
                <ul className="ml-1 text-sm space-y-1">
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span><strong>Raising:</strong> $2.5M</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span><strong>Valuation:</strong> $12M pre-money</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span><strong>Minimum:</strong> $100K investment</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span><strong>Structure:</strong> SAFE with 20% discount</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-indigo-800">Use of Funds</h4>
                <ul className="ml-1 text-sm space-y-1">
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span><strong>Engineering:</strong> 60% - Core team & product</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span><strong>Marketing:</strong> 20% - User acquisition</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span><strong>Operations:</strong> 15% - Legal & infrastructure</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span><strong>Reserve:</strong> 5% - Contingency</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-indigo-800">Due Diligence Materials</h4>
                <ul className="ml-1 text-sm space-y-1">
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span>Product Demo & Test Access</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span>Technical Architecture Review</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span>Financial Model & Projections</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight size={12} className="text-indigo-500 mr-2" />
                    <span>User Research & Product Roadmap</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4">
              <Quote className="text-sm italic text-indigo-800">
                "We're looking for strategic investors who share our vision for rebalancing families and creating a more equitable society. We believe Allie has the potential to become the essential platform for modern families, driving meaningful change while building a valuable business."
              </Quote>
            </div>
          </Card>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default NextStepsSlide;