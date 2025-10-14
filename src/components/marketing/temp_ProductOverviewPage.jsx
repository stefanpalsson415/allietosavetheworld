// src/components/marketing/ProductOverviewPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Play, Calendar, Users, BarChart2, MessageCircle, Award } from 'lucide-react';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

const ProductOverviewPage = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState(1);
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(1);
  
  // Sample family data for the interactive demo
  const sampleFamilyData = {
    name: "The Johnsons",
    members: [
      { name: "Sarah", role: "Mama", taskPercentage: 68 },
      { name: "Mike", role: "Papa", taskPercentage: 32 },
      { name: "Emma", age: 8 },
      { name: "Noah", age: 5 }
    ],
    taskCategories: [
      { name: "Visible Household", mama: 58, papa: 42 },
      { name: "Invisible Household", mama: 72, papa: 28 },
      { name: "Visible Parental", mama: 60, papa: 40 },
      { name: "Invisible Parental", mama: 82, papa: 18 }
    ],
    weeklyProgress: [
      { week: 1, mamaPercentage: 68, papaPercentage: 32 },
      { week: 2, mamaPercentage: 65, papaPercentage: 35 },
      { week: 3, mamaPercentage: 62, papaPercentage: 38 },
      { week: 4, mamaPercentage: 58, papaPercentage: 42 },
      { week: 6, mamaPercentage: 55, papaPercentage: 45 },
      { week: 8, mamaPercentage: 53, papaPercentage: 47 }
    ]
  };
  
  // Demo steps for the interactive demo
  const demoSteps = [
    {
      title: "Initial Assessment",
      description: "Each family member completes an 80-question assessment to establish your family's baseline balance.",
      content: (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Assessment Snapshot</h4>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Question 12 of 80:</p>
              <p className="bg-white p-3 rounded border border-gray-200 text-sm">
                "Who typically remembers to schedule routine medical appointments for family members?"
              </p>
              <div className="mt-2 grid grid-cols-5 gap-2">
                <button className="p-2 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">Always Me</button>
                <button className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs">Usually Me</button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Shared</button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Usually Partner</button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Always Partner</button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Question 13 of 80:</p>
              <p className="bg-white p-3 rounded border border-gray-200 text-sm">
                "Who typically tracks when children need new clothes or shoes?"
              </p>
              <div className="mt-2 grid grid-cols-5 gap-2">
                <button className="p-2 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">Always Me</button>
                <button className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs">Usually Me</button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Shared</button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Usually Partner</button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Always Partner</button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Balance Dashboard",
      description: "View your family's current balance metrics, including the distribution of visible and invisible labor.",
      content: (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Johnson Family Dashboard</h4>
          <div className="bg-white p-3 rounded border border-gray-200 mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Overall Task Distribution</h5>
            <div className="flex items-center h-6 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-pink-500" style={{ width: "68%" }}>
                <span className="ml-2 text-xs text-white font-medium">Sarah: 68%</span>
              </div>
              <div className="h-full bg-blue-500" style={{ width: "32%" }}>
                <span className="ml-2 text-xs text-white font-medium">Mike: 32%</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Task Categories</h5>
            <div className="space-y-3">
              {sampleFamilyData.taskCategories.map((category, index) => (
                <div key={index}>
                  <p className="text-xs mb-1">{category.name}</p>
                  <div className="flex items-center h-4 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-pink-500" style={{ width: `${category.mama}%` }}></div>
                    <div className="h-full bg-blue-500" style={{ width: `${category.papa}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Balance Recommendations",
      description: "Receive AI-generated recommendations to help create more balance in your family.",
      content: (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Recommended Actions</h4>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="flex justify-between items-start mb-1">
                <h5 className="text-sm font-medium text-gray-700">Morning Routine Shift</h5>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">High Impact</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Sarah currently handles 90% of morning preparation tasks. Mike could take over kids' breakfast 3 days per week.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-1.5 rounded-full bg-pink-500"></div>
                  <span className="text-[10px] text-gray-500">-12%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-1.5 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] text-gray-500">+12%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="flex justify-between items-start mb-1">
                <h5 className="text-sm font-medium text-gray-700">School Communication</h5>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">High Impact</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Mike could take over monitoring school emails and communications, which Sarah currently manages 100% of the time.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-1.5 rounded-full bg-pink-500"></div>
                  <span className="text-[10px] text-gray-500">-18%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-1.5 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] text-gray-500">+18%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Progress Tracking",
      description: "Track your family's journey toward greater balance over time with easy-to-understand metrics.",
      content: (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-4">8-Week Progress</h4>
          <div className="bg-white p-3 rounded border border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Task Distribution Over Time</h5>
            <div className="space-y-3">
              {sampleFamilyData.weeklyProgress.map((week, index) => (
                <div key={index}>
                  <p className="text-xs mb-1">Week {week.week}</p>
                  <div className="flex items-center h-4 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-pink-500" style={{ width: `${week.mamaPercentage}%` }}></div>
                    <div className="h-full bg-blue-500" style={{ width: `${week.papaPercentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <div className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                15% Improvement in Balance
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];
  
  // Roadmap steps
  const roadmapSteps = [
    {
      title: "Assessment",
      icon: <Users className="w-5 h-5" />,
      description: "Complete the comprehensive family balance assessment to establish your baseline"
    },
    {
      title: "Insights",
      icon: <BarChart2 className="w-5 h-5" />,
      description: "Receive detailed insights into your family's current division of visible and invisible labor"
    },
    {
      title: "Action Plan",
      icon: <Calendar className="w-5 h-5" />,
      description: "Get a personalized action plan with specific steps for creating more balance"
    },
    {
      title: "Support",
      icon: <MessageCircle className="w-5 h-5" />,
      description: "Ongoing guidance from our AI assistant to help implement changes effectively"
    },
    {
      title: "Progress",
      icon: <Award className="w-5 h-5" />,
      description: "Track your progress and celebrate improvements in your family's balance journey"
    }
  ];
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header - using shared component */}
      <MarketingHeader activeLink="/how-it-works" />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-6">How Allie Works</h1>
          <p className="text-xl font-light max-w-2xl mx-auto">
            Our science-backed approach combines AI and family psychology to help you create sustainable balance in your home
          </p>
          <div className="flex justify-center mt-8">
            <button 
              onClick={() => navigate('/signup')}
              className="px-6 py-3 bg-white text-blue-600 rounded-md font-medium hover:bg-gray-100 mr-4"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => navigate('/mini-survey')}
              className="px-6 py-3 border border-white text-white rounded-md font-medium hover:bg-white hover:bg-opacity-10"
            >
              Try Our Mini Assessment
            </button>
          </div>
        </div>
      </section>
      
      {/* Interactive Demo Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light mb-4">The Allie Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              See how Allie helps you transform your family's balance in just a few weeks
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <div className="sticky top-24 space-y-6">
                {demoSteps.map((step, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      activeDemo === index + 1 
                        ? "bg-blue-50 border-l-4 border-blue-500" 
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveDemo(index + 1)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          activeDemo === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                        }`}>
                          {index + 1}
                        </div>
                        <h3 className={`font-medium ${activeDemo === index + 1 ? "text-blue-800" : "text-gray-700"}`}>
                          {step.title}
                        </h3>
                      </div>
                      {activeDemo === index + 1 && (
                        <Play size={16} className="text-blue-500" />
                      )}
                    </div>
                    {activeDemo === index + 1 && (
                      <p className="mt-2 text-sm text-gray-600 pl-11">{step.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-medium">Step {activeDemo}: {demoSteps[activeDemo - 1].title}</h3>
                  <p className="text-gray-600 mt-1">{demoSteps[activeDemo - 1].description}</p>
                </div>
                <div className="p-6">
                  {demoSteps[activeDemo - 1].content}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                  <button 
                    className="flex items-center text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setActiveDemo(prev => Math.max(prev - 1, 1))}
                    disabled={activeDemo === 1}
                  >
                    <ChevronLeft size={20} className="mr-1" />
                    Previous
                  </button>
                  <button 
                    className="flex items-center text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setActiveDemo(prev => Math.min(prev + 1, demoSteps.length))}
                    disabled={activeDemo === demoSteps.length}
                  >
                    Next
                    <ChevronRight size={20} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Process Roadmap */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light mb-4">Your Path to Family Balance</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Allie guides you through a proven 5-step process to transform your family's balance
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between">
                {roadmapSteps.map((step, index) => (
                  <button
                    key={index}
                    className={`relative flex-1 py-2 ${
                      activeRoadmapStep === index + 1 
                        ? "text-blue-600" 
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    onClick={() => setActiveRoadmapStep(index + 1)}
                  >
                    <span className={`block mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      activeRoadmapStep === index + 1 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {step.icon}
                    </span>
                    <span className="block text-sm font-medium">{step.title}</span>
                    {index < roadmapSteps.length - 1 && (
                      <div className="absolute top-6 right-0 w-1/2 h-0.5 bg-gray-200"></div>
                    )}
                    {index > 0 && (
                      <div className="absolute top-6 left-0 w-1/2 h-0.5 bg-gray-200"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-xl font-medium mb-3">
                Step {activeRoadmapStep}: {roadmapSteps[activeRoadmapStep - 1].title}
              </h3>
              <p className="text-gray-600 mb-6">
                {roadmapSteps[activeRoadmapStep - 1].description}
              </p>
              
              {activeRoadmapStep === 1 && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-medium mb-3">The Allie Assessment</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Our comprehensive assessment goes beyond simple task tracking to capture the full picture of your family's workload distribution:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">1</div>
                      <div>
                        <p className="font-medium">Visible Tasks</p>
                        <p className="text-sm text-gray-600">Physical household and childcare responsibilities that can be seen</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">2</div>
                      <div>
                        <p className="font-medium">Invisible Mental Load</p>
                        <p className="text-sm text-gray-600">The cognitive labor of planning, organizing, and anticipating family needs</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">3</div>
                      <div>
                        <p className="font-medium">Emotional Labor</p>
                        <p className="text-sm text-gray-600">The work of managing emotions and relationships within the family</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">4</div>
                      <div>
                        <p className="font-medium">Satisfaction & Fairness</p>
                        <p className="text-sm text-gray-600">Each person's perception of balance and fairness within the family</p>
                      </div>
                    </li>
                  </ul>
                </div>
              )}
              
              {activeRoadmapStep === 2 && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-medium mb-3">Deep Family Insights</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    After completing the assessment, you'll receive detailed insights into your family's current balance pattern:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-sm mb-2">Task Distribution</h5>
                      <p className="text-xs text-gray-600">
                        A complete breakdown of how visible and invisible tasks are currently distributed between parents
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-sm mb-2">Perception Gaps</h5>
                      <p className="text-xs text-gray-600">
                        Identification of differences in how each parent perceives the current workload distribution
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-sm mb-2">Imbalance Hotspots</h5>
                      <p className="text-xs text-gray-600">
                        Key areas where the greatest imbalances exist, with impact scores for each category
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-sm mb-2">Hidden Patterns</h5>
                      <p className="text-xs text-gray-600">
                        Detection of subtle patterns that may contribute to imbalance over time
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeRoadmapStep === 3 && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-medium mb-3">Personalized Action Plan</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Based on your assessment results, Allie creates a tailored action plan designed specifically for your family's unique situation:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mr-3">1</div>
                        <div>
                          <p className="font-medium text-sm">High-Impact Task Transfers</p>
                          <p className="text-xs text-gray-600">
                            Specific tasks that will create the greatest balance improvement when redistributed
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mr-3">2</div>
                        <div>
                          <p className="font-medium text-sm">Communication Recommendations</p>
                          <p className="text-xs text-gray-600">
                            Specific language and approaches to discuss workload redistribution effectively
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mr-3">3</div>
                        <div>
                          <p className="font-medium text-sm">Transition Timeline</p>
                          <p className="text-xs text-gray-600">
                            A week-by-week schedule for gradually implementing changes in a sustainable way
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeRoadmapStep === 4 && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-medium mb-3">Ongoing Support</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Allie provides continuous guidance and support as you implement your action plan:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-sm mb-2">AI Assistant</h5>
                      <p className="text-xs text-gray-600">
                        24/7 access to Allie's AI assistant for questions, guidance, and troubleshooting
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-sm mb-2">Weekly Check-ins</h5>
                      <p className="text-xs text-gray-600">
                        Brief 5-minute check-ins to track progress and adjust recommendations as needed
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-sm mb-2">Educational Resources</h5>
                      <p className="text-xs text-gray-600">
                        Personalized articles and guides specific to your family's balance challenges
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-sm mb-2">Family Meeting Tools</h5>
                      <p className="text-xs text-gray-600">
                        Structured guides for productive family discussions about workload balance
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeRoadmapStep === 5 && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-medium mb-3">Measurable Progress</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Track your family's journey toward greater balance with clear metrics and milestones:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-green-100">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mr-3">
                          <Award size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Balance Improvement Metrics</p>
                          <p className="text-xs text-gray-600 mb-1">
                            Clear, quantifiable measures of how your family balance has improved over time
                          </p>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: "68%" }}></div>
                          </div>
                          <p className="text-right text-xs mt-1 text-green-600 font-medium">68% to Goal</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-green-100">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mr-3">
                          <Award size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Satisfaction Scores</p>
                          <p className="text-xs text-gray-600 mb-1">
                            Regular measurement of how satisfied each family member is with the current balance
                          </p>
                          <div className="flex items-center space-x-1 mb-1">
                            <p className="text-xs w-10">Before:</p>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-500" style={{ width: "40%" }}></div>
                            </div>
                            <p className="text-xs w-6">4/10</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <p className="text-xs w-10">Now:</p>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: "80%" }}></div>
                            </div>
                            <p className="text-xs w-6">8/10</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-green-100">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mr-3">
                          <Award size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Long-Term Sustainability</p>
                          <p className="text-xs text-gray-600">
                            Tools and resources to help your family maintain balance over the long term, even as your family needs evolve
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-8">
                <button 
                  className="flex items-center text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setActiveRoadmapStep(prev => Math.max(prev - 1, 1))}
                  disabled={activeRoadmapStep === 1}
                >
                  <ChevronLeft size={20} className="mr-1" />
                  Previous Step
                </button>
                <button 
                  className="flex items-center text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setActiveRoadmapStep(prev => Math.min(prev + 1, roadmapSteps.length))}
                  disabled={activeRoadmapStep === roadmapSteps.length}
                >
                  Next Step
                  <ChevronRight size={20} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light mb-4">Results That Speak For Themselves</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Here's what families are saying about their experience with Allie
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
              <p className="text-gray-700 mb-6 font-light italic">
                "After years of arguments about household responsibilities, Allie helped us see exactly where the imbalances were happening. The invisible mental load was something we'd never properly accounted for. Three months in, and we've never had a more balanced relationship."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-medium">JM</span>
                </div>
                <div>
                  <p className="font-medium">James & Michelle</p>
                  <p className="text-sm text-gray-600">Parents of 3, using Allie for 3 months</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-100">
              <p className="text-gray-700 mb-6 font-light italic">
                "I was shocked to discover I was handling 78% of our family's invisible work! My partner had no idea either. Allie not only showed us the imbalance but gave us practical steps to fix it. Now we're at a much healthier 60/40 split and both feeling so much happier."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-medium">SE</span>
                </div>
                <div>
                  <p className="font-medium">Sarah E.</p>
                  <p className="text-sm text-gray-600">Mother of 2, using Allie for 6 months</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-xl shadow-sm border border-purple-100">
              <p className="text-gray-700 mb-6 font-light italic">
                "As a dad, I thought I was doing my fair share. Allie showed me that while I was handling a lot of visible tasks, my wife was carrying almost all of the mental load. The recommendations were practical and made it easy for me to take on more of the invisible work."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-medium">DT</span>
                </div>
                <div>
                  <p className="font-medium">David T.</p>
                  <p className="text-sm text-gray-600">Father of 1, using Allie for 2 months</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-100">
              <p className="text-gray-700 mb-6 font-light italic">
                "The weekly check-ins kept us accountable, and the AI assistant was surprisingly helpful for answering questions about how to redistribute specific tasks. We've gone from constant tension about housework to a much more peaceful home."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-yellow-600 font-medium">KR</span>
                </div>
                <div>
                  <p className="font-medium">Kimberly & Ryan</p>
                  <p className="text-sm text-gray-600">Parents of 2, using Allie for 4 months</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Everything you need to know about how Allie works
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-2">How long does the assessment take?</h3>
              <p className="text-gray-600">
                The comprehensive assessment takes about 15-20 minutes per person. We've designed it to be thorough yet efficient, focusing on the most important aspects of family workload balance.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium mb-2">Is Allie only for couples with children?</h3>
              <p className="text-gray-600">
                While Allie is especially helpful for parents juggling childcare responsibilities, it's beneficial for any household where multiple people share responsibilities. We have specialized assessments for couples without children, single parents with co-parenting arrangements, and other family structures.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium mb-2">How quickly will we see results?</h3>
              <p className="text-gray-600">
                Most families report noticing positive changes within the first 2-3 weeks of implementing their action plan. Significant improvements in balance and satisfaction typically occur within 8-12 weeks, with ongoing progress over time as new habits become established.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium mb-2">How does Allie's AI work?</h3>
              <p className="text-gray-600">
                Allie's AI analyzes your assessment responses, learning patterns from thousands of families while maintaining your privacy. It identifies imbalances in your specific situation and generates personalized recommendations based on approaches that have proven successful for families with similar patterns.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium mb-2">Is my family's data private?</h3>
              <p className="text-gray-600">
                Absolutely. Your family's information is fully encrypted and never shared with third parties. We use anonymized, aggregate data to improve our recommendations, but your specific family details remain completely private and secure.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light mb-4">Ready to Transform Your Family's Balance?</h2>
          <p className="text-xl opacity-80 mb-8 font-light max-w-2xl mx-auto">
            Join thousands of families who have discovered a more balanced, harmonious way of sharing responsibilities
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white text-blue-600 rounded-md font-medium hover:bg-gray-100"
          >
            Get Started Free
          </button>
          <p className="mt-4 text-sm opacity-80">No credit card required for your 30-day free trial</p>
        </div>
      </section>
      
      {/* Footer - using shared component */}
      <MarketingFooter />
    </div>
  );
};

export default ProductOverviewPage;