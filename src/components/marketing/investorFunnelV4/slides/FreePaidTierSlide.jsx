import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { DollarSign, Award, Users, ArrowRight } from 'lucide-react';

const FreePaidTierSlide = () => {
  return (
    <SlideTemplate
      title="Freemium Strategy"
      subtitle="Delivering real value at every tier to maximize conversion and retention"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 mb-5">Free Tier</h3>
          
          <div className="space-y-4">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-2">Initial Survey & Assessment</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Comprehensive parental load assessment</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Mental load imbalance dashboard</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Detailed visualization of workload distribution</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Family comparison to national averages</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-2">Free Tier Strategy</h4>
              <p className="text-sm text-gray-700 mb-3">
                Our free tier focuses exclusively on the initial "Aha!" moment of parental load awareness:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-indigo-600">1</span>
                  </div>
                  <span className="text-sm text-gray-700">Delivers the critical "Aha!" moment of parental load imbalance awareness</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-indigo-600">2</span>
                  </div>
                  <span className="text-sm text-gray-700">Provides compelling data visualizations that clearly demonstrate inequity</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-indigo-600">3</span>
                  </div>
                  <span className="text-sm text-gray-700">Creates immediate motivation to solve the problem once it's been identified</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-amber-800 mb-5">Premium Tier (€29.99/month or €299.99/year)</h3>
          
          <div className="space-y-4">
            <div className="bg-amber-100 p-3 rounded-lg mb-3">
              <div className="flex items-center justify-center mb-1">
                <svg width="120" height="24" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-700">
                  <path d="M14.9 3.19995C13.3 2.19995 11.4 1.69995 9.4 1.69995C4.2 1.69995 0 5.89995 0 11.1C0 16.3 4.2 20.5 9.4 20.5C11.4 20.5 13.3 20 14.9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M24.9 3.19995C23.3 2.19995 21.4 1.69995 19.4 1.69995C14.2 1.69995 10 5.89995 10 11.1C10 16.3 14.2 20.5 19.4 20.5C21.4 20.5 23.3 20 24.9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M37.504 18V4.68H45.92V7.032H40.208V10.152H45.524V12.504H40.208V15.648H46.028V18H37.504ZM55.3435 18V4.68H58.0475V18H55.3435ZM63.4914 18V4.68H65.8794L71.5034 13.548H71.6074V4.68H74.2754V18H71.9234L66.2634 9.072H66.1594V18H63.4914ZM84.6382 18V7.032H80.7862V4.68H91.1662V7.032H87.3142V18H84.6382ZM100.223 18V4.68H102.927V18H100.223Z" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-xs text-center text-amber-800 font-medium mb-2">
                Powered by Claude, one of the world's most advanced AI assistants
              </p>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Advanced Features</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Unlimited Claude AI assistant interactions</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Complete calendar integration & management</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Family task management with advanced assignment</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Mental load balancing tools & active interventions</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Family knowledge graph with relationship insights</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Multi-child coordination & household planning</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Document management with Claude-powered analysis</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Premium Conversion Strategy</h4>
              <p className="text-sm text-gray-700 mb-3">
                After users experience the "Aha!" moment in the free tier, our premium offering provides the complete solution:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">1</span>
                  </div>
                  <span className="text-sm text-gray-700">Claude AI powers complete solution with relationship intelligence</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">2</span>
                  </div>
                  <span className="text-sm text-gray-700">Free tier creates awareness, premium tier delivers actual balance resolution</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">3</span>
                  </div>
                  <span className="text-sm text-gray-700">Natural transition: identify the problem, then get the complete solution</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <Card 
          title="Conversion Strategy: Using Free Assessment Data for Targeted Follow-up" 
          icon={<ArrowRight size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-4">
            Our free-to-premium conversion strategy leverages the valuable data collected during the initial parental load assessment to create personalized follow-up messaging:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-2">Data-Driven Email Campaign</h4>
              <p className="text-sm text-gray-700 mb-2">
                We use specific imbalance data points to create highly personalized follow-up emails that drive conversion:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 pl-4">
                <li>• "We noticed Mom is handling 89% of school coordination. Has that changed?"</li>
                <li>• "Dad is managing only 12% of household planning. Our tools help balance this."</li>
                <li>• "Your family's morning routine shows a 78% workload imbalance."</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-2">Time-Based Follow-up Strategy</h4>
              <p className="text-sm text-gray-700 mb-2">
                Our data indicates optimal timing for conversion messaging:
              </p>
              <div className="space-y-2">
                <div className="flex items-center bg-indigo-50 p-2 rounded">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-indigo-800">3d</span>
                  </div>
                  <span className="text-sm">First follow-up highlighting specific imbalance data</span>
                </div>
                <div className="flex items-center bg-indigo-50 p-2 rounded">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-indigo-800">7d</span>
                  </div>
                  <span className="text-sm">Solution-focused messaging with Claude AI testimonials</span>
                </div>
                <div className="flex items-center bg-indigo-50 p-2 rounded">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-indigo-800">14d</span>
                  </div>
                  <span className="text-sm">Limited-time offer with emphasis on household harmony</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg">
            <h4 className="font-medium text-indigo-800 mb-2">Conversion Optimization</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm text-gray-700">
                <p className="font-medium text-indigo-700 mb-1">Key Follow-up Messaging:</p>
                <ul className="pl-4 space-y-1">
                  <li>• "We can help balance your family's 82/18 workload split"</li>
                  <li>• "78% of families improve balance within 30 days"</li>
                  <li>• "See how Claude AI provides personalized solutions"</li>
                </ul>
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium text-indigo-700 mb-1">High-Impact Data Points:</p>
                <ul className="pl-4 space-y-1">
                  <li>• Specific % imbalance in key areas (school, childcare)</li>
                  <li>• Time spent by each parent on mental load tasks</li>
                  <li>• Impact of imbalance on family harmony metrics</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-5 bg-white rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Why This Freemium Strategy Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-2 text-center">Clear Value Proposition</h4>
            <p className="text-sm text-indigo-700">
              The free tier serves a clear purpose: helping families recognize and visualize their parental load imbalance. 
              This focused approach creates strong motivation to upgrade.
            </p>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="font-medium text-amber-800 text-sm mb-2 text-center">Premium Differentiation</h4>
            <p className="text-sm text-amber-700">
              Our premium tier leverages Claude AI to provide a complete solution that addresses the problem 
              identified in the free tier, creating a natural conversion path.
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-800 text-sm mb-2 text-center">Behavioral Psychology</h4>
            <p className="text-sm text-purple-700">
              Once users experience the "Aha!" moment of recognizing their household imbalance, they're 
              primed to seek solutions. The premium tier delivers exactly when that motivation is highest.
            </p>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default FreePaidTierSlide;