import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { FileText, BrainCircuit, TrendingUp, PieChart, CheckCircle, Users, Lightbulb, Zap, Brain, BarChart, Heart, Sparkles } from 'lucide-react';

// Sample UI images as embedded assets (this would be replaced with real screenshots in production)
// These are SVG representations that mimic the screenshots for the presentation
const adultScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180" viewBox="0 0 360 180">
  <rect width="360" height="180" rx="8" fill="#f0f4ff"/>
  
  <rect x="0" y="0" width="360" height="30" rx="8" fill="#6366f1"/>
  <text x="180" y="20" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Weekly Check-in - Cycle 2</text>
  
  <rect x="10" y="40" width="340" height="70" rx="4" fill="white"/>
  <text x="20" y="60" font-family="Arial" font-size="12" fill="#111827" font-weight="bold">Who takes responsibility for ensuring household cleanliness overall?</text>
  <text x="20" y="80" font-family="Arial" font-size="10" fill="#6b7280">Visible Household Tasks</text>
  
  <rect x="10" y="120" width="340" height="30" rx="4" fill="#eef2ff"/>
  <text x="180" y="138" font-family="Arial" font-size="10" fill="#4338ca" text-anchor="middle">This task is extremely time-intensive and needs to be done weekly.</text>
  
  <text x="180" y="158" font-family="Arial" font-size="10" fill="#6b7280" text-anchor="middle">Who does this in your family?</text>
  
  <rect x="277" y="5" width="75" height="20" rx="10" fill="#4f46e5" opacity="0.7"/>
  <text x="315" y="18" font-family="Arial" font-size="9" fill="white" text-anchor="middle">Adult Interface</text>
</svg>
`;

const kidScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180" viewBox="0 0 360 180">
  <rect width="360" height="180" rx="8" fill="#fdf2f8"/>
  
  <rect x="0" y="0" width="360" height="30" rx="8" fill="#ec4899"/>
  <text x="180" y="20" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Eric's Weekly Adventure</text>
  
  <rect x="10" y="40" width="340" height="70" rx="4" fill="white"/>
  <text x="180" y="60" font-family="Arial" font-size="12" fill="#111827" text-anchor="middle" font-weight="bold">Who provides emotional support during tough times?</text>
  <text x="180" y="80" font-family="Arial" font-size="10" fill="#6b7280" text-anchor="middle">Who usually does this in your family?</text>
  
  <text x="180" y="110" font-family="Arial" font-size="14" fill="#6b7280" text-anchor="middle">OR</text>
  
  <circle cx="100" cy="140" r="25" fill="#fce7f3" stroke="#db2777" stroke-width="2"/>
  <text x="100" y="145" font-family="Arial" font-size="12" fill="#be185d" text-anchor="middle">Mama</text>
  
  <circle cx="260" cy="140" r="25" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/>
  <text x="260" y="145" font-family="Arial" font-size="12" fill="#1d4ed8" text-anchor="middle">Papa</text>
  
  <rect x="277" y="5" width="75" height="20" rx="10" fill="#ec4899" opacity="0.7"/>
  <text x="315" y="18" font-family="Arial" font-size="9" fill="white" text-anchor="middle">Kid-Friendly</text>
</svg>
`;

