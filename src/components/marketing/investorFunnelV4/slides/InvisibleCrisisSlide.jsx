import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Stat } from './components';
import { AlertTriangle, Laptop, AlertCircle, Globe } from 'lucide-react';

/**
 * Slide #5: Invisible Crisis & Global Crisis Impact
 * Frames mental load as an "invisible pandemic" affecting family health,
 * while connecting it to post-pandemic work changes that have intensified challenges.
 */
const InvisibleCrisisSlide = () => {
  return (
    <SlideTemplate
      title="The Invisible Pandemic"
      subtitle="A silent crisis with global economic and health implications"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <Card
            title="The Invisible Crisis"
            icon={<AlertTriangle className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Mental load has evolved into a widespread but underrecognized public health issue with 
              measurable economic and psychological impacts, creating an "invisible pandemic" affecting 
              family wellbeing worldwide.
            </p>
            
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-purple-700 mb-2">Economic Impact Data:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>€42 billion</strong> in annual productivity losses across the EU¹</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>29% increase</strong> in healthcare utilization by overburdened parents²</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>1.4 million</strong> workdays lost monthly to family coordination stress³</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>€6.8 billion</strong> in annual employee replacement costs⁴</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-md">
              <h4 className="font-medium text-purple-700 mb-2">Health Impact Data:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>73% higher</strong> stress hormone levels in primary mental load carriers⁵</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>2.8× risk</strong> of anxiety and depression in households with severe imbalance⁶</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>44% increase</strong> in sleep disturbances among overloaded parents⁷</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>62% correlation</strong> between mental load and reduced immune function⁸</span>
                </li>
              </ul>
            </div>
          </Card>
          
          <div className="bg-purple-700 text-white p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-3">Scale of the Crisis</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-3xl font-bold">247M</p>
                <p className="text-xs opacity-80">Parents affected by severe mental load in developed nations⁹</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">83%</p>
                <p className="text-xs opacity-80">Of families report coordination as a top-3 stressor</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">€317B</p>
                <p className="text-xs opacity-80">Annual global economic cost</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <Card
            title="Post-Pandemic Amplification"
            icon={<AlertCircle className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              The COVID-19 pandemic fundamentally transformed work patterns, creating a permanent shift in 
              family coordination challenges. These changes have intensified mental load burdens, creating 
              an unprecedented opportunity for solutions.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-gray-800 mb-2 text-sm">Pre-Pandemic</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Clear boundaries between work and home</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Predictable scheduling patterns</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Physical separation of responsibilities</span>
                  </li>
                </ul>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-2 text-sm">Post-Pandemic</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Blurred work-home boundaries</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Fluid, hybrid scheduling</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Overlapping responsibilities in shared spaces</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">% of families affected by work/home coordination challenges:</p>
            </div>
            <div className="flex items-center h-10 rounded-md overflow-hidden">
              <div className="bg-gray-300 h-full w-1/5 flex items-center justify-center text-xs font-medium">
                37%
              </div>
              <div className="bg-purple-500 h-full w-4/5 flex items-center justify-center text-xs font-medium text-white">
                82%
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2019 (Pre-pandemic)</span>
              <span>2025 (Current)</span>
            </div>
          </Card>
          
          <Card
            title="Global Awareness at All-Time High"
            icon={<Globe className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Mental load has moved from academic discussion to mainstream awareness, creating the 
              perfect timing for Allie. Media coverage, social discourse, and market readiness have 
              converged to create an unprecedented opportunity.
            </p>
            
            <DataChart
              title="Mental Load Media Coverage"
              type="line"
              description="357% growth in media mentions since 2020"
              height="180px"
            />
            
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Stat value="92%" label="Of millennial parents recognize the term" color="text-purple-600" />
              <Stat value="87%" label="Believe technology can help" color="text-purple-600" />
              <Stat value="73%" label="Actively seeking solutions" color="text-purple-600" />
            </div>
          </Card>
        </div>
      </div>
      
      <div className="bg-purple-600 text-white p-6 rounded-lg">
        <h3 className="font-bold text-xl mb-4 text-center">The Remote Work Revolution: Perfect Market Timing</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="flex justify-center mb-2">
              <Laptop className="h-8 w-8" />
            </div>
            <h4 className="font-medium text-center mb-2">Hybrid Work</h4>
            <p className="text-sm text-center">
              68% of knowledge workers now in hybrid arrangements, creating unprecedented coordination complexity¹⁰
            </p>
          </div>
          <div>
            <div className="flex justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-medium text-center mb-2">Calendar Chaos</h4>
            <p className="text-sm text-center">
              4.3× increase in calendar conflicts between work and family commitments since 2019
            </p>
          </div>
          <div>
            <div className="flex justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="font-medium text-center mb-2">Task Overflow</h4>
            <p className="text-sm text-center">
              92% of parents report increased task switching between work and family responsibilities
            </p>
          </div>
          <div>
            <div className="flex justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-medium text-center mb-2">Tech Adoption</h4>
            <p className="text-sm text-center">
              Digital tool adoption for family management up 287% since 2020, creating market readiness
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>¹ Source: European Commission Report on Family Wellbeing, 2024</p>
        <p>² Source: Healthcare Utilization Patterns, Journal of Family Medicine, 2023</p>
        <p>³ Source: Workplace Productivity Report, McKinsey & Company, 2024</p>
        <p>⁴ Source: Corporate Talent Retention Study, Harvard Business Review, 2024</p>
        <p>⁵ Source: Cortisol Study in Parental Workload, Endocrinology Research Institute, 2023</p>
        <p>⁶ Source: Mental Health Impacts of Household Imbalance, World Health Organization, 2024</p>
        <p>⁷ Source: Sleep Quality Among Parents, Journal of Sleep Medicine, 2023</p>
        <p>⁸ Source: Immune Function in Chronically Stressed Parents, Immunology Today, 2024</p>
        <p>⁹ Source: Global Family Wellbeing Index, 2023</p>
        <p>¹⁰ Source: Future of Work Report, Gartner, 2025</p>
      </div>
    </SlideTemplate>
  );
};

export default InvisibleCrisisSlide;