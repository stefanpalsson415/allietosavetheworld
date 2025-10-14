import React from 'react';
import { Heart, Brain, Clock, FileText, ChevronDown } from 'lucide-react';
import { FamilyMember } from './SharedComponents';

const HeroSection = () => {
  return (
    <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 pt-32 md:pt-24">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
          Meet the <span className="text-red-500 break-normal">overwhelmed</span> Palsson family
        </h1>
        
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <div>
            <FamilyMember role="stefan" mood="stressed" size="xl" name="Stefan" />
            <p className="text-xs text-red-500 mt-1">Juggling too much</p>
          </div>
          <div>
            <FamilyMember role="kimberly" mood="stressed" size="xl" name="Kimberly" />
            <p className="text-xs text-red-500 mt-1">Carrying mental load</p>
          </div>
          <div>
            <FamilyMember role="lillian" mood="neutral" size="xl" name="Lillian (14)" />
            <p className="text-xs text-gray-500 mt-1">Busy with school</p>
          </div>
          <div>
            <FamilyMember role="oly" mood="neutral" size="xl" name="Oly (11)" />
            <p className="text-xs text-gray-500 mt-1">Wants to help</p>
          </div>
          <div>
            <FamilyMember role="tegner" mood="neutral" size="xl" name="Tegner (7)" />
            <p className="text-xs text-gray-500 mt-1">Full of energy</p>
          </div>
        </div>

        <div className="space-y-6 text-lg text-gray-700 mb-12">
          {/* Parent quotes */}
          <div className="space-y-4 pb-4 border-b border-gray-200">
            <p className="flex items-center justify-center font-medium">
              <Heart className="mr-2 text-red-500" size={20} />
              "I feel like I'm always the one who remembers everything" - Kimberly
            </p>
            <p className="flex items-center justify-center font-medium">
              <Brain className="mr-2 text-red-500" size={20} />
              "I want to help more but I don't know what needs to be done" - Stefan
            </p>
          </div>
          
          {/* Kids quotes */}
          <div className="space-y-4">
            <p className="flex items-center justify-center">
              <Clock className="mr-2 text-red-500" size={20} />
              "Who's taking Lillian to volleyball practice?"
            </p>
            <p className="flex items-center justify-center">
              <FileText className="mr-2 text-red-500" size={20} />
              "Did anyone see Oly's science fair permission slip?"
            </p>
            <p className="flex items-center justify-center">
              <Brain className="mr-2 text-red-500" size={20} />
              "Tegner has swimming, but when was that again?"
            </p>
          </div>
        </div>

        <ChevronDown className="mx-auto text-gray-400 animate-bounce" size={32} />
      </div>
    </section>
  );
};

export default HeroSection;