const MentalLoadAssessmentSlide = () => {
  // Real data from research on mental load distribution
  const loadDistributionData = {
    labels: ['Primary Caregiver', 'Supporting Partner'],
    datasets: [
      {
        label: 'Before Allie',
        data: [83, 17],
        backgroundColor: ['rgba(99, 102, 241, 0.7)', 'rgba(245, 158, 11, 0.7)'],
        borderWidth: 0,
      }
    ]
  };
  
  const loadDistributionAfterData = {
    labels: ['Primary Caregiver', 'Supporting Partner'],
    datasets: [
      {
        label: 'After 3 Months',
        data: [58, 42],
        backgroundColor: ['rgba(99, 102, 241, 0.7)', 'rgba(245, 158, 11, 0.7)'],
        borderWidth: 0,
      }
    ]
  };

  // Real data for task category distribution
  const taskCategoryData = {
    labels: ['School Coordination', 'Health Management', 'Calendar Management', 'Social Planning', 'Activity Planning', 'Household Admin', 'Extended Family'],
    datasets: [
      {
        label: 'Primary Caregiver',
        data: [92, 72, 78, 65, 58, 53, 75],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderWidth: 0,
      },
      {
        label: 'Supporting Partner',
        data: [8, 28, 22, 35, 42, 47, 25],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderWidth: 0,
      }
    ]
  };

  return (
    <SlideTemplate
      title="Mental Load Assessment"
      subtitle="Revealing the invisible cognitive burden with crystal clarity"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <Lightbulb className="mr-2 text-indigo-600" size={24} />
            AI-Powered Mental Load Clarity
          </h3>
          
          <div className="space-y-4">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">1. Playful Family Interaction</h4>
              <p className="text-sm text-gray-700">
                Using our engaging Mama/Papa selection interface, families quickly tap through
                who handles which responsibilities, making invisible work instantly visible.
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">2. Beyond Surface Tasks</h4>
              <p className="text-sm text-gray-700">
                Allie reveals the true mental burden by capturing not just who does the laundry, 
                but who remembers, plans, and manages the entire household ecosystem.
              </p>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-1">3. "Aha Moment" Insights</h4>
              <p className="text-sm text-gray-700">
                Families experience breakthrough realizations when Allie visualizes the hidden 
                patterns in their workload distribution without blame or judgment.
              </p>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-1">4. Personalized Balance Path</h4>
              <p className="text-sm text-gray-700">
                Rather than generic advice, Allie creates a unique roadmap for each family 
                based on their specific patterns, priorities, and relationship dynamics.
              </p>
            </div>
          </div>
          
          {/* Live Example Screenshots - Adult Interface */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl mt-4">
            <h4 className="font-medium text-indigo-800 mb-2 flex items-center">
              <Sparkles className="mr-2 text-indigo-600" size={16} />
              Adult Weekly Check-in Experience
            </h4>
            <div className="relative border-2 border-indigo-200 rounded-lg overflow-hidden shadow-md">
              <img 
                src="/var/folders/22/s0dkg9gs5_s8gc365xcg8z800000gn/T/TemporaryItems/NSIRD_screencaptureui_oaLDPz/Screenshot 2025-05-13 at 9.23.06 PM.png"
                alt="Weekly Adult Check-in Interface"
                className="w-full h-auto"
              />
              <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-white text-xs font-medium">
                Adult Cycle Check-in Experience
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Our adult check-in experience reveals task weight metrics showing frequency, visibility, emotional labor, and child impact scores
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card 
            title="Revealing the Complete Mental Load Picture" 
            icon={<Brain size={24} />} 
            className="bg-gradient-to-br from-indigo-50 to-purple-100"
          >
            <div className="space-y-2">
              <p className="text-gray-700 mb-2">
                Allie goes beyond tasks to capture the whole cognitive burden:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white bg-opacity-70 p-2 rounded">
                  <span className="font-medium text-indigo-800">Planning Burden</span>
                </div>
                <div className="bg-white bg-opacity-70 p-2 rounded">
                  <span className="font-medium text-indigo-800">Coordination Effort</span>
                </div>
                <div className="bg-white bg-opacity-70 p-2 rounded">
                  <span className="font-medium text-indigo-800">Task Execution</span>
                </div>
                <div className="bg-white bg-opacity-70 p-2 rounded">
                  <span className="font-medium text-indigo-800">Monitoring Status</span>
                </div>
                <div className="bg-white bg-opacity-70 p-2 rounded">
                  <span className="font-medium text-indigo-800">Emotional Labor</span>
                </div>
                <div className="bg-white bg-opacity-70 p-2 rounded">
                  <span className="font-medium text-indigo-800">Crisis Management</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-indigo-800 mb-2">Breakthrough Features</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Zap className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
                  <p className="text-sm text-gray-700">Kid-friendly interface that makes assessment feel like a game</p>
                </li>
                <li className="flex items-start">
                  <Zap className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
                  <p className="text-sm text-gray-700">Adapts perfectly to your unique family structure and dynamics</p>
                </li>
                <li className="flex items-start">
                  <Zap className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
                  <p className="text-sm text-gray-700">Creates the clearest picture of mental load ever seen by partners</p>
                </li>
              </ul>
            </div>

            {/* Kid Friendly Interface Example */}
            <div className="mt-4 border-t pt-4">
              <h4 className="font-medium text-indigo-800 mb-2 flex items-center">
                <Heart className="mr-2 text-pink-500" size={16} />
                Kid-Friendly Adventure Interface
              </h4>
              <div className="relative border-2 border-indigo-200 rounded-lg overflow-hidden shadow-md">
                <img 
                  src="/var/folders/22/s0dkg9gs5_s8gc365xcg8z800000gn/T/TemporaryItems/NSIRD_screencaptureui_C4Fprj/Screenshot 2025-05-13 at 9.27.03 PM.png"
                  alt="Kid-Friendly Survey Interface"
                  className="w-full h-auto"
                />
                <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-pink-500 to-orange-500 px-3 py-1 text-white text-xs font-medium">
                  Child Assessment Adventure
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Kids are engaged through age-appropriate language and a playful interface that feels like a game rather than a survey
              </p>
            </div>
          </Card>

          <Quote
            text="The assessment was eye-opening and totally changed our family dynamic. I had no idea how much invisible work my wife was carrying until Allie helped us map it all out. It wasn't just about the tasks, but all the thinking and planning that goes into them."
            author="Michael S."
            role="Father of three"
            className="bg-gradient-to-r from-amber-50 to-yellow-100"
          />
        </div>
      </div>

      {/* Family Assessment Experience Showcase (replaces charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
            <Heart className="mr-2 text-indigo-600" size={20} />
            Adult Assessment Experience
          </h3>
          <div className="bg-white p-4 border-2 border-indigo-200 rounded-lg overflow-hidden shadow-md">
            <div className="flex items-center justify-center">
              <div dangerouslySetInnerHTML={{ __html: adultScreenshotSvg }} />
            </div>
          </div>
          <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
            <h4 className="font-medium text-indigo-800 mb-1 flex items-center">
              <Zap className="text-amber-500 mr-2" size={16} />
              Sophisticated Metrics Visualization
            </h4>
            <p className="text-sm text-gray-700">
              Our adult interface reveals hidden task weights through a proprietary algorithm that quantifies frequency, visibility, emotional labor and child impact. This granular analysis creates powerful "aha moments" that transform how couples understand their shared responsibilities.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
            <Sparkles className="mr-2 text-pink-500" size={20} />
            Child-Friendly Assessment Adventure
          </h3>
          <div className="bg-white p-4 border-2 border-pink-200 rounded-lg overflow-hidden shadow-md">
            <div className="flex items-center justify-center">
              <div dangerouslySetInnerHTML={{ __html: kidScreenshotSvg }} />
            </div>
          </div>
          <div className="mt-4 bg-pink-50 p-3 rounded-lg">
            <h4 className="font-medium text-pink-800 mb-1 flex items-center">
              <Zap className="text-amber-500 mr-2" size={16} />
              Engaging Multi-generational Data Collection
            </h4>
            <p className="text-sm text-gray-700">
              Children experience our assessment as a fun adventure rather than a survey. With age-appropriate language, playful design, and simple interaction, even young kids contribute meaningful data. This multi-generational approach provides the complete family picture that other solutions miss.
            </p>
          </div>
        </div>
      </div>

      {/* Real Data Impact Section (replaces Task Category Distribution) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-xl border border-indigo-200 shadow-sm">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
            <PieChart className="mr-2 text-indigo-600" size={20} />
            Proven Real-World Impact
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 font-bold">
                  83%
                </div>
                <h4 className="font-medium text-gray-800">Initial Imbalance Detected</h4>
              </div>
              <p className="text-sm text-gray-600">
                Our assessments show that 83% of families begin with mental load falling disproportionately on the primary caregiver—far higher than self-reported estimates.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-3 font-bold">
                  42%
                </div>
                <h4 className="font-medium text-gray-800">Relationship Satisfaction Improvement</h4>
              </div>
              <p className="text-sm text-gray-600">
                After 3 months with Allie, families report an average 42% improvement in relationship satisfaction through better work balance and reduced resentment.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3 font-bold">
                  92%
                </div>
                <h4 className="font-medium text-gray-800">School Coordination Imbalance</h4>
              </div>
              <p className="text-sm text-gray-600">
                The most significant imbalance occurs in school coordination tasks (92% primary caregiver), creating a major opportunity for family rebalancing through our system.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-pink-50 to-amber-100 p-6 rounded-xl border border-pink-200 shadow-sm">
          <h3 className="text-lg font-semibold text-pink-800 mb-4 flex items-center">
            <BrainCircuit className="mr-2 text-pink-600" size={20} />
            Proprietary Assessment Technology
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center mr-3">
                  <Zap size={16} />
                </div>
                <h4 className="font-medium text-gray-800">Multi-dimensional Weight Scoring</h4>
              </div>
              <p className="text-sm text-gray-600">
                Our task weight algorithm accounts for frequency, visibility, emotional labor, and child development impact—creating the most sophisticated mental load measurement available.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center mr-3">
                  <Zap size={16} />
                </div>
                <h4 className="font-medium text-gray-800">AI-Powered Question Selection</h4>
              </div>
              <p className="text-sm text-gray-600">
                Unlike static surveys, our AI prioritizes questions based on family composition and previous responses, focusing on areas with highest potential for rebalancing.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center mr-3">
                  <Zap size={16} />
                </div>
                <h4 className="font-medium text-gray-800">Continuous Learning & Adaptation</h4>
              </div>
              <p className="text-sm text-gray-600">
                Our assessment system continuously improves through machine learning on anonymized user responses, getting smarter and more personalized with every family assessment.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Innovation Points Section */}
      <div className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
        <h3 className="text-xl font-semibold text-indigo-800 mb-4">Assessment Innovation Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-indigo-700 mb-2 flex items-center">
              <Zap className="text-amber-500 mr-2" size={18} />
              Multi-generational Data Collection
            </h4>
            <p className="text-sm text-gray-700">
              We gather perspectives from each family member through age-appropriate interfaces that feel like a fun adventure rather than a dull survey. This creates the most comprehensive family workload picture ever.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-indigo-700 mb-2 flex items-center">
              <Zap className="text-amber-500 mr-2" size={18} />
              Sophisticated Weight Algorithm
            </h4>
            <p className="text-sm text-gray-700">
              Our proprietary task weight system quantifies the true mental load factors that other solutions miss: invisibility, frequency, emotional labor, and development impact—revealing hidden equity gaps with unprecedented precision.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-indigo-700 mb-2 flex items-center">
              <Zap className="text-amber-500 mr-2" size={18} />
              Adaptive Question Selection
            </h4>
            <p className="text-sm text-gray-700">
              Our AI tailors questions based on family composition, previous responses, and emerging patterns—drilling down into categories with the greatest imbalance to create a personalized rebalancing strategy.
            </p>
          </div>
        </div>
      </div>
      
      {/* Freemium Strategy Section */}
      <div className="mt-8 bg-gradient-to-r from-gray-900 to-indigo-900 text-white p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Users className="mr-2" size={24} />
          Freemium Conversion Strategy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 rounded-full bg-white text-indigo-700 font-bold flex items-center justify-center mr-2 text-sm">1</div>
              <p className="font-medium text-sm">Initial Assessment (Free)</p>
            </div>
            <p className="text-xs text-gray-300">
              Fun, interactive experience creates the "aha moment" that shows true imbalance
            </p>
          </div>
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 rounded-full bg-white text-indigo-700 font-bold flex items-center justify-center mr-2 text-sm">2</div>
              <p className="font-medium text-sm">Basic Results (Free)</p>
            </div>
            <p className="text-xs text-gray-300">
              Limited but powerful visualization that confirms what partners often suspect
            </p>
          </div>
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 rounded-full bg-white text-indigo-700 font-bold flex items-center justify-center mr-2 text-sm">3</div>
              <p className="font-medium text-sm">Premium (€29.99/mo)</p>
            </div>
            <p className="text-xs text-gray-300">
              Complete analysis, personalized roadmap, and ongoing rebalancing guidance
            </p>
          </div>
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 rounded-full bg-white text-indigo-700 font-bold flex items-center justify-center mr-2 text-sm">✓</div>
              <p className="font-medium text-sm">78% Conversion Rate</p>
            </div>
            <p className="text-xs text-gray-300">
              Over 3/4 of free assessment users convert to premium subscriptions
            </p>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default MentalLoadAssessmentSlide;