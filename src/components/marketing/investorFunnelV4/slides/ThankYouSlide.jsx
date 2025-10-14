import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, Quote } from './components';
import { Heart, Mail, Phone, Globe, Calendar, MessageSquare } from 'lucide-react';

const ThankYouSlide = () => {
  return (
    <SlideTemplate 
      title="Thank You" 
      subtitle="Join us in creating the future of family balance"
    >
      <div className="grid grid-cols-12 gap-4 h-full">
        
        {/* Main message card */}
        <div className="col-span-12 md:col-span-6 flex flex-col">
          <Card
            icon={<Heart size={20} />}
            title="Our Mission"
            className="flex-grow bg-gradient-to-br from-indigo-100 to-white"
          >
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div>
                <p className="text-lg font-semibold text-indigo-900 mb-4">
                  Building the essential system for family coordination and balance.
                </p>
                
                <p className="text-sm mb-3">
                  Allie brings awareness to the invisible mental load that strains families, 
                  relationships, and individual wellbeing. We're creating a system that 
                  ensures tasks are fairly distributed, family knowledge is shared,
                  and everyone participates in maintaining a healthy family ecosystem.
                </p>
                
                <p className="text-sm">
                  Beyond building a product, we're on a mission to create a more equitable 
                  society where all members of a household thrive. Our vision extends to 
                  changing workplace cultures, family dynamics, and societal expectations 
                  about parenting and household responsibilities.
                </p>
              </div>
              
              <Quote className="text-md italic text-indigo-800">
                "Our professional backgrounds in data, operations, and people leadership combined with our 
                personal experiences as parents gave us a unique perspective on solving the family balance crisis."
              </Quote>
            </div>
          </Card>
        </div>
        
        {/* Contact information card */}
        <div className="col-span-12 md:col-span-6 flex flex-col">
          <Card
            icon={<MessageSquare size={20} />}
            title="Let's Connect"
            className="flex-grow"
          >
            <div className="space-y-5">
              <p className="text-sm mb-4">
                Thank you for your interest in Allie! We're excited to continue the 
                conversation and explore how we might work together to make families
                better balanced and more equitable.
              </p>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Contact Information
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="text-indigo-600 mr-3" size={18} />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">stefan@checkallie.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="text-indigo-600 mr-3" size={18} />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-gray-600">+46 73-153 63 04</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Globe className="text-indigo-600 mr-3" size={18} />
                    <div>
                      <p className="text-sm font-medium">Website</p>
                      <p className="text-sm text-gray-600">www.checkallie.com</p>
                    </div>
                  </div>
                  
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-indigo-800 mb-2 flex items-center">
                  <Calendar className="mr-2" size={16} />
                  Next Steps
                </h3>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <div className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      1
                    </div>
                    <span>Schedule a demo with our founders</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      2
                    </div>
                    <span>Review detailed due diligence materials</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      3
                    </div>
                    <span>Connect with existing investors and advisors</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      4
                    </div>
                    <span>Explore strategic partnership opportunities</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Team photos and footer */}
        <div className="col-span-12">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <img 
                  src="/src/assets/shane-culp.jpg" 
                  alt="Allie Team" 
                  className="h-16 w-16 rounded-full object-cover border-2 border-indigo-300"
                />
                <div className="flex flex-col justify-center">
                  <h3 className="text-md font-semibold text-gray-800">The Allie Team</h3>
                  <p className="text-sm text-gray-600">Building the future of family balance</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-500">© 2025 Allie Family Assistant</p>
                <p className="text-xs text-gray-500 mt-1">Investor Deck v4.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default ThankYouSlide;