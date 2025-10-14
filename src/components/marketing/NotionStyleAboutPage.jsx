import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Shield, Users, Eye, Award, BookOpen, Sparkles,
  ArrowRight, CheckCircle, MessageCircle, FileCheck, Lightbulb,
  HandHeart, Brain, Star, Quote, Globe, Zap, Target, 
  TrendingUp, Layers, Lock, Smile
} from 'lucide-react';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

const NotionStyleAboutPage = () => {
  const navigate = useNavigate();
  const [activeValue, setActiveValue] = useState(0);

  // Hero stats - removed fake metrics

  // Mission statement sections
  const missionSections = [
    {
      title: "Our Mission",
      content: "To make family life more balanced, connected, and joyful through intelligent technology that understands and adapts to each family's unique needs.",
      icon: Target
    },
    {
      title: "Our Vision", 
      content: "A world where technology strengthens family bonds rather than competing for attention, and where the mental load of parenting is visible and fairly shared.",
      icon: Eye
    },
    {
      title: "Our Promise",
      content: "To always put families first, protect their privacy as sacred, and build features that truly serve their wellbeing—not our metrics.",
      icon: HandHeart
    }
  ];

  // Team members with Notion-style layout
  const team = [
    {
      name: "Stefan Palsson",
      role: "Co-Founder & CEO",
      bio: "Former Google & Airbnb product leader. Father of three.",
      image: "/assets/stefan-palsson.jpg",
      quote: "I built Allie because I saw my wife carrying an unfair mental load, and I knew technology could help.",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Kimberly Palsson",
      role: "Co-Founder & Chief Family Officer",
      bio: "Educator and mother. The inspiration behind Allie.",
      image: "/assets/kimberly-palsson.jpg",
      quote: "Every parent deserves to feel supported. Allie is the partner I wished I had.",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Shane Culp",
      role: "Co-Founder & CTO",
      bio: "Ex-Microsoft & Amazon engineer. Father and builder.",
      image: "/assets/shane-culp.jpg",
      quote: "We have a responsibility to build technology that strengthens families.",
      linkedin: "#",
      twitter: "#"
    }
  ];

  // Values with interactive cards
  const values = [
    {
      icon: Users,
      title: "Family First",
      shortDesc: "Every decision starts here",
      fullDesc: "We measure success by how much easier we make family life. Every feature, every update, every decision is filtered through this lens: Does it help families thrive?",
      color: "blue"
    },
    {
      icon: Lock,
      title: "Privacy Sacred",
      shortDesc: "Your data stays yours",
      fullDesc: "Your family's information is never sold, shared, or used for advertising. We use bank-level encryption and you can delete everything anytime.",
      color: "green"
    },
    {
      icon: Globe,
      title: "Inclusive Design",
      shortDesc: "Built for all families",
      fullDesc: "Single parents, blended families, multi-generational homes—we design for the beautiful diversity of modern families.",
      color: "purple"
    },
    {
      icon: Sparkles,
      title: "Continuous Growth",
      shortDesc: "Always improving",
      fullDesc: "We evolve with your feedback and the latest research. Your family changes, and Allie grows with you.",
      color: "amber"
    }
  ];

  // Trust framework with research backing
  const trustFramework = [
    {
      principle: "Transparency",
      research: "Studies show parents trust services more when they understand exactly how decisions are made.",
      implementation: "Every AI recommendation shows its reasoning",
      icon: Eye
    },
    {
      principle: "Expertise",
      research: "Parents weigh credentials more heavily than convenience when choosing family services.",
      implementation: "Guided by pediatricians and family therapists",
      icon: Award
    },
    {
      principle: "Consistency",
      research: "Trust deepens through predictable, empathic interactions over time.",
      implementation: "Allie maintains a warm, reliable personality",
      icon: Heart
    }
  ];

  // Timeline milestones
  const milestones = [
    {
      year: "2022",
      title: "The Spark",
      description: "Stefan watches Kimberly juggle invisible tasks and realizes tech could help"
    },
    {
      year: "2023",
      title: "First Prototype",
      description: "Beta testing reveals the power of making mental load visible"
    },
    {
      year: "2024",
      title: "Official Launch",
      description: "Allie goes live to help families find balance"
    },
    {
      year: "2025",
      title: "Today",
      description: "Building the future of family coordination, one feature at a time"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      
      {/* Hero Section - Clean Notion Style */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-bold text-black mb-6 tracking-tight">
              Helping families thrive,
              <br />
              <span className="text-gray-400">one day at a time.</span>
            </h1>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-light">
              We're parents building the tools we wished we had. 
              Welcome to the story behind Allie.
            </p>
          </div>
          
        </div>
      </section>

      {/* Mission/Vision/Promise - Card Style */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {missionSections.map((section, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                  <section.icon size={24} className="text-gray-700" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{section.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section - Interactive */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className={`group relative bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-gray-300 transition-all cursor-pointer ${
                  activeValue === index ? 'border-black shadow-lg' : ''
                }`}
                onClick={() => setActiveValue(index)}
              >
                <div className={`w-10 h-10 bg-${value.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <value.icon size={20} className={`text-${value.color}-600`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{value.shortDesc}</p>
                
                {activeValue === index && (
                  <div className="absolute left-0 right-0 top-full mt-4 p-6 bg-black text-white rounded-2xl z-10">
                    <p className="text-sm leading-relaxed">{value.fullDesc}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Framework - Research Backed */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Built on Trust</h2>
            <p className="text-xl text-gray-600">Research-backed principles that guide our design</p>
          </div>
          
          <div className="space-y-8">
            {trustFramework.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-12">
                    <div className="flex items-start mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                        <item.icon size={20} className="text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{item.principle}</h3>
                        <p className="text-gray-600 mb-3">{item.research}</p>
                        <p className="text-black font-medium flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          {item.implementation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Notion Style */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Meet the Team</h2>
            <p className="text-xl text-gray-600">The parents behind the platform</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="group">
                <div className="relative overflow-hidden rounded-2xl mb-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                <p className="text-gray-600 mb-3">{member.role}</p>
                <p className="text-gray-700 mb-4">{member.bio}</p>
                <blockquote className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-4">
                  "{member.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">From kitchen table idea to family lifeline</p>
          </div>
          
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-8">
                <div className="flex-shrink-0 w-24 text-right">
                  <div className="text-2xl font-bold text-gray-400">{milestone.year}</div>
                </div>
                <div className="relative flex-grow">
                  <div className="absolute left-0 top-3 w-3 h-3 bg-black rounded-full" />
                  {index < milestones.length - 1 && (
                    <div className="absolute left-1.5 top-6 w-0.5 h-full bg-gray-200" />
                  )}
                  <div className="pl-8">
                    <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Join the Allie family
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Experience what it's like to have a true partner in parenting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-black text-white rounded-xl text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Get started free
            </button>
            <button
              onClick={() => navigate('/how-it-works')}
              className="px-8 py-4 bg-white text-black rounded-xl text-lg font-medium border-2 border-gray-200 hover:border-gray-300 transition-colors"
            >
              See how it works
            </button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default NotionStyleAboutPage;