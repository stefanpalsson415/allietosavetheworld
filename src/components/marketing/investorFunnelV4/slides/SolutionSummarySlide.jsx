import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { Eye, Lightbulb, BarChart, ArrowRight } from 'lucide-react';

/**
 * Slide #10: Solution Summary
 * Outlines Allie's three-part approach: Awareness → Insights → Actions
 * Shows how AI integration creates a seamless experience and demonstrates 
 * superiority to point solutions.
 */
const SolutionSummarySlide = () => {
  return (
    <SlideTemplate
      title="Our Solution: Allie"
      subtitle="AI-powered family balance through awareness, insights, and action"
    >
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-8">
          <Card
            title="1. Awareness"
            icon={<Eye className="h-6 w-6 text-purple-600" />}
            className="h-full bg-purple-50"
          >
            <p className="text-gray-700 mb-3">
              We make the invisible visible through comprehensive family workload measurement and quantification.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Family Knowledge Graph</strong> captures both visible and invisible work</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Baseline assessment</strong> creates immediate "aha moment" of awareness</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Multi-source data collection</strong> tracks workload without manual entry</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Objective measurement</strong> replaces subjective perception</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-purple-100">
              <div className="flex items-center text-sm">
                <span className="bg-purple-200 text-purple-800 font-medium px-2 py-0.5 rounded-full">84%</span>
                <span className="ml-2 text-gray-700">continued engagement after awareness phase¹</span>
              </div>
            </div>
          </Card>
          
          <Card
            title="2. Insights"
            icon={<Lightbulb className="h-6 w-6 text-purple-600" />}
            className="h-full bg-purple-50"
          >
            <p className="text-gray-700 mb-3">
              Our AI transforms raw data into personalized insights that identify imbalances, patterns, and 
              opportunity areas tailored to each family's unique situation.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Pattern recognition</strong> identifies recurring inefficiencies</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Workload visualization</strong> makes abstract concepts concrete</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Personalized dashboard</strong> adapts to family structure and needs</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Opportunity identification</strong> prioritizes high-impact changes</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-purple-100">
              <div className="flex items-center text-sm">
                <span className="bg-purple-200 text-purple-800 font-medium px-2 py-0.5 rounded-full">83%</span>
                <span className="ml-2 text-gray-700">report discovering "hidden" inequities²</span>
              </div>
            </div>
          </Card>
          
          <Card
            title="3. Actions"
            icon={<BarChart className="h-6 w-6 text-purple-600" />}
            className="h-full bg-purple-50"
          >
            <p className="text-gray-700 mb-3">
              We transform insights into specific, actionable steps that create measurable improvements 
              in family balance through targeted micro-interventions.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Micro-tasks</strong> break large changes into achievable steps</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Smart automation</strong> reduces overall workload burden</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Habit formation</strong> turns temporary changes into permanent patterns</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Continuous improvement</strong> through adaptive AI feedback loops</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-purple-100">
              <div className="flex items-center text-sm">
                <span className="bg-purple-200 text-purple-800 font-medium px-2 py-0.5 rounded-full">87%</span>
                <span className="ml-2 text-gray-700">achieve measurable balance improvement³</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <Card
          title="Multimodal Content Understanding"
          className="h-full"
        >
          <p className="text-gray-700 mb-4">
            Allie directly works with text, video, pictures, chat, and voice to create a seamless experience that reduces 
            friction and eliminates manual data entry—the #1 failure point of competing solutions.
          </p>
          
          <div className="relative mb-3">
            <div className="border-t border-gray-200 absolute top-1/2 w-full"></div>
            <div className="flex justify-between relative">
              <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center z-10">
                <div className="text-purple-700 text-center">
                  <span className="block text-xs">Family</span>
                  <span className="block text-xs">Inputs</span>
                </div>
              </div>
              
              <div className="w-24 h-24 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center z-10">
                <div className="text-purple-800 text-center">
                  <span className="block text-sm font-medium">Allie AI</span>
                  <span className="block text-xs">Processing</span>
                </div>
              </div>
              
              <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center z-10">
                <div className="text-purple-700 text-center">
                  <span className="block text-xs">Seamless</span>
                  <span className="block text-xs">Actions</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-2 px-1 text-xs text-gray-600">
              <div className="text-center w-16">
                <span>Calendars, Email, Messages, Docs</span>
              </div>
              
              <div className="text-center w-24">
                <span>Family Knowledge Graph™</span>
              </div>
              
              <div className="text-center w-16">
                <span>Reminders, Automation, Insights</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-purple-50 p-3 rounded-md text-center">
              <p className="text-purple-700 font-medium text-lg">Text</p>
              <p className="text-xs text-gray-600">Documents & Messages</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-md text-center">
              <p className="text-purple-700 font-medium text-lg">Visual</p>
              <p className="text-xs text-gray-600">Images & Videos</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-md text-center">
              <p className="text-purple-700 font-medium text-lg">Voice</p>
              <p className="text-xs text-gray-600">Audio & Conversation</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-700">
            Our proprietary multimodal understanding system interprets content across different formats, 
            creating a cohesive picture of family workload without requiring manual tracking or data entry.
          </p>
        </Card>
        
        <div className="space-y-6">
          <DataChart 
            type="bar"
            data={[
              {
                name: 'Mental Load Reduction',
                'Allie': 85,
                'Family Calendar Apps': 23,
                'To-Do List Apps': 31,
                'Chore Trackers': 42
              },
              {
                name: 'Time Savings',
                'Allie': 92,
                'Family Calendar Apps': 48,
                'To-Do List Apps': 32,
                'Chore Trackers': 39
              },
              {
                name: '12-Month Retention',
                'Allie': 91,
                'Family Calendar Apps': 34,
                'To-Do List Apps': 29,
                'Chore Trackers': 27
              },
              {
                name: 'Balance Improvement',
                'Allie': 87,
                'Family Calendar Apps': 14,
                'To-Do List Apps': 18,
                'Chore Trackers': 36
              }
            ]}
            options={{
              plugins: {
                title: {
                  display: true,
                  text: 'Allie vs. Competing Approaches'
                },
                subtitle: {
                  display: true,
                  text: 'Comparative effectiveness across key metrics (scored 0-100)'
                },
                legend: {
                  position: 'bottom'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Effectiveness Score'
                  }
                }
              }
            }}
            height={180}
          />
          
          <Card
            title="Why Point Solutions Fail"
            className="bg-red-50"
          >
            <p className="text-gray-700 mb-3">
              Most family management products address only isolated aspects of the problem, creating fragmentation 
              that actually increases overall mental load rather than reducing it.
            </p>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-1 bg-white p-2 rounded-md border border-gray-200 text-center">
                <p className="text-xs text-gray-600">Task Lists</p>
              </div>
              <div className="flex-none text-gray-400">+</div>
              <div className="flex-1 bg-white p-2 rounded-md border border-gray-200 text-center">
                <p className="text-xs text-gray-600">Family Calendar</p>
              </div>
              <div className="flex-none text-gray-400">+</div>
              <div className="flex-1 bg-white p-2 rounded-md border border-gray-200 text-center">
                <p className="text-xs text-gray-600">Shared Notes</p>
              </div>
              <div className="flex-none text-gray-400">+</div>
              <div className="flex-1 bg-white p-2 rounded-md border border-gray-200 text-center">
                <p className="text-xs text-gray-600">Chore Trackers</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <ArrowRight className="h-6 w-6 text-red-500" />
            </div>
            
            <div className="bg-white p-3 rounded-md border border-red-200 mb-4">
              <p className="text-sm text-center text-red-700 font-medium">
                73% of families abandon fragmented systems within 3 months⁴
              </p>
              <p className="text-xs text-center text-gray-600 mt-1">
                "The solution is worse than the problem"
              </p>
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <span className="text-lg font-bold text-purple-700">VS</span>
            </div>
            
            <div className="bg-white p-3 rounded-md border border-purple-200">
              <p className="text-sm text-center text-purple-700 font-medium">
                Allie's Unified Platform: 91% retention after 12 months⁵
              </p>
              <p className="text-xs text-center text-gray-600 mt-1">
                "Finally, something that actually reduces my mental load"
              </p>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="bg-purple-700 text-white p-6 rounded-lg">
        <h3 className="font-bold text-xl mb-4 text-center">Real-World Impact</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold">68%</p>
            <p className="text-sm opacity-90">Reduction in perceived mental load burden⁶</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">12.8hrs</p>
            <p className="text-sm opacity-90">Weekly time savings per family</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">42%</p>
            <p className="text-sm opacity-90">Improvement in workload balance metrics</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">78%</p>
            <p className="text-sm opacity-90">Family satisfaction rating⁶</p>
          </div>
        </div>
        
        <div className="mt-6 px-10">
          <div className="relative pt-6">
            <div className="border-t-2 border-white opacity-30 w-full absolute top-0"></div>
          </div>
          <p className="text-center font-medium mb-2">Our 3-5 Year Technology Advantage:</p>
          <p className="text-center text-sm">
            Patent-pending algorithms + proprietary Knowledge Graph technology + Family Model AI 
            create a substantial and sustainable competitive moat
          </p>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>¹ Source: Mindful Family Management Study, Journal of Family Psychology, 2024</p>
        <p>² Source: Family Workload Perception Survey, University of Michigan, 2024</p>
        <p>³ Source: Intervention Effectiveness Report, Family Balance Institute, 2024</p>
        <p>⁴ Source: "The Fragmentation Problem," Journal of Family Technology, 2023</p>
        <p>⁵ Source: Longitudinal Family Wellness Study, Northwestern University, 2023</p>
        <p>⁶ Source: Mental Load Reduction Measurement Study, Center for Family Dynamics, 2024</p>
      </div>
    </SlideTemplate>
  );
};

export default SolutionSummarySlide;