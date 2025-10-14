// src/components/marketing/NewAboutUsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Shield, Users, Eye, Award, BookOpen, Sparkles,
  ArrowRight, CheckCircle, MessageCircle, FileCheck, Lightbulb,
  HandHeart, Brain, Star, Quote
} from 'lucide-react';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

const NewAboutUsPage = () => {
  const navigate = useNavigate();

  // Trust pillars based on research
  const trustPillars = [
    {
      icon: Eye,
      title: "Radical Transparency & Clear Communication",
      description: "Parents cite openness about what will happen, why, and how as the single biggest driver of trust.",
      features: [
        {
          title: "AI That Shows Its Work",
          description: "Every Allie recommendation comes with clear explanations and cited sources. You see exactly how decisions are made."
        },
        {
          title: "Real-Time Updates",
          description: "Know what's happening with your family data at all times. No black boxes, no surprises."
        },
        {
          title: "Plain Language First",
          description: "We explain everything in clear, jargon-free language that respects your intelligence without assuming expertise."
        }
      ],
      research: "Studies show adherence to pediatric guidelines rises sharply when caregivers feel free to ask questions and get jargon-free answers."
    },
    {
      icon: Award,
      title: "Proven Competence & Credentials",
      description: "Parents weigh qualifications, certifications, and evidence-based practice heavily when choosing services.",
      features: [
        {
          title: "Research-Backed Methods",
          description: "Every feature is grounded in peer-reviewed research from family systems, child development, and behavioral science."
        },
        {
          title: "Expert Advisory Board",
          description: "Guided by pediatricians, family therapists, and child development specialists who validate our approaches."
        },
        {
          title: "Continuous Validation",
          description: "Regular audits and updates ensure our AI stays current with best practices and family research."
        }
      ],
      research: "Perceived expertise predicts willingness to follow advice—even more than cost or convenience—in both medical-research consent and care decisions."
    },
    {
      icon: HandHeart,
      title: "Warm, Relationship-Based Consistency",
      description: "Trust deepens through predictable, empathic, ongoing interactions—the cornerstone of family-systems therapy.",
      features: [
        {
          title: "Allie Learns Your Family",
          description: "Not just data points, but understanding your family's unique dynamics, preferences, and communication style."
        },
        {
          title: "Consistent Personality",
          description: "Allie maintains a warm, supportive presence that feels like a trusted family friend, not a cold algorithm."
        },
        {
          title: "Growing Together",
          description: "As your family evolves, Allie adapts while maintaining the relationship and trust you've built."
        }
      ],
      research: "Daily face time with providers translates into higher disclosure rates and faster help-seeking, even in digital formats."
    }
  ];

  // Founder information
  const founders = [
    {
      name: "Stefan Palsson",
      role: "Co-Founder & CEO",
      bio: "Father of three and former tech executive who experienced firsthand the invisible labor imbalance in modern families. Stefan brings 15+ years of product leadership from companies like Google and Airbnb.",
      image: "/assets/stefan-palsson.jpg",
      quote: "I built Allie because I saw my wife carrying an unfair mental load, and I knew technology could help make the invisible visible."
    },
    {
      name: "Kimberly Palsson",
      role: "Co-Founder & Chief Family Officer",
      bio: "Mother, educator, and the inspiration behind Allie. Kimberly's experience managing a household while pursuing her career highlighted the need for better family coordination tools.",
      image: "/assets/kimberly-palsson.jpg",
      quote: "Every parent deserves to feel supported. Allie is the partner I wished I had during those overwhelming early years."
    },
    {
      name: "Shane Culp",
      role: "Co-Founder & CTO",
      bio: "Engineering leader and father who believes in using AI for social good. Shane has built scalable systems at Microsoft and Amazon, now focused on making family life more equitable.",
      image: "/assets/shane-culp.jpg",
      quote: "As engineers and parents, we have a responsibility to build technology that strengthens families, not divides them."
    }
  ];

  // Company values
  const values = [
    {
      icon: Heart,
      title: "Family First",
      description: "Every decision starts with 'How does this help families thrive?'"
    },
    {
      icon: Shield,
      title: "Privacy Sacred",
      description: "Your family data is yours alone. We never sell or share it."
    },
    {
      icon: Users,
      title: "Inclusive Design",
      description: "Built for all families, regardless of structure or size."
    },
    {
      icon: Sparkles,
      title: "Continuous Growth",
      description: "We evolve with your feedback and the latest research."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 opacity-70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Built By Parents,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                For Parents
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              We're not just building an app. We're building a partner that parents 
              can trust with their family's wellbeing.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Framework Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              How We Earn Your Trust
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Large comparative studies in pediatrics, childcare, and digital health 
              all point to three repeatable "trust-builders." We've built Allie on these foundations.
            </p>
          </div>

          <div className="space-y-16">
            {trustPillars.map((pillar, index) => (
              <div key={index} className={`${index % 2 === 1 ? 'bg-gray-50 -mx-8 px-8 py-12 rounded-3xl' : ''}`}>
                <div className="grid md:grid-cols-12 gap-8 items-start">
                  <div className="md:col-span-5">
                    <div className="flex items-start mb-6">
                      <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                        <pillar.icon size={32} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {pillar.title}
                        </h3>
                        <p className="text-gray-700 mb-4">{pillar.description}</p>
                        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
                          <p className="text-sm text-indigo-900 italic">
                            <Quote size={16} className="inline mr-1" />
                            {pillar.research}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-7">
                    <div className="space-y-4">
                      {pillar.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="bg-white p-6 rounded-xl shadow-md">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <CheckCircle size={20} className="text-green-500 mr-2" />
                            {feature.title}
                          </h4>
                          <p className="text-gray-600">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Founders */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Meet Our Founding Family
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're parents who've lived the challenges we're solving. 
              Every feature comes from real family experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {founders.map((founder, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="aspect-w-4 aspect-h-3">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{founder.name}</h3>
                  <p className="text-indigo-600 font-medium mb-4">{founder.role}</p>
                  <p className="text-gray-700 mb-4">{founder.bio}</p>
                  <div className="bg-gray-50 -mx-8 -mb-8 px-8 py-6 mt-6">
                    <p className="text-gray-600 italic">
                      <Quote size={20} className="text-indigo-400 mb-2" />
                      {founder.quote}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Allie's Personality */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Meet Allie: Your Family's AI Partner
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Allie isn't just an AI assistant—she's designed to be a trusted member 
                of your family team. Warm, reliable, and always learning.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Brain className="text-indigo-600 mr-3 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Intelligent & Adaptive</h4>
                    <p className="text-gray-600">Learns your family's unique patterns and preferences over time</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MessageCircle className="text-indigo-600 mr-3 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Conversational & Clear</h4>
                    <p className="text-gray-600">Communicates in natural, jargon-free language</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <HandHeart className="text-indigo-600 mr-3 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Supportive & Non-Judgmental</h4>
                    <p className="text-gray-600">Offers help without criticism or unsolicited advice</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/how-it-works')}
                className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center"
              >
                See Allie in Action
                <ArrowRight className="ml-2" size={20} />
              </button>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Sparkles className="text-white" size={24} />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">Allie</p>
                      <p className="text-sm text-gray-600">Your Family AI</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        "Hi! I noticed you have soccer practice at 4pm today. Would you like me to 
                        remind David to pack Emma's water bottle when he picks her up from school?"
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 ml-auto max-w-[80%]">
                      <p className="text-sm text-gray-700">
                        "Yes, please! And can you add granola bars to the grocery list?"
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        "Done! I've set the reminder for 3:15pm and added granola bars to your 
                        shared grocery list. Emma's favorite brand is Nature Valley, right?"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide every decision we make
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <value.icon size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join the Allie Family?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Experience what it's like to have a true partner in parenting
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white text-indigo-600 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default NewAboutUsPage;