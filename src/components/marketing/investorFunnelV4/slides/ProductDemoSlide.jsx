import React, { useState } from 'react';
import SlideTemplate from './SlideTemplate';
import { VideoEmbed } from './components';
import { 
  Play, 
  CheckCircle, 
  ArrowRight, 
  UserPlus, 
  ClipboardList, 
  MessageSquare, 
  Calendar, 
  Brain, 
  Book,
  Zap,
  BarChart2,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';

/**
 * Product Demo Slide featuring the three core components of Allie:
 * 1. Onboarding & Survey
 * 2. Core App Experience
 * 3. Allie Chat
 */
const ProductDemoSlide = () => {
  // State to track which demo section is selected
  const [activeDemo, setActiveDemo] = useState('onboarding');

  // Placeholder images - replace with actual screenshots or video thumbnails
  const thumbnails = {
    onboarding: 'https://placehold.co/600x340/7c3aed/ffffff?text=Onboarding+%26+Survey',
    coreApp: 'https://placehold.co/600x340/3b82f6/ffffff?text=Core+App+Experience', 
    allieChat: 'https://placehold.co/600x340/10b981/ffffff?text=Allie+Chat'
  };

  // Demo section information
  const demoSections = {
    onboarding: {
      title: "Smart Onboarding & Family Assessment",
      description: "Our sophisticated onboarding process personalizes Allie to each family's unique needs from day one.",
      color: "indigo",
      icon: <UserPlus />,
      videoType: 'youtube',
      videoSrc: 'https://youtu.be/-EMZV4x8lgI', // Onboarding video
      keyPoints: [
        "Relationship-aware assessment using validated psychology models",
        "Personalized task weight calculation based on family profile",
        "Intuitive, progressive onboarding with family member enrollment",
        "Mental load baseline assessment with configurable tracking"
      ],
      features: [
        { name: "Custom Profiles", icon: <UserPlus size={16} /> },
        { name: "Family Structure Mapping", icon: <Book size={16} /> },
        { name: "Mental Load Assessment", icon: <Brain size={16} /> },
        { name: "Task Weight Calculator", icon: <BarChart2 size={16} /> }
      ]
    },
    coreApp: {
      title: "Core App Experience",
      description: "The central hub where families gain visibility, coordinate responsibilities, and rebalance workload.",
      color: "blue",
      icon: <LayoutDashboard />,
      videoType: 'youtube',
      videoSrc: 'https://youtu.be/i0_jaHO_P9A', // Core App video
      keyPoints: [
        "Family Balance Dashboard with real-time mental load distribution metrics",
        "Smart Calendar integration with task weight assignment",
        "Proactive notification system for workload imbalance alerts",
        "Family Command Center for document, provider, and activity management"
      ],
      features: [
        { name: "Balance Dashboard", icon: <LayoutDashboard size={16} /> },
        { name: "Smart Calendar", icon: <Calendar size={16} /> },
        { name: "Family Command Center", icon: <ClipboardList size={16} /> },
        { name: "Workload Visualization", icon: <BarChart2 size={16} /> }
      ]
    },
    allieChat: {
      title: "Allie Chat Assistant",
      description: "Our AI heart that powers personalized guidance and smart task management across the entire platform.",
      color: "emerald",
      icon: <MessageSquare />,
      videoType: 'youtube', // change when you have the video
      videoSrc: '', // you'll add this when ready
      keyPoints: [
        "Context-aware AI that truly understands family dynamics",
        "Intelligent event parsing and task detection",
        "Proactive workload balancing suggestions",
        "Relationship-strengthening recommendations with research backing"
      ],
      features: [
        { name: "Smart Assistant", icon: <MessageSquare size={16} /> },
        { name: "Event Parsing", icon: <Calendar size={16} /> },
        { name: "Research-Backed Advice", icon: <Book size={16} /> },
        { name: "Context Memory", icon: <Brain size={16} /> }
      ]
    }
  };

  // Get current demo section
  const currentDemo = demoSections[activeDemo];

  // Helper function for styling the demo tabs
  const getTabStyles = (demoKey) => {
    const baseStyles = "px-5 py-3 rounded-lg font-medium transition-all flex items-center justify-center";
    const isActive = activeDemo === demoKey;
    
    let colorStyles = "";
    const demoSection = demoSections[demoKey];
    
    if (isActive) {
      if (demoSection.color === "indigo") {
        colorStyles = "bg-indigo-600 text-white";
      } else if (demoSection.color === "blue") {
        colorStyles = "bg-blue-600 text-white";
      } else if (demoSection.color === "emerald") {
        colorStyles = "bg-emerald-600 text-white";
      }
    } else {
      if (demoSection.color === "indigo") {
        colorStyles = "bg-indigo-50 text-indigo-700 hover:bg-indigo-100";
      } else if (demoSection.color === "blue") {
        colorStyles = "bg-blue-50 text-blue-700 hover:bg-blue-100";
      } else if (demoSection.color === "emerald") {
        colorStyles = "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
      }
    }
    
    return `${baseStyles} ${colorStyles}`;
  };

  // Get current color theme
  const getThemeColors = () => {
    switch (currentDemo.color) {
      case 'indigo':
        return {
          light: 'bg-indigo-50',
          medium: 'bg-indigo-100',
          border: 'border-indigo-200',
          text: 'text-indigo-700',
          accent: 'bg-indigo-600',
          gradient: 'from-indigo-50 to-purple-100'
        };
      case 'blue':
        return {
          light: 'bg-blue-50',
          medium: 'bg-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-700',
          accent: 'bg-blue-600',
          gradient: 'from-blue-50 to-indigo-100'
        };
      case 'emerald':
        return {
          light: 'bg-emerald-50',
          medium: 'bg-emerald-100',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          accent: 'bg-emerald-600',
          gradient: 'from-emerald-50 to-teal-100'
        };
      default:
        return {
          light: 'bg-gray-50',
          medium: 'bg-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-700',
          accent: 'bg-gray-600',
          gradient: 'from-gray-50 to-gray-100'
        };
    }
  };
  
  const colors = getThemeColors();

  return (
    <SlideTemplate
      title="Allie in Action"
      subtitle="Experience our complete family balance platform through three core components"
    >
      {/* Demo Selection Tabs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          className={getTabStyles('onboarding')}
          onClick={() => setActiveDemo('onboarding')}
        >
          <UserPlus size={18} className="mr-2" />
          <span className="sm:inline hidden">Onboarding</span>
          <span className="sm:hidden">1</span>
        </button>
        <button
          className={getTabStyles('coreApp')}
          onClick={() => setActiveDemo('coreApp')}
        >
          <LayoutDashboard size={18} className="mr-2" />
          <span className="sm:inline hidden">Core App</span>
          <span className="sm:hidden">2</span>
        </button>
        <button
          className={getTabStyles('allieChat')}
          onClick={() => setActiveDemo('allieChat')}
        >
          <MessageSquare size={18} className="mr-2" />
          <span className="sm:inline hidden">Allie Chat</span>
          <span className="sm:hidden">3</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Video Section */}
        <div className={`rounded-xl shadow-lg overflow-hidden ${colors.light}`}>
          <div className="p-4 border-b ${colors.border}">
            <h3 className={`text-xl font-semibold ${colors.text} flex items-center`}>
              {currentDemo.icon && <span className="mr-2">{currentDemo.icon}</span>}
              {currentDemo.title}
            </h3>
            <p className="text-gray-600 text-sm mt-1">{currentDemo.description}</p>
          </div>
          
          {/* Video Placeholder - Will be replaced with actual video */}
          <div className="p-4">
            {currentDemo.videoSrc ? (
              <VideoEmbed
                src={currentDemo.videoSrc}
                type={currentDemo.videoType}
                title={currentDemo.title}
                posterImage={thumbnails[activeDemo]}
                aspectRatio={{ width: 16, height: 9 }}
              />
            ) : (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={thumbnails[activeDemo]} 
                    alt={`${currentDemo.title} thumbnail`} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-80 p-3 rounded-lg">
                      <p className="text-gray-800 font-medium text-center">Video will be uploaded soon</p>
                      <div className="flex justify-center mt-2">
                        <Play size={24} className={colors.text} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className={`rounded-xl shadow-lg overflow-hidden ${colors.light}`}>
          <div className={`${colors.medium} p-4`}>
            <h3 className={`text-lg font-semibold ${colors.text}`}>Key Features & Benefits</h3>
          </div>
          
          <div className="p-4">
            <ul className="space-y-3">
              {currentDemo.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className={`${colors.text} mt-1 mr-2 flex-shrink-0`} size={18} />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
            
            <div className={`mt-4 p-3 rounded-lg border ${colors.border} ${colors.light}`}>
              <div className="grid grid-cols-2 gap-3">
                {currentDemo.features.map((feature, index) => (
                  <div key={index} className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                    <div className={`w-8 h-8 rounded-full ${colors.medium} flex items-center justify-center mr-2`}>
                      {feature.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Integration Journey */}
      <div className={`p-6 rounded-xl shadow-lg bg-gradient-to-r ${colors.gradient}`}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Sparkles size={24} className={`${colors.text} mr-2`} />
          The Complete Family Balance Journey
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <div className="relative">
            <div className={`p-4 rounded-lg bg-white shadow-sm border ${colors.border}`}>
              <div className="flex items-center mb-2">
                <div className={`w-8 h-8 rounded-full ${colors.accent} text-white flex items-center justify-center mr-2`}>
                  <span className="font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-800">Smart Onboarding</h4>
              </div>
              <p className="text-sm text-gray-600">
                Personalized assessment creates a family profile and establishes baseline mental load distribution.
              </p>
            </div>
            <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
              <ArrowRight size={24} className={colors.text} />
            </div>
          </div>
          
          <div className="relative">
            <div className={`p-4 rounded-lg bg-white shadow-sm border ${colors.border}`}>
              <div className="flex items-center mb-2">
                <div className={`w-8 h-8 rounded-full ${colors.accent} text-white flex items-center justify-center mr-2`}>
                  <span className="font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-800">Core App Experience</h4>
              </div>
              <p className="text-sm text-gray-600">
                Family dashboard, workload visualization, smart calendar, and command center provide comprehensive management.
              </p>
            </div>
            <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
              <ArrowRight size={24} className={colors.text} />
            </div>
          </div>
          
          <div>
            <div className={`p-4 rounded-lg bg-white shadow-sm border ${colors.border}`}>
              <div className="flex items-center mb-2">
                <div className={`w-8 h-8 rounded-full ${colors.accent} text-white flex items-center justify-center mr-2`}>
                  <span className="font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-800">AI-Powered Assistance</h4>
              </div>
              <p className="text-sm text-gray-600">
                Allie's intelligent assistant provides guidance, proactive suggestions, and continuous task weight optimization.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <Zap size={18} className={`${colors.text} mr-2`} />
            <h4 className="font-semibold text-gray-700">The Result: Balanced Family Life</h4>
          </div>
          <p className="text-sm text-gray-600">
            Families achieve more equitable mental load distribution, enhanced communication, and reduced household stress - all through our integrated platform approach.
          </p>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default ProductDemoSlide;