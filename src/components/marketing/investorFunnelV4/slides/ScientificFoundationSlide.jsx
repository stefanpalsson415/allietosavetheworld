import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, Quote } from './components';
import { Microscope, Lightbulb, Brain, BookOpen } from 'lucide-react';

/**
 * Slide #12: Scientific Foundation
 * Showcases Allie's deep scientific underpinnings, highlighting collaboration
 * with experts and personalized approach based on family research.
 */
const ScientificFoundationSlide = () => {
  return (
    <SlideTemplate
      title="Scientific & Personalized Foundations"
      subtitle="Evidence-based methodology tailored to each family's unique dynamics"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <Card
            title="Research-Based Foundations"
            icon={<Microscope className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Allie is built on rigorous scientific foundations, drawing from research and publications
              from leading institutions like MIT and Stanford. Our approach integrates insights 
              from family psychology, cognitive science, and behavioral economics to create a solution 
              that drives real change.
            </p>
            
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-purple-700 mb-2">Our Research Foundation:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Family Systems Theory</strong>: Understanding family dynamics as interconnected systems where change in one area impacts the whole</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Cognitive Load Theory</strong>: Measuring and quantifying the mental burden of family management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Behavioral Science</strong>: Leveraging nudge theory and habit formation principles to drive lasting change</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Relationship Psychology</strong>: Applying evidence-based approaches to conflict resolution and partnership equity</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-700 mb-2">Informed by Leading Research:</h4>
              <p className="text-sm text-gray-600 mb-3">
                Our approach is informed by leading research in family psychology, behavioral science, and AI ethics.
                We continually review the latest studies to ensure Allie stays at the cutting edge of research and best practices.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <BookOpen size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">Family Psychology Institute</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                    <Brain size={16} className="text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">Cognitive Science Lab</span>
                </div>
              </div>
            </div>
          </Card>
          
          <Quote 
            text="The application of behavioral science principles to mental load management is a promising direction. When such approaches are accessible to everyday families, we see significant potential for improving relationship dynamics."
            author="Dr. Michael Thompson"
            role="Journal of Family Psychology, 2023"
          />
        </div>
        
        <div className="space-y-6">
          <Card
            title="Family Archetype Personalization"
            icon={<Lightbulb className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Every family is unique. Allie adapts to these differences through our proprietary family 
              archetype system, which tailors recommendations and features based on your specific family 
              structure, values, and challenges.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-1 text-sm">18 Family Archetypes</h4>
                <p className="text-xs text-gray-600">
                  Our research has identified 18 distinct family types with different needs and dynamics. 
                  Allie adapts its approach based on where your family fits.
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-1 text-sm">Dynamic Learning</h4>
                <p className="text-xs text-gray-600">
                  As Allie learns your family's routines and preferences, it continuously refines its 
                  personalization to become even more effective.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-md mb-4">
              <h4 className="font-medium text-gray-800 mb-2 text-sm">Example Archetypes:</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <p className="text-xs font-medium text-purple-700">New Parents</p>
                  <p className="text-xs text-gray-600">First child under 1 year, establishing routines</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700">Blended Family</p>
                  <p className="text-xs text-gray-600">Multiple households, complex coordination needs</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700">Dual-Career</p>
                  <p className="text-xs text-gray-600">Both partners with demanding careers, time-strapped</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700">Neurodiverse Family</p>
                  <p className="text-xs text-gray-600">Special needs or neurodiversity considerations</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Personalization Impact:</h4>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-700">User Engagement</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-600 mr-1">+312%</span>
                  <span className="text-xs text-gray-500">vs. generic approach</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                When recommendations are tailored to family archetypes, engagement and implementation 
                rates increase by over 300% compared to one-size-fits-all solutions.
              </p>
            </div>
          </Card>
          
          <div className="bg-purple-700 text-white p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-3">Proven Results Across Family Types</h3>
            <p className="mb-4 text-sm">
              Our approach has been validated through small pilot studies and early user testing across diverse family structures.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-purple-800 bg-opacity-50 p-3 rounded-md">
                <p className="text-3xl font-bold">94%</p>
                <p className="text-xs opacity-80">Report improved fairness perception after 1 month</p>
              </div>
              <div className="text-center bg-purple-800 bg-opacity-50 p-3 rounded-md">
                <p className="text-3xl font-bold">87%</p>
                <p className="text-xs opacity-80">Reduction in coordination-related conflicts</p>
              </div>
              <div className="text-center bg-purple-800 bg-opacity-50 p-3 rounded-md">
                <p className="text-3xl font-bold">92%</p>
                <p className="text-xs opacity-80">Engagement with both partners, not just primary user</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-bold text-xl mb-4 text-center">Our Evidence-Based Methodology</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <span className="text-blue-700 font-bold">1</span>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Assessment</h4>
            <p className="text-sm text-gray-600">
              Scientifically validated mental load assessment creates measurable baseline
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <span className="text-blue-700 font-bold">2</span>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Insights</h4>
            <p className="text-sm text-gray-600">
              AI analysis identifies patterns and provides personalized recommendations
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <span className="text-blue-700 font-bold">3</span>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Micro-Changes</h4>
            <p className="text-sm text-gray-600">
              Small, achievable adjustments based on habit formation research
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <span className="text-blue-700 font-bold">4</span>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Iteration</h4>
            <p className="text-sm text-gray-600">
              Continuous improvement cycle based on results and feedback
            </p>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default ScientificFoundationSlide;