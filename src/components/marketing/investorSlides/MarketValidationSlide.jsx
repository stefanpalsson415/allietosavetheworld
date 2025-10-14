import React from 'react';
import { CheckCircle, TrendingUp, PieChart, User, Users, DollarSign, Award } from 'lucide-react';

const MarketValidationSlide = () => {
  const validationPoints = [
    {
      icon: <Users className="text-blue-500" />,
      title: "Target Audience Validation",
      description: "Extensive user interviews with 240+ parents across different demographics confirmed our understanding of the problem and solution fit.",
      stats: [
        { label: "Problem recognition", value: "94%" },
        { label: "Solution interest", value: "87%" }
      ]
    },
    {
      icon: <DollarSign className="text-green-500" />,
      title: "Willingness to Pay",
      description: "Strong monetization signal across our beta users and research participants.",
      stats: [
        { label: "Average WTP", value: "$42/mo" },
        { label: "Conversion rate", value: "18%" }
      ]
    },
    {
      icon: <TrendingUp className="text-purple-500" />,
      title: "Engagement Metrics",
      description: "Beta users show promising behavioral signals suggesting long-term retention.",
      stats: [
        { label: "Daily active ratio", value: "74%" },
        { label: "Feature adoption", value: "5.8/7" }
      ]
    },
    {
      icon: <Award className="text-amber-500" />,
      title: "Quality Feedback",
      description: "Strong positive sentiment among early users, with high NPS and favorable comparisons to alternatives.",
      stats: [
        { label: "NPS score", value: "72" },
        { label: "Feature satisfaction", value: "8.4/10" }
      ]
    }
  ];

  const researchHighlights = [
    { 
      category: "Product-Market Fit", 
      findings: [
        "87% of interviewees described solution as 'exactly what I need'",
        "92% of beta users continue active usage past 60 days",
        "User-driven feature requests align with our product roadmap"
      ]
    },
    { 
      category: "Competitive Advantage", 
      findings: [
        "73% prefer our offering vs. manual task management",
        "82% cited AI personalization as key differentiator",
        "Deeply integrated calendar as #1 cited advantage"
      ]
    },
    { 
      category: "Market Expansion", 
      findings: [
        "74% of users mentioned recommending to other parents",
        "Virtual school coordinator feature requested by 68%",
        "International interest from 3 continents without marketing"
      ]
    }
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-4">Market Validation</h2>
        <h3 className="text-xl font-light text-gray-600 mb-10">Real-world evidence confirms our solution's fit and demand</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          <div className="space-y-6">
            {validationPoints.slice(0, 2).map((point, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-gray-50 p-3 mr-3 flex-shrink-0">
                    {point.icon}
                  </div>
                  <h3 className="text-xl font-medium">{point.title}</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  {point.description}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {point.stats.map((stat, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-xs text-gray-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-6">
            {validationPoints.slice(2).map((point, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-gray-50 p-3 mr-3 flex-shrink-0">
                    {point.icon}
                  </div>
                  <h3 className="text-xl font-medium">{point.title}</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  {point.description}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {point.stats.map((stat, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-xs text-gray-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 mb-10 border border-indigo-100">
          <h3 className="text-xl font-medium mb-6 text-center">Research Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {researchHighlights.map((highlight, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-sm">
                <h4 className="font-medium text-purple-700 mb-3">{highlight.category}</h4>
                <ul className="space-y-2">
                  {highlight.findings.map((finding, fidx) => (
                    <li key={fidx} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-medium mb-4">User Testimonials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-3">
                <div className="rounded-full bg-blue-100 p-2 mr-3">
                  <User className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="font-medium">Jennifer K.</p>
                  <p className="text-xs text-gray-600">Working mother of 3, beta user for 2 months</p>
                </div>
              </div>
              <blockquote className="text-sm text-gray-700 italic border-l-4 border-blue-200 pl-3">
                "I've tried every family organization app out there, and Allie is the first one that actually reduces my mental load instead of adding to it. The AI element is game-changing."
              </blockquote>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-3">
                <div className="rounded-full bg-green-100 p-2 mr-3">
                  <User className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="font-medium">David T.</p>
                  <p className="text-xs text-gray-600">Father of 2, beta user for 6 weeks</p>
                </div>
              </div>
              <blockquote className="text-sm text-gray-700 italic border-l-4 border-green-200 pl-3">
                "My wife and I had constant arguments about mental load before using Allie. The visibility it creates has dramatically improved our communication about family responsibilities."
              </blockquote>
            </div>
          </div>
        </div>
        
        <div className="mt-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="text-center">
            <h3 className="text-xl font-medium mb-4">Market Validation Summary</h3>
            <p className="max-w-2xl mx-auto mb-6">
              Our market research and beta testing provide strong signals that Allie addresses a significant unmet need with a solution users value enough to pay for.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg min-w-[180px]">
                <p className="text-2xl font-bold">87%</p>
                <p className="text-sm opacity-90">Solution-problem fit</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg min-w-[180px]">
                <p className="text-2xl font-bold">72 NPS</p>
                <p className="text-sm opacity-90">Strong promoter score</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg min-w-[180px]">
                <p className="text-2xl font-bold">92%</p>
                <p className="text-sm opacity-90">60-day retention</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketValidationSlide;