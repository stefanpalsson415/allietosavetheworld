import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Brain, Heart, Scale, ArrowRight, BarChart, Clock, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MarketingHeader from '../shared/MarketingHeader';
import MarketingFooter from '../shared/MarketingFooter';

// Team member profile images - These should be replaced with actual images in your assets folder
import stefanProfilePic from '../../assets/stefan-palsson.jpg'; // Add this image to your assets
import kimberlyProfilePic from '../../assets/kimberly-palsson.jpg'; // Add this image to your assets
import teamPhoto from '../../assets/team-photo.jpg'; // Add this image to your assets
import shaneCulpPic from '../../assets/shane-culp.jpg'; // Add this image to your assets

const AboutUsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-['Roboto']">
      {/* Header - using shared component */}
      <MarketingHeader activeLink="/about-us" />
      
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-6">Meet Allie</h1>
          <p className="text-xl font-light max-w-2xl mx-auto">
            We're building the future of family balance through the seamless integration of AI and behavioral science.
          </p>
        </div>
      </section>
      
      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block p-2 bg-blue-100 rounded-lg mb-4">
              <Users className="text-blue-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">Our Story</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Founded by parents who understand the invisible burdens of modern family life
            </p>
          </div>
          
          <div className="mb-12">
            <div className="rounded-xl overflow-hidden mb-8">
              <img 
                src={teamPhoto} 
                alt="Allie Team" 
                className="w-full h-auto"
              />
            </div>
            
            <div className="prose prose-lg max-w-none">
              <p>
                Allie was born out of our own experiences as parents trying to manage the countless tasks, responsibilities, and mental load of family life. We saw firsthand how the invisible burdens of running a household often fall disproportionately on one parent, creating imbalance and burnout.
              </p>
              <p>
                After speaking with hundreds of families and pouring through research on family systems, mental load, and relationship dynamics, we realized there was an opportunity to create something truly revolutionary: an AI-powered system designed specifically to address the unique challenges of modern families.
              </p>
              <p>
                Allie represents our vision for how technology can help create more balanced, harmonious family relationships—not by replacing human connection, but by eliminating the friction points that often lead to stress and conflict.
              </p>
            </div>
          </div>
          
          <div className="text-center mb-12">
            <div className="inline-block p-2 bg-purple-100 rounded-lg mb-4">
              <Brain className="text-purple-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">Our Approach</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Combining cutting-edge AI with evidence-based approaches to family systems
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Brain className="text-purple-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">AI Innovation</h3>
              <p className="text-gray-600 text-sm">
                We've built proprietary natural language understanding systems specifically designed to comprehend the unique context of family life and the "invisible work" that keeps households running.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <Heart className="text-pink-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Research-Backed</h3>
              <p className="text-gray-600 text-sm">
                Everything we build is grounded in evidence-based approaches to family systems, relationship psychology, and behavioral science. We go beyond technology to create meaningful solutions.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Scale className="text-blue-600" size={24} />
              </div>
              <h3 className="font-medium text-lg mb-2">Balance by Design</h3>
              <p className="text-gray-600 text-sm">
                We believe true family balance comes from recognizing and valuing all forms of contribution—both visible and invisible. Our products are designed to make the invisible visible.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block p-2 bg-green-100 rounded-lg mb-4">
              <Users className="text-green-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              A diverse group of technologists, family experts, and parents committed to creating more balanced family lives
            </p>
          </div>
          
          <div className="grid gap-12">
            {/* Founder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid md:grid-cols-3">
                <div className="md:col-span-1">
                  <img 
                    src={stefanProfilePic} 
                    alt="Stefan Palsson" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:col-span-2 p-8">
                  <h3 className="text-2xl font-medium mb-2">Stefan Palsson</h3>
                  <p className="text-purple-600 font-medium mb-4">Founder & CEO</p>
                  <p className="text-gray-600 mb-4">
                    A technologist and parent dedicated to solving the invisible burdens of family life. Prior to founding Allie, Stefan led product and engineering teams at several successful startups.
                  </p>
                  <p className="text-gray-600">
                    "I founded Allie after seeing firsthand how the mental load of family life was creating burnout, stress, and imbalance in so many households—including my own. I believe technology, when thoughtfully applied, can help us create more balanced and fulfilling family lives."
                  </p>
                </div>
              </div>
            </div>
            
            {/* Co-Founder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid md:grid-cols-3">
                <div className="md:col-span-1">
                  <img 
                    src={kimberlyProfilePic} 
                    alt="Kimberly Palsson" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:col-span-2 p-8">
                  <h3 className="text-2xl font-medium mb-2">Kimberly Palsson</h3>
                  <p className="text-purple-600 font-medium mb-4">Co-Founder & Chief Research Officer</p>
                  <p className="text-gray-600 mb-4">
                    A family systems researcher with expertise in parental mental load and workload distribution. Kimberly brings the scientific foundation to Allie's technology.
                  </p>
                  <p className="text-gray-600">
                    "Our mission goes beyond building great technology—we're creating a new paradigm for how families share responsibilities. By making the invisible work visible, we give families the tools to create more balanced, equitable partnerships."
                  </p>
                </div>
              </div>
            </div>
            
            {/* Additional Team Member */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid md:grid-cols-3">
                <div className="md:col-span-1">
                  <img 
                    src={shaneCulpPic} 
                    alt="Shane Culp" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:col-span-2 p-8">
                  <h3 className="text-2xl font-medium mb-2">Shane Culp</h3>
                  <p className="text-purple-600 font-medium mb-4">Chief Technology Officer</p>
                  <p className="text-gray-600 mb-4">
                    An AI and natural language processing expert with a passion for creating technology that enhances human relationships. Shane leads Allie's technical development.
                  </p>
                  <p className="text-gray-600">
                    "The most exciting AI applications aren't those that replace human connection—they're the ones that remove friction and create space for deeper human relationships. That's what drives our work at Allie."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block p-2 bg-yellow-100 rounded-lg mb-4">
              <Star className="text-yellow-600" size={24} />
            </div>
            <h2 className="text-3xl font-light mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-lg mb-3">Family First</h3>
              <p className="text-gray-600 text-sm">
                We believe that healthy, balanced families are the foundation of a thriving society. Every decision we make is guided by what's best for families.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-lg mb-3">Equity in Partnership</h3>
              <p className="text-gray-600 text-sm">
                We're committed to creating tools that foster more equitable distribution of family responsibilities, recognizing and valuing all forms of contribution.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-lg mb-3">Evidence-Based Innovation</h3>
              <p className="text-gray-600 text-sm">
                We combine cutting-edge technology with rigorous research, ensuring that our products deliver real, measurable improvements to family life.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-lg mb-3">Privacy as Priority</h3>
              <p className="text-gray-600 text-sm">
                We treat your family's data with the utmost respect. Privacy isn't just a feature of our products—it's a foundational principle built into everything we create.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-lg mb-3">Inclusive Design</h3>
              <p className="text-gray-600 text-sm">
                We build for all types of families, recognizing and celebrating the diversity of modern family structures, experiences, and needs.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-lg mb-3">Continuous Improvement</h3>
              <p className="text-gray-600 text-sm">
                Like the families we serve, we're always growing. We're committed to constantly evolving our understanding and our solutions based on user feedback and new research.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light mb-4">Join Us on Our Mission</h2>
          <p className="text-xl opacity-80 mb-8 font-light max-w-2xl mx-auto">
            Experience the Allie difference for your family today
          </p>
          <button 
            onClick={() => navigate('/onboarding')}
            className="px-8 py-4 bg-white text-black rounded-md font-medium hover:bg-gray-100"
          >
            Get Started
          </button>
        </div>
      </section>
      
      {/* Footer - using shared component */}
      <MarketingFooter />
    </div>
  );
};

export default AboutUsPage;