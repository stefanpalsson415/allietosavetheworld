import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { Users, Star } from 'lucide-react';

// Team member profile images
import stefanProfilePic from '../../../../assets/stefan-palsson.jpg'; 
import kimberlyProfilePic from '../../../../assets/kimberly-palsson.jpg'; 
import shaneCulpPic from '../../../../assets/shane-culp.jpg';

const TeamAdvisorsSlide = () => {
  const teamMembers = [
    {
      name: "Stefan Palsson",
      title: "Co-Founder & CEO",
      image: stefanProfilePic,
      background: [
        "Seasoned Chief Operating Officer with 15+ years in data-driven leadership",
        "Experience at Pinetab, BEDA Learning, and Clutify",
        "Expertise in scaling operations, strategic planning, and financial management"
      ]
    },
    {
      name: "Kimberly Palsson",
      title: "Co-Founder & Chief Experience Officer",
      image: kimberlyProfilePic,
      background: [
        "Accomplished business consultant and former Chief People Officer",
        "Strong background in team-building strategies and company cultures",
        "Experience across startups, high-end design, and legal services"
      ]
    },
    {
      name: "Shane Culp",
      title: "Co-Founder & Chief Technology Officer",
      image: shaneCulpPic,
      background: [
        "Seasoned technology leader with over 10 years building high-performance engineering teams",
        "Expertise in AI systems and web application architecture",
        "Experience at Fisher-Price, Sesame Street, and LEGO building digital products"
      ]
    }
  ];
  
  // No advisors

  return (
    <SlideTemplate
      title="Our Team"
      subtitle="Passionate founders and industry experts committed to transforming family life"
    >
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
          <Users className="mr-2 text-indigo-600" size={24} />
          Leadership Team
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="w-16 h-16 rounded-full bg-indigo-200 mr-3 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-medium text-indigo-900">{member.name}</h4>
                  <p className="text-sm text-indigo-700">{member.title}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                {member.background.map((item, i) => (
                  <div key={i} className="flex items-start">
                    <div className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                    </div>
                    <p className="text-xs text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium text-indigo-800 mb-2 flex items-center">
            <Star size={18} className="mr-2" />
            Our Founding Story
          </h4>
          <p className="text-sm text-gray-700">
            Allie was born from our founders' personal experience with the invisible mental load of family life. After building 
            successful products for millions of users at major tech companies, Stefan and Kimberly Palsson saw how traditional 
            calendar and task apps failed to address the real challenge: the cognitive burden of coordination. They assembled 
            a team of engineers, psychologists, and family experts to reimagine how technology could truly transform family 
            dynamics by making the invisible visible.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card 
          title="What Sets Our Team Apart" 
          icon={<Star size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <div className="space-y-3">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Speed in the AI Era</h4>
              <p className="text-sm text-gray-700">
                We believe in speed in the era of AI engineering. Our ability to rapidly prototype, test, and iterate
                is our competitive advantage in bringing solutions to market before competitors can respond.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Consumer App Scaling Experience</h4>
              <p className="text-sm text-gray-700">
                Our experience scaling consumer applications is exactly what this company needs. We've successfully 
                grown user bases into the millions across multiple platforms, which is invaluable in today's fast-paced market.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Lived Experience as Parents</h4>
              <p className="text-sm text-gray-700">
                We are all parents who directly understand this problem. We've experienced the mental load challenges 
                firsthand, making us uniquely qualified to build a solution that truly addresses family needs.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-indigo-800 mb-2">Our Cultural Values</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-80 p-3 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Families First</h4>
            <p className="text-xs text-gray-700">We build for families because we are families. Their success is our north star.</p>
          </div>
          
          <div className="bg-white bg-opacity-80 p-3 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Meaningful Simplicity</h4>
            <p className="text-xs text-gray-700">We make the complex simple without sacrificing depth or meaning.</p>
          </div>
          
          <div className="bg-white bg-opacity-80 p-3 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Ethical Innovation</h4>
            <p className="text-xs text-gray-700">We push boundaries while respecting privacy and maintaining trust.</p>
          </div>
          
          <div className="bg-white bg-opacity-80 p-3 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Balanced Living</h4>
            <p className="text-xs text-gray-700">We practice what we preach, supporting work-life harmony for our team.</p>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default TeamAdvisorsSlide;