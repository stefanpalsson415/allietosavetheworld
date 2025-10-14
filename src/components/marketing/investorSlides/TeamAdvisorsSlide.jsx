import React, { useState } from 'react';
import { Briefcase, Award, GraduationCap, Users, Heart, Brain, Star, Zap } from 'lucide-react';

const TeamAdvisorsSlide = () => {
  const [activeTeamMember, setActiveTeamMember] = useState(null);
  const [activeAdvisor, setActiveAdvisor] = useState(null);
  
  const teamMembers = [
    {
      id: 'stefan',
      name: 'Stefan Palsson',
      title: 'CEO & Co-Founder',
      background: 'Former Google PM, led family products division',
      expertise: 'Product Strategy, AI, Family Tech',
      education: 'MBA, Stanford; BS Computer Science, MIT',
      photo: '/assets/stefan-palsson.jpg',
      icon: <Briefcase size={20} className="text-blue-600" />
    },
    {
      id: 'kimberly',
      name: 'Dr. Kimberly Palsson',
      title: 'CPO & Co-Founder',
      background: 'PhD in Family Psychology, 15 years research',
      expertise: 'Family Dynamics, Clinical Psychology, UX Research',
      education: 'PhD Psychology, Harvard; MA Family Therapy, UCLA',
      photo: '/assets/kimberly-palsson.jpg',
      icon: <Heart size={20} className="text-pink-600" />
    },
    {
      id: 'shane',
      name: 'Shane Culp',
      title: 'CTO',
      background: 'Ex-Amazon, led ML infrastructure for Alexa',
      expertise: 'ML Systems, Cloud Architecture, NLP',
      education: 'MS AI, Stanford; BS Computer Science, Carnegie Mellon',
      photo: '/assets/shane-culp.jpg',
      icon: <Brain size={20} className="text-purple-600" />
    }
  ];
  
  const advisors = [
    {
      id: 'helen',
      name: 'Dr. Helen Rodrigues',
      title: 'Psychology Advisor',
      affiliation: 'Stanford Center for Family Research',
      expertise: 'Family systems therapy, cognitive load research',
      icon: <GraduationCap size={20} className="text-teal-600" />
    },
    {
      id: 'michael',
      name: 'Michael Chen',
      title: 'Strategic Advisor',
      affiliation: 'Former COO at FamilyTime (Acquired $220M)',
      expertise: 'Family tech market, scaling consumer products',
      icon: <Star size={20} className="text-yellow-600" />
    },
    {
      id: 'priya',
      name: 'Dr. Priya Sharma',
      title: 'AI Ethics Advisor',
      affiliation: 'MIT Media Lab, AI Ethics Board',
      expertise: 'Ethical AI in family contexts, privacy frameworks',
      icon: <Zap size={20} className="text-indigo-600" />
    }
  ];
  
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Team & Advisors</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <Users size={24} className="text-blue-600 mr-2" />
                Leadership Team
              </h3>
              
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div 
                    key={member.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      activeTeamMember === member.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 hover:bg-blue-50'
                    }`}
                    onClick={() => setActiveTeamMember(member.id === activeTeamMember ? null : member.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 overflow-hidden">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100">
                            {member.icon}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.title}</p>
                      </div>
                    </div>
                    
                    {activeTeamMember === member.id && (
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="bg-white p-3 rounded border border-gray-100">
                          <p className="font-medium text-gray-700">Background</p>
                          <p className="text-gray-600">{member.background}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-100">
                          <p className="font-medium text-gray-700">Expertise</p>
                          <p className="text-gray-600">{member.expertise}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-100">
                          <p className="font-medium text-gray-700">Education</p>
                          <p className="text-gray-600">{member.education}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Team Composition</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-800">By Discipline</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Engineering</span>
                        <span>42%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '42%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Psychology & Research</span>
                        <span>28%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-pink-500 h-2 rounded-full" style={{width: '28%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Product & Design</span>
                        <span>18%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '18%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Operations & Growth</span>
                        <span>12%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '12%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-gray-800">Team Stats</h4>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">16</div>
                      <p className="text-xs text-gray-500">Full-time employees</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">8</div>
                      <p className="text-xs text-gray-500">Patents filed</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-600">53%</div>
                      <p className="text-xs text-gray-500">Team diversity</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <Award size={24} className="text-yellow-600 mr-2" />
                Advisors & Board
              </h3>
              
              <div className="space-y-3">
                {advisors.map(advisor => (
                  <div 
                    key={advisor.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      activeAdvisor === advisor.id ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'bg-gray-50 hover:bg-yellow-50'
                    }`}
                    onClick={() => setActiveAdvisor(advisor.id === activeAdvisor ? null : advisor.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-gray-100">
                        {advisor.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{advisor.name}</h4>
                        <p className="text-sm text-gray-600">{advisor.title}</p>
                      </div>
                    </div>
                    
                    {activeAdvisor === advisor.id && (
                      <div className="mt-3 bg-white p-3 rounded-lg border border-gray-100 text-sm">
                        <p className="font-medium text-gray-700">Affiliation</p>
                        <p className="text-gray-600 mb-2">{advisor.affiliation}</p>
                        <p className="font-medium text-gray-700">Expertise</p>
                        <p className="text-gray-600">{advisor.expertise}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-5 bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Board of Directors</h4>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-blue-600">SP</span>
                    </div>
                    <span className="text-sm">Stefan Palsson (CEO)</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-pink-600">KP</span>
                    </div>
                    <span className="text-sm">Dr. Kimberly Palsson (CPO)</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-purple-600">RV</span>
                    </div>
                    <span className="text-sm">Rebecca Venturo, Founder Ventures</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-green-600">JS</span>
                    </div>
                    <span className="text-sm">Dr. James Sullivan, Harvard Child Development</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-medium mb-4">Our Unique Advantage</h3>
              
              <div className="space-y-4 mb-5">
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <h4 className="font-medium mb-1">Interdisciplinary Expertise</h4>
                  <p className="text-sm">
                    Our team combines deep technical AI expertise with clinical psychology and family research backgrounds—a unique combination in the market.
                  </p>
                </div>
                
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <h4 className="font-medium mb-1">Proven Track Record</h4>
                  <p className="text-sm">
                    Leadership team with previous exits and scale experience in both consumer technology and mental health sectors.
                  </p>
                </div>
                
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <h4 className="font-medium mb-1">Lived Experience</h4>
                  <p className="text-sm">
                    Our founding team started Allie to solve their own family challenges—creating an authentic mission and deep product intuition.
                  </p>
                </div>
              </div>
              
              <p className="text-center text-sm font-light">
                "The Allie team uniquely combines technical brilliance with deep human understanding—the critical combination for solving complex family challenges."
              </p>
              <p className="text-center text-xs mt-1">
                — Dr. Maya Patel, Harvard Family Research Lab
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mb-4">Prior Experience</h3>
            
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 h-16 rounded-lg flex items-center justify-center">
                <span className="font-bold text-blue-800">Google</span>
              </div>
              <div className="bg-yellow-50 h-16 rounded-lg flex items-center justify-center">
                <span className="font-bold text-yellow-800">Amazon</span>
              </div>
              <div className="bg-blue-50 h-16 rounded-lg flex items-center justify-center">
                <span className="font-bold text-blue-800">Meta</span>
              </div>
              <div className="bg-red-50 h-16 rounded-lg flex items-center justify-center">
                <span className="font-bold text-red-800">Stanford</span>
              </div>
              <div className="bg-purple-50 h-16 rounded-lg flex items-center justify-center">
                <span className="font-bold text-purple-800">MIT</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 text-green-600">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h4 className="font-medium">50+ years</h4>
                  <p className="text-sm text-gray-600">Combined tech leadership experience</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-medium">3 successful exits</h4>
                  <p className="text-sm text-gray-600">Previous startups founded by team members</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 text-purple-600">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4 className="font-medium">25+ published papers</h4>
                  <p className="text-sm text-gray-600">In psychology and AI/ML research</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mb-4">Hiring Plan</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">16</p>
                <p className="text-xs text-gray-600">Current team</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">28</p>
                <p className="text-xs text-gray-600">End of Year 1</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-green-600">42</p>
                <p className="text-xs text-gray-600">End of Year 2</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-5">
              <h4 className="font-medium">Key Hires (Next 6 Months)</h4>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">VP of Engineering</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Q3 2023</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">To scale our engineering team and technical infrastructure</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">Head of Growth</span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Q4 2023</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">To accelerate user acquisition and engagement strategies</p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">Senior ML Engineers (3)</span>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Q3-Q4 2023</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">To expand our AI/ML capabilities and task weight analysis</p>
              </div>
            </div>
            
            <div className="bg-black p-4 rounded-lg text-white">
              <h4 className="font-medium mb-2">Our Hiring Philosophy</h4>
              <p className="text-sm mb-3">
                We prioritize diversity of thought and experience, believing that a team with varied perspectives creates better solutions for diverse family structures.
              </p>
              <div className="flex justify-between text-center">
                <div>
                  <p className="text-lg font-bold">53%</p>
                  <p className="text-xs text-gray-400">women in tech roles</p>
                </div>
                <div>
                  <p className="text-lg font-bold">42%</p>
                  <p className="text-xs text-gray-400">ethnic diversity</p>
                </div>
                <div>
                  <p className="text-lg font-bold">65%</p>
                  <p className="text-xs text-gray-400">parents on team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm text-center">
          <h3 className="text-xl font-medium mb-2">Our Mission</h3>
          <p className="text-gray-700 max-w-3xl mx-auto">
            We're building Allie because we believe that every family deserves to thrive—not just survive. By making the invisible mental load visible and sharing it fairly, we help families reclaim time for what truly matters: connection, growth, and joy.
          </p>
          <div className="mt-6">
            <img 
              src="/assets/team-photo.jpg" 
              alt="Allie Team" 
              className="h-32 object-cover rounded-lg inline-block"
              onError={(e) => {
                e.target.style.display = 'none';
                console.log('Team photo not found');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAdvisorsSlide;