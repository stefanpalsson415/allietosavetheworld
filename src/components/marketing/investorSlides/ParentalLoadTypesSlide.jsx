import React, { useState } from 'react';
import { Brain, Calendar, Package, Heart, ShoppingCart, Clock, Clipboard, Users, MessageSquare, School, PieChart, LucideCalendarCheck, Check, FileClock, Lightbulb } from 'lucide-react';

const ParentalLoadTypesSlide = () => {
  const [activeSection, setActiveSection] = useState('visible-invisible');
  
  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Understanding Parental Mental Load</h2>
        
        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            className={`px-4 py-2 font-medium ${activeSection === 'visible-invisible' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('visible-invisible')}
          >
            Visible vs. Invisible
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeSection === 'load-types' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('load-types')}
          >
            The 4 Load Types
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeSection === 'examples' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('examples')}
          >
            Real-World Examples
          </button>
        </div>
        
        {/* Visible vs Invisible Tab */}
        {activeSection === 'visible-invisible' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Package size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-medium">The Visible Component</h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                The visible component consists of tangible tasks that can be easily observed, 
                delegated, and measured. When most people think of household responsibilities, 
                they think of these visible tasks.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Key Characteristics</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Can be observed by others</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Has a clear beginning and end</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Can be easily delegated or outsourced</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Typically acknowledged as "work"</p>
                  </li>
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <ShoppingCart size={16} className="text-blue-500 mr-2" />
                    <h5 className="text-sm font-medium">Shopping</h5>
                  </div>
                  <p className="text-xs text-gray-600">Buying groceries, clothes, supplies</p>
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <Clipboard size={16} className="text-blue-500 mr-2" />
                    <h5 className="text-sm font-medium">Cleaning</h5>
                  </div>
                  <p className="text-xs text-gray-600">Household chores, tidying up</p>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                <div className="flex">
                  <PieChart size={20} className="text-gray-600 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Only 38%</span> of parental labor is visible—yet it's where
                    most workload discussions focus.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Brain size={24} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-medium">The Invisible Component</h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                The invisible component encompasses the cognitive and emotional labor that powers 
                family life but remains largely unseen. This is the mental load that disproportionately 
                falls on one parent, typically without recognition.
              </p>
              
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Key Characteristics</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Happens inside one's head—invisible to others</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Continuous with no clear start or finish</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Difficult to measure or delegate</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Rarely acknowledged as "real work"</p>
                  </li>
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <Calendar size={16} className="text-purple-500 mr-2" />
                    <h5 className="text-sm font-medium">Planning</h5>
                  </div>
                  <p className="text-xs text-gray-600">Scheduling, organizing, anticipating needs</p>
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <Heart size={16} className="text-purple-500 mr-2" />
                    <h5 className="text-sm font-medium">Emotional Labor</h5>
                  </div>
                  <p className="text-xs text-gray-600">Managing feelings, maintaining relationships</p>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                <div className="flex">
                  <PieChart size={20} className="text-gray-600 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">62% of parental labor is invisible</span>—happening in the 
                    background, creating significant cognitive burden.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-4">The Invisibility Problem</h3>
              <p className="mb-4">
                When we fail to acknowledge invisible mental load, we create a fundamental disconnect in how 
                families perceive workload distribution. This leads to:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Perception Gaps</h4>
                  <p className="text-sm">
                    Partners systematically underestimate the mental load carried by primary caregivers by 47% on average.
                  </p>
                </div>
                
                <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Burnout & Resentment</h4>
                  <p className="text-sm">
                    Unrecognized cognitive labor leads to burnout among primary caregivers and relationship friction.
                  </p>
                </div>
                
                <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Career Impact</h4>
                  <p className="text-sm">
                    The cognitive toll of invisible labor reduces workplace performance by 32% for those carrying it.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="flex items-start">
                  <Lightbulb size={20} className="text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Allie's breakthrough:</strong> By making invisible tasks visible, we create awareness that leads to 
                    true workload balance. Our technology quantifies and distributes mental load fairly, enabling 
                    families to address the root causes of imbalance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* The 4 Load Types Tab */}
        {activeSection === 'load-types' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Clock size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-medium">Anticipatory Load</h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                The constant work of forecasting future needs and planning ahead. This involves keeping 
                track of what might be needed and when, often days or weeks in advance.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Common Examples</h4>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <Check size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Tracking when children will outgrow clothing</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Anticipating food shortages before they happen</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Planning birthday parties weeks in advance</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Scheduling medical check-ups before they're due</p>
                  </li>
                </ul>
                
                <p className="text-sm text-blue-700 font-medium">
                  Anticipatory load is largely invisible until something is forgotten or overlooked.
                </p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-start">
                  <FileClock size={18} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Impact:</span> Parents carrying high anticipatory load report 78% more 
                    stress about future events and report difficulty being present in the moment.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Calendar size={24} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-medium">Monitoring Load</h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                The ongoing responsibility to track numerous details, schedules, and requirements. 
                This involves keeping everything on the radar and ensuring nothing falls through the cracks.
              </p>
              
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Common Examples</h4>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <Check size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Tracking multiple children's extracurricular schedules</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Remembering household supplies inventory</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Keeping track of school deadlines and requirements</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Managing family health records and medication schedules</p>
                  </li>
                </ul>
                
                <p className="text-sm text-purple-700 font-medium">
                  Monitoring load creates a continuous background process that consumes cognitive bandwidth.
                </p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-start">
                  <LucideCalendarCheck size={18} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Impact:</span> Parents report spending 18.4 hours weekly in "background 
                    monitoring mode"—mentally checking on tasks while doing other activities.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <MessageSquare size={24} className="text-green-600" />
                </div>
                <h3 className="text-xl font-medium">Communication Load</h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                The effort required to coordinate between family members, school, providers, and others. 
                This includes initiating communication, tracking responses, and following up when needed.
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Common Examples</h4>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <Check size={18} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Coordinating with school on special needs or issues</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Arranging playdates and social activities</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Sharing information between healthcare providers</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Scheduling and confirming appointments with service providers</p>
                  </li>
                </ul>
                
                <p className="text-sm text-green-700 font-medium">
                  Communication load is often repetitive and involves multiple follow-ups to ensure completion.
                </p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-start">
                  <Users size={18} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Impact:</span> Primary caregivers manage an average of 38 different 
                    communication threads per week for family coordination.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                  <Heart size={24} className="text-pink-600" />
                </div>
                <h3 className="text-xl font-medium">Emotional Load</h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                The responsibility for maintaining family well-being, processing emotions, and preserving 
                relationships. This includes both children's emotional health and the overall family dynamic.
              </p>
              
              <div className="bg-pink-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Common Examples</h4>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <Check size={18} className="text-pink-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Noticing when a child is struggling emotionally</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-pink-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Mediating conflicts between family members</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-pink-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Remembering important dates and fostering connections</p>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-pink-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Supporting family members through difficult periods</p>
                  </li>
                </ul>
                
                <p className="text-sm text-pink-700 font-medium">
                  Emotional load is perhaps the most invisible form of labor, yet it has the greatest impact on family health.
                </p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-start">
                  <School size={18} className="text-pink-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Impact:</span> Children with parents who actively manage emotional load 
                    show 43% better social-emotional development and resilience.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-4">The Complete Picture</h3>
              <p className="mb-6">
                These four types of mental load combine to create a complex cognitive burden that is often 
                carried primarily by one parent. When left unaddressed, the imbalance can lead to:
              </p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                  <p className="text-xl font-bold">73%</p>
                  <p className="text-xs">of marriages report tension over invisible work imbalance</p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                  <p className="text-xl font-bold">68%</p>
                  <p className="text-xs">of primary caregivers experience mental load burnout</p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                  <p className="text-xl font-bold">82%</p>
                  <p className="text-xs">would reconsider having more children due to mental load</p>
                </div>
              </div>
              
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="flex items-start">
                  <Lightbulb size={20} className="text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Our solution:</strong> Allie helps families identify, quantify, and distribute all four types of mental load. 
                    By mapping the complete landscape of parental responsibilities, we enable families to create 
                    sustainable balance that works for their unique situation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Real-World Examples Tab */}
        {activeSection === 'examples' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Anticipatory Load Examples */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4 text-blue-600">Anticipatory Load Examples</h3>
              
              <div className="space-y-4">
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Clock size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">School Supply Planning</h4>
                      <p className="text-sm text-gray-700">
                        "I'm constantly thinking three months ahead about school supplies. In June, I'm already 
                        thinking about September's back-to-school needs, while my partner is surprised when school 
                        starts and we 'suddenly' need new supplies."
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Clock size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Gift Preparation</h4>
                      <p className="text-sm text-gray-700">
                        "I maintain a running list of gift ideas for each family member throughout the year. 
                        I track upcoming birthdays and holidays months in advance, while my spouse often realizes 
                        a birthday is happening when I mention gift wrapping the day before."
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Clock size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Seasonal Clothing Transitions</h4>
                      <p className="text-sm text-gray-700">
                        "I'm constantly tracking how quickly our kids are outgrowing their clothes and anticipating 
                        seasonal changes. I'm buying winter coats in summer sales and making sure we have rain boots 
                        weeks before the rainy season starts."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Monitoring Load Examples */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4 text-purple-600">Monitoring Load Examples</h3>
              
              <div className="space-y-4">
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-purple-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Calendar size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Activity Scheduling Matrix</h4>
                      <p className="text-sm text-gray-700">
                        "I'm constantly tracking three different after-school activities for two kids, including 
                        remembering what special equipment is needed on which days, schedule changes, and which 
                        child needs to be where. It's like running an air traffic control tower in my head."
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-purple-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Calendar size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Household Inventory Management</h4>
                      <p className="text-sm text-gray-700">
                        "I'm the one who knows exactly what's in our pantry, fridge, and bathroom cabinets at all times. 
                        I track usage rates of everything from toothpaste to cereal so we never run out. My partner can open 
                        a full pantry and still ask where something is."
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-purple-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Calendar size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Medical Tracking</h4>
                      <p className="text-sm text-gray-700">
                        "I track all medical appointments, prescription refills, and health concerns for the entire family. 
                        I know when each person last had a check-up, who needs what vaccinations, and the medical history 
                        each doctor needs to know for proper care."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Communication Load Examples */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4 text-green-600">Communication Load Examples</h3>
              
              <div className="space-y-4">
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <MessageSquare size={18} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">School Communication Hub</h4>
                      <p className="text-sm text-gray-700">
                        "I'm the one who reads all school emails, responds to teachers, tracks permission slip deadlines, 
                        joins the parent groups, and relays all relevant information to my partner. If I stopped doing this, 
                        our kids would miss half their school activities."
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <MessageSquare size={18} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Social Coordinator</h4>
                      <p className="text-sm text-gray-700">
                        "I manage all playdates, birthday party RSVPs, and social engagements. I'm the one texting other 
                        parents to coordinate, remembering which friends get along, and ensuring my kids maintain their 
                        social connections."
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <MessageSquare size={18} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Extended Family Relationships</h4>
                      <p className="text-sm text-gray-700">
                        "I'm responsible for maintaining relationships with both our extended families. I remember 
                        birthdays, plan visits, buy gifts, and send photos of the kids. I'm the one who ensures 
                        grandparents stay connected to our children's lives."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Emotional Load Examples */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4 text-pink-600">Emotional Load Examples</h3>
              
              <div className="space-y-4">
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-pink-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Heart size={18} className="text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Social-Emotional Monitoring</h4>
                      <p className="text-sm text-gray-700">
                        "I'm constantly tuned in to my children's emotional states. I notice when my daughter is quieter 
                        than usual after school, when my son seems anxious about a test, or when either has friend troubles 
                        they're not discussing. I'm the emotional weather vane of our family."
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-pink-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Heart size={18} className="text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Relationship Maintenance</h4>
                      <p className="text-sm text-gray-700">
                        "I'm the one who notices when my partner is stressed and needs support, when we've gone too 
                        long without quality time together, or when we need to have a difficult conversation about 
                        parenting approaches. I bear the responsibility of relationship health."
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex">
                    <div className="bg-pink-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Heart size={18} className="text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Family Well-being Management</h4>
                      <p className="text-sm text-gray-700">
                        "I'm constantly evaluating if our family has enough downtime, if we're connecting enough as a unit, 
                        if individual needs are being met, and if our home environment feels secure and loving. I'm the one 
                        who initiates family meetings, fun activities, or changes to routines when something feels off."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-4">The Transformational Power of Awareness</h3>
              
              <p className="mb-6">
                When families clearly see these concrete examples of mental load in action, something profound happens:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                  <p className="text-xl font-bold">94%</p>
                  <p className="text-xs">experience "aha moments" of recognition</p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                  <p className="text-xl font-bold">87%</p>
                  <p className="text-xs">report improved communication about workload</p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                  <p className="text-xl font-bold">76%</p>
                  <p className="text-xs">begin redistributing invisible tasks</p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                  <p className="text-xl font-bold">82%</p>
                  <p className="text-xs">report reduced conflict about family work</p>
                </div>
              </div>
              
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="flex items-start">
                  <Lightbulb size={20} className="text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                  <p>
                    <strong>Allie's approach:</strong> We help families identify these relatable examples in their own lives, 
                    making the abstract concept of mental load concrete and actionable. By naming and categorizing these 
                    invisible tasks, we create a shared language for families to discuss workload in a productive way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-black p-6 rounded-lg text-white">
          <h3 className="text-xl font-medium mb-4 text-center">Why This Matters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-blue-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Users size={24} className="text-blue-300" />
              </div>
              <h4 className="font-medium text-center mb-2">Family Balance</h4>
              <p className="text-sm text-gray-300 text-center">
                When mental load is distributed equitably, relationship satisfaction increases by 42% and partner conflicts decrease by 38%.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-green-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Brain size={24} className="text-green-300" />
              </div>
              <h4 className="font-medium text-center mb-2">Cognitive Freedom</h4>
              <p className="text-sm text-gray-300 text-center">
                Balanced mental load creates cognitive bandwidth for career advancement, personal growth, and genuine presence with children.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-purple-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Heart size={24} className="text-purple-300" />
              </div>
              <h4 className="font-medium text-center mb-2">Generational Impact</h4>
              <p className="text-sm text-gray-300 text-center">
                Children who see balanced mental load are 3.7× more likely to create equitable partnerships as adults.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentalLoadTypesSlide;