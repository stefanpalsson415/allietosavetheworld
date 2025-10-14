import React, { useState } from 'react';
import { Users, Brain, Heart, Briefcase, Sparkles, Check, Clock } from 'lucide-react';

const PersonalizedApproachSlide = () => {
  const [activeSegment, setActiveSegment] = useState('dual');
  
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Personalized Approach</h2>
        
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 mb-6">
            <button 
              className={`py-3 px-2 font-medium text-sm rounded-lg ${activeSegment === 'dual' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50'}`}
              onClick={() => setActiveSegment('dual')}
            >
              Dual-Income
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm rounded-lg ${activeSegment === 'single' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50'}`}
              onClick={() => setActiveSegment('single')}
            >
              Single Parents
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm rounded-lg ${activeSegment === 'same' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50'}`}
              onClick={() => setActiveSegment('same')}
            >
              Same-Sex Couples
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm rounded-lg ${activeSegment === 'blended' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50'}`}
              onClick={() => setActiveSegment('blended')}
            >
              Blended Families
            </button>
          </div>
        </div>
        
        {activeSegment === 'dual' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Users size={24} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Dual-Income Families</h3>
                  <p className="text-sm text-gray-600">Our largest demographic: 64% of users</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Pain Points</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Clock size={12} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Time Scarcity</p>
                        <p className="text-xs text-gray-600">Both partners working full-time with limited bandwidth</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Brain size={12} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Mental Load Asymmetry</p>
                        <p className="text-xs text-gray-600">One partner typically carries 78% of coordination burden</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Heart size={12} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Relationship Strain</p>
                        <p className="text-xs text-gray-600">Resentment building from perceived inequity</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Customized Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-purple-600" />
                      </div>
                      <p className="text-sm">Calendar Integration Priority</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-purple-600" />
                      </div>
                      <p className="text-sm">Equitable Task Distribution Algorithm</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-purple-600" />
                      </div>
                      <p className="text-sm">Career Impact Analysis</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-purple-600" />
                      </div>
                      <p className="text-sm">Workload Visualization Dashboard</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Sparkles size={22} className="text-purple-600 mr-2" />
                  Personalization Factors
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Career Patterns</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Dual full-time
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        One flex / one full-time
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        One remote / one on-site
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Both hybrid
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Child Ages</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        0-3 years
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        4-10 years
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        11+ years
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Support System</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Extended family nearby
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        No local support
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Paid childcare
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        School-based only
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">AI-Powered Personalized Features</h3>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Brain size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Enhanced Calendar Integration</p>
                      <p className="text-xs text-blue-100">Intelligent scheduling that adapts to each partner's work patterns</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Users size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Personalized Task Weight Analysis</p>
                      <p className="text-xs text-blue-100">Custom Task Weight™ scoring based on individual preferences and strengths</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSegment === 'single' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Single Parents</h3>
                  <p className="text-sm text-gray-600">Growing segment: 17% of users</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Pain Points</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Clock size={12} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Overwhelming Responsibility</p>
                        <p className="text-xs text-gray-600">100% of household and childcare management</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Briefcase size={12} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Work-Life Collision</p>
                        <p className="text-xs text-gray-600">Managing career with solo parenting duties</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Brain size={12} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Mental Load Overload</p>
                        <p className="text-xs text-gray-600">Cognitive saturation with no relief valve</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Customized Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-blue-600" />
                      </div>
                      <p className="text-sm">Task Prioritization & Time Blocking</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-blue-600" />
                      </div>
                      <p className="text-sm">Support Network Coordination</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-blue-600" />
                      </div>
                      <p className="text-sm">Self-Care Reminders & Mental Health Check-ins</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-blue-600" />
                      </div>
                      <p className="text-sm">Co-Parenting Communication Tools</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Sparkles size={22} className="text-blue-600 mr-2" />
                  Personalization Factors
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Co-Parenting Structure</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Primary custody
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Shared custody
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Limited co-parent involvement
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Sole parenting
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Work Situation</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Traditional 9-5
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Flexible hours
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Remote work
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Multiple jobs
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Support System</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Family support
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Friend network
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Paid services
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Limited support
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">AI-Powered Personalized Features</h3>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Brain size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Intelligent Resource Allocation</p>
                      <p className="text-xs text-blue-100">Prioritizes tasks based on energy levels and available support</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Users size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Support Network Coordination</p>
                      <p className="text-xs text-blue-100">AI-powered tools for activating and coordinating support resources</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSegment === 'same' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Users size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Same-Sex Couples</h3>
                  <p className="text-sm text-gray-600">Early adopters: 14% of users</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Pain Points</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Users size={12} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Role Definition</p>
                        <p className="text-xs text-gray-600">Less clear gender scripts for household responsibilities</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Brain size={12} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Equal Capability Assumption</p>
                        <p className="text-xs text-gray-600">Presumption that similar genders have similar abilities</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Heart size={12} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Social Support Gaps</p>
                        <p className="text-xs text-gray-600">Fewer family templates and role models</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Customized Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-green-600" />
                      </div>
                      <p className="text-sm">Skill & Preference Based Assignment</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-green-600" />
                      </div>
                      <p className="text-sm">Flexible Role Definition Tools</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-green-600" />
                      </div>
                      <p className="text-sm">Family Structure Templates Without Gender Scripts</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-green-600" />
                      </div>
                      <p className="text-sm">Inclusive Language & Representation</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Sparkles size={22} className="text-green-600 mr-2" />
                  Personalization Factors
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Family Formation</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Biological children
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Adoption
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Previous relationships
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Surrogacy
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Work Distribution</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Both full-time
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        One stay-at-home
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        One part-time
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Both flexible
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Community Integration</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        LGBTQ+ community
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Extended family support
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Friend network
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Parenting groups
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-600 to-teal-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">AI-Powered Personalized Features</h3>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Brain size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Adaptive Role Definition</p>
                      <p className="text-xs text-green-100">Learns preferred division of responsibilities without gender assumptions</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Users size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Inclusive Language Processing</p>
                      <p className="text-xs text-green-100">Natural language understanding trained on diverse family structures</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSegment === 'blended' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <Users size={24} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Blended Families</h3>
                  <p className="text-sm text-gray-600">Complex needs: 11% of users</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Pain Points</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Clock size={12} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Schedule Complexity</p>
                        <p className="text-xs text-gray-600">Managing multiple households, custody arrangements</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Users size={12} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Role Ambiguity</p>
                        <p className="text-xs text-gray-600">Unclear boundaries between step-parents and bio-parents</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Brain size={12} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Information Silos</p>
                        <p className="text-xs text-gray-600">Critical child info not shared across households</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Customized Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-yellow-600" />
                      </div>
                      <p className="text-sm">Multi-Household Calendar Integration</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-yellow-600" />
                      </div>
                      <p className="text-sm">Co-parenting Communication Platform</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-yellow-600" />
                      </div>
                      <p className="text-sm">Child-Centered Information Sharing</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Check size={12} className="text-yellow-600" />
                      </div>
                      <p className="text-sm">Step-parent Integration Tools</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Sparkles size={22} className="text-yellow-600 mr-2" />
                  Personalization Factors
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Custody Structure</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        50/50 custody
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Primary/weekend
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Summers/holidays split
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Complex arrangements
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Co-Parent Dynamics</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Cooperative
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Parallel parenting
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        High conflict
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Minimal contact
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Family Complexity</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Step-siblings
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Half-siblings
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Multi-household
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Extended step-family
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-600 to-orange-500 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">AI-Powered Personalized Features</h3>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Brain size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Multi-Household Knowledge Graph</p>
                      <p className="text-xs text-yellow-100">AI maintains connections between events, people and locations across households</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Users size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Adaptive Communication Channel</p>
                      <p className="text-xs text-yellow-100">Learns which information needs to be shared between co-parents</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-black p-6 rounded-lg text-white">
          <h3 className="text-xl font-medium mb-4 text-center">Advanced AI Personalization Engine</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-800 to-purple-900 p-3 rounded-lg">
              <h4 className="font-medium text-center text-sm mb-2">Family Profiles</h4>
              <p className="text-xs text-purple-200 text-center">
                Builds comprehensive profiles of each family member including preferences, schedules, and responsibilities
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-3 rounded-lg">
              <h4 className="font-medium text-center text-sm mb-2">Location Awareness</h4>
              <p className="text-xs text-blue-200 text-center">
                Adapts recommendations based on home, school, work, and frequent locations for smarter scheduling
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 p-3 rounded-lg">
              <h4 className="font-medium text-center text-sm mb-2">Multi-Modal Understanding</h4>
              <p className="text-xs text-indigo-200 text-center">
                Processes text, voice, images, and documents to extract context across different input types
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-800 to-teal-900 p-3 rounded-lg">
              <h4 className="font-medium text-center text-sm mb-2">Adaptive Learning</h4>
              <p className="text-xs text-teal-200 text-center">
                Improves over time through feedback loops, usage patterns, and explicit preference settings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-purple-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Brain size={24} className="text-purple-300" />
              </div>
              <h4 className="font-medium text-center mb-2">Personalized Surveys</h4>
              <p className="text-sm text-gray-300 text-center">
                Each survey adapts based on family composition, previous responses, and detected relationship patterns for relevant insights.
              </p>
              <div className="mt-3 pt-2 border-t border-gray-700">
                <ul className="text-xs text-gray-400 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Dynamic question generation based on family context</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Tailored follow-ups that detect friction points</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-blue-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Users size={24} className="text-blue-300" />
              </div>
              <h4 className="font-medium text-center mb-2">Contextual Conversation</h4>
              <p className="text-sm text-gray-300 text-center">
                Allie remembers past conversations, preferences, and family events to maintain context across interactions.
              </p>
              <div className="mt-3 pt-2 border-t border-gray-700">
                <ul className="text-xs text-gray-400 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Memory system recalls prior discussions and decisions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Conversation styles adapt to each family member</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-green-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Heart size={24} className="text-green-300" />
              </div>
              <h4 className="font-medium text-center mb-2">Adaptive Recommendations</h4>
              <p className="text-sm text-gray-300 text-center">
                Suggestions evolve based on what works for your specific family through continuous feedback loops.
              </p>
              <div className="mt-3 pt-2 border-t border-gray-700">
                <ul className="text-xs text-gray-400 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Regional awareness for location-specific suggestions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Personalized task weight calculation for fairness</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedApproachSlide;