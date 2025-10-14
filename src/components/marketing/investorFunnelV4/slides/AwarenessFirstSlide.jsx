import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, Quote, Stat } from './components';
import { Lightbulb, Eye, BarChart3, ArrowRight } from 'lucide-react';

const AwarenessFirstSlide = () => {
  return (
    <SlideTemplate
      title="Awareness is the First Step to Change"
      subtitle="Creating crystal-clear awareness of the invisible mental load and its distribution"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="The Awareness Challenge" icon={<Eye size={24} />} className="bg-gradient-to-br from-blue-50 to-indigo-100">
          <p className="text-gray-700 mb-3">Most families aren't aware of how mental load is distributed or its impact on relationships and wellbeing.</p>
          <p className="text-gray-700">Without awareness, meaningful change is impossible. Traditional solutions focus on task completion rather than understanding the underlying load distribution.</p>
        </Card>
        
        <Card title="Allie's Approach" icon={<Lightbulb size={24} />} className="bg-gradient-to-br from-amber-50 to-yellow-100">
          <p className="text-gray-700 mb-3">Allie begins by gently mapping and visualizing the family's invisible load through natural conversations and data collection.</p>
          <p className="text-gray-700">We present insights in a non-threatening, objective way that helps everyone understand the current state without judgment.</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat 
          value="56%" 
          label="of fathers believe chores are 'shared equally' vs. only 31% of mothers (Pew 2023)"
          icon={<BarChart3 className="text-blue-500" />}
        />
        <Stat 
          value="3-4×" 
          label="more likely for new habits to stick when awareness precedes action (Health Psych. 2020)"
          icon={<Eye className="text-indigo-500" />}
        />
        <Stat 
          value="60%+" 
          label="of couples across 29 countries rate their division as 'fair' despite large gaps (Mikula 2021)"
          icon={<ArrowRight className="text-amber-500" />}
        />
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Why Awareness Must Come First</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-indigo-700 mb-2 text-sm">Transforming "Nagging" into Data</h4>
            <p className="text-sm text-gray-700">
              "Awareness supplies missing data for the parent in denial, neutralising 'That's not true' push-back. 
              It transforms the topic from 'she's nagging' to 'the numbers say so.'"
              <span className="block mt-1 text-xs italic text-indigo-600">— Carlson 2022 dyadic-task experiment</span>
            </p>
          </div>
          <div>
            <h4 className="font-medium text-indigo-700 mb-2 text-sm">Relationship Satisfaction Improves</h4>
            <p className="text-sm text-gray-700">
              "A scorecard both agree on can raise satisfaction immediately—even before hours shift—creating 
              early-success momentum. Better relationship climate leads to greater collaboration on new routines."
              <span className="block mt-1 text-xs italic text-indigo-600">— Grote et al. 2019 longitudinal study</span>
            </p>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default AwarenessFirstSlide;