import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { TrendingUp, Users, DollarSign, GitBranch, BarChart2, Clock, ShoppingBag, Book, Monitor, Shield } from 'lucide-react';

const LTVExpansionSlide = () => {
  return (
    <SlideTemplate
      title="LTV Expansion Strategy"
      subtitle="Building lifetime value through concentric layers of trust"
    >
      {/* Trust-Based Expansion Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <GitBranch className="mr-2 text-indigo-600" size={24} />
            Family Flywheel Model
          </h3>
          
          {/* Concentric circles visualization - simplified version with labels */}
          <div className="relative h-80 w-72 mx-auto">
            {/* Layer 4: Personalized Commerce - outermost */}
            <div className="absolute inset-0 rounded-full border border-amber-400" style={{borderWidth: '2px'}}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 bg-white px-2">
                <span className="text-amber-600 font-medium">4</span>
              </div>
            </div>
            <div className="absolute top-2 right-0 transform translate-x-2 text-amber-700 text-xs font-medium">
              4. Personalized Commerce
            </div>
            
            {/* Layer 3: Proactive Concierge */}
            <div className="absolute rounded-full border border-green-400" style={{top: '15%', left: '15%', right: '15%', bottom: '15%', borderWidth: '2px'}}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 bg-white px-2">
                <span className="text-green-600 font-medium">3</span>
              </div>
            </div>
            <div className="absolute top-12 right-8 transform text-green-700 text-xs font-medium">
              3. Proactive Concierge
            </div>
            
            {/* Layer 2: Family Command Center */}
            <div className="absolute rounded-full border border-blue-400" style={{top: '30%', left: '30%', right: '30%', bottom: '30%', borderWidth: '2px'}}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 bg-white px-2">
                <span className="text-blue-600 font-medium">2</span>
              </div>
            </div>
            <div className="absolute top-24 right-16 transform text-blue-700 text-xs font-medium">
              2. Family Command Center
            </div>
            
            {/* Layer 1: Load-Balance Coach */}
            <div className="absolute rounded-full border border-purple-400" style={{top: '45%', left: '45%', right: '45%', bottom: '45%', borderWidth: '2px'}}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 bg-white px-2">
                <span className="text-purple-600 font-medium">1</span>
              </div>
            </div>
            <div className="absolute top-36 right-20 transform text-purple-700 text-xs font-medium">
              1. Load-Balance Coach
            </div>
            
            {/* Core: Allie Core - innermost */}
            <div className="absolute rounded-full bg-purple-600 flex items-center justify-center text-center" style={{top: '60%', left: '60%', right: '60%', bottom: '60%'}}>
              <span className="text-xs font-bold text-white">Allie<br/>Core</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-6">
            Building concentric layers of trust with families over time, expanding from core mental load balancing to high-margin personalized commerce.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <BarChart2 className="mr-2" size={24} />
            LTV Growth Through Trust Layers
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <div className="flex justify-between mb-1">
                <h4 className="text-sm font-medium text-indigo-800">1. Load-Balance Coach</h4>
                <span className="text-sm font-medium text-indigo-800">$9.99/mo</span>
              </div>
              <p className="text-xs text-gray-700 mb-2">
                The foundation of trust: BG-Q assessment, weekly habits, fairness analytics, and accountability.
              </p>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-gray-600 mr-2">Activation:</span>
                <div className="flex-grow bg-gray-200 h-2 rounded-full">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{width: "75%"}}></div>
                </div>
                <span className="ml-2 text-indigo-800">75%</span>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <div className="flex justify-between mb-1">
                <h4 className="text-sm font-medium text-indigo-800">2. Family Command Center</h4>
                <span className="text-sm font-medium text-indigo-800">+$5.99/mo</span>
              </div>
              <p className="text-xs text-gray-700 mb-2">
                Calendar, docs, health vault, upgraded family tracking. Once core trust is established.
              </p>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-gray-600 mr-2">Conversion:</span>
                <div className="flex-grow bg-gray-200 h-2 rounded-full">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{width: "62%"}}></div>
                </div>
                <span className="ml-2 text-indigo-800">62%</span>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <div className="flex justify-between mb-1">
                <h4 className="text-sm font-medium text-indigo-800">3. Proactive Concierge</h4>
                <span className="text-sm font-medium text-indigo-800">+$7.99/mo</span>
              </div>
              <p className="text-xs text-gray-700 mb-2">
                Allie books dinner, refills Rx, schedule date night. Deep knowledge of family preferences.
              </p>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-gray-600 mr-2">Conversion:</span>
                <div className="flex-grow bg-gray-200 h-2 rounded-full">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{width: "45%"}}></div>
                </div>
                <span className="ml-2 text-indigo-800">45%</span>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <div className="flex justify-between mb-1">
                <h4 className="text-sm font-medium text-indigo-800">4. Personalized Commerce</h4>
                <span className="text-sm font-medium text-indigo-800">+$XXX rev</span>
              </div>
              <p className="text-xs text-gray-700 mb-2">
                One-tap purchase of age/size-specific gear, services. Affiliate + marketplace margin.
              </p>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-gray-600 mr-2">Engagement:</span>
                <div className="flex-grow bg-gray-200 h-2 rounded-full">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{width: "20%"}}></div>
                </div>
                <span className="ml-2 text-indigo-800">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card 
          title="1. Load-Balance Coach" 
          icon={<Shield size={24} />} 
          className="bg-gradient-to-br from-indigo-50 to-purple-100"
        >
          <p className="text-gray-700 mb-3">
            Our entry point that builds foundational trust through balanced mental load and relationship improvement.
          </p>
          <div className="bg-white bg-opacity-60 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-800 mb-1">Core UX:</h4>
            <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
              <li>BG-Q assessment, weekly habits</li>
              <li>Fairness analytics dashboard</li>
              <li>Personalized task weighting</li>
              <li>Relationship coaching</li>
            </ul>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <div className="bg-indigo-100 px-2 py-1 rounded-md">
              <p className="text-xs font-medium text-indigo-800">Revenue: $9.99/mo subscription</p>
            </div>
            <div className="bg-indigo-100 px-2 py-1 rounded-md">
              <p className="text-xs font-medium text-indigo-800">KPI: 75% activation</p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="2. Family Command Center" 
          icon={<Monitor size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            Once basic trust is established, families upgrade to centralize management of documents, calendar, and health data.
          </p>
          <div className="bg-white bg-opacity-60 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Core UX:</h4>
            <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
              <li>Calendar, docs, health vault</li>
              <li>Provider directory</li>
              <li>Family timeline with key events</li>
              <li>Document storage & organization</li>
            </ul>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <div className="bg-blue-100 px-2 py-1 rounded-md">
              <p className="text-xs font-medium text-blue-800">Revenue: +$5.99/mo tier upgrade</p>
            </div>
            <div className="bg-blue-100 px-2 py-1 rounded-md">
              <p className="text-xs font-medium text-blue-800">KPI: 62% conversion</p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="3. Proactive Concierge" 
          icon={<Clock size={24} />} 
          className="bg-gradient-to-br from-emerald-50 to-teal-100"
        >
          <p className="text-gray-700 mb-3">
            Deep trust unlocks permission for Allie to act on the family's behalf, completing tasks and managing logistics.
          </p>
          <div className="bg-white bg-opacity-60 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-emerald-800 mb-1">Core UX:</h4>
            <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
              <li>Allie books dinner, refills Rx</li>
              <li>Schedules date nights automatically</li>
              <li>Proactive notification system</li>
              <li>Tasks auto-executed per user</li>
            </ul>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <div className="bg-emerald-100 px-2 py-1 rounded-md">
              <p className="text-xs font-medium text-emerald-800">Revenue: +$7.99/mo premium tier</p>
            </div>
            <div className="bg-emerald-100 px-2 py-1 rounded-md">
              <p className="text-xs font-medium text-emerald-800">KPI: Partner fee revenue</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 text-center">Personalized Commerce Layer</h3>
        
        <div className="text-center mb-6">
          <p className="text-sm text-gray-700 max-w-3xl mx-auto">
            The ultimate layer of trust allows Allie to intelligently recommend and even 
            purchase products and services tailored to each family's exact needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-amber-50 rounded-lg p-4 flex flex-col items-center">
            <div className="bg-amber-100 p-3 rounded-full mb-3">
              <ShoppingBag className="text-amber-700" size={24} />
            </div>
            <h4 className="font-medium text-amber-800 text-sm mb-2">Children's Clothing</h4>
            <p className="text-xs text-gray-700 text-center mb-3">
              Personalized size, style & growth tracking with one-tap ordering
            </p>
            <div className="mt-auto w-full pt-3 border-t border-amber-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Revenue model:</span>
                <span className="font-medium text-amber-800">10% affiliate fees</span>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 flex flex-col items-center">
            <div className="bg-amber-100 p-3 rounded-full mb-3">
              <Book className="text-amber-700" size={24} />
            </div>
            <h4 className="font-medium text-amber-800 text-sm mb-2">Tutoring & Education</h4>
            <p className="text-xs text-gray-700 text-center mb-3">
              Just-in-time tutoring based on school calendar and child performance
            </p>
            <div className="mt-auto w-full pt-3 border-t border-amber-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Revenue model:</span>
                <span className="font-medium text-amber-800">15% marketplace fee</span>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 flex flex-col items-center">
            <div className="bg-amber-100 p-3 rounded-full mb-3">
              <Users className="text-amber-700" size={24} />
            </div>
            <h4 className="font-medium text-amber-800 text-sm mb-2">Family Activities</h4>
            <p className="text-xs text-gray-700 text-center mb-3">
              Curated family experiences matching interests, schedules & budgets
            </p>
            <div className="mt-auto w-full pt-3 border-t border-amber-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Revenue model:</span>
                <span className="font-medium text-amber-800">12-18% commission</span>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 flex flex-col items-center">
            <div className="bg-amber-100 p-3 rounded-full mb-3">
              <DollarSign className="text-amber-700" size={24} />
            </div>
            <h4 className="font-medium text-amber-800 text-sm mb-2">Premium Services</h4>
            <p className="text-xs text-gray-700 text-center mb-3">
              House cleaning, meal kits, childcare services based on mental load data
            </p>
            <div className="mt-auto w-full pt-3 border-t border-amber-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Revenue model:</span>
                <span className="font-medium text-amber-800">20% service fee</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-center mb-2">Flywheel Effect</h4>
            <p className="text-sm text-center text-gray-700">Each extra service multiplies total usage and engagement</p>
            <div className="mt-2 flex items-center justify-center">
              <div className="bg-white px-3 py-1 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-indigo-800">3 services = 7× engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default LTVExpansionSlide;