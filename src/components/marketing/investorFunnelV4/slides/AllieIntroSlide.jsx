import React from 'react';
import { CheckCircle } from 'lucide-react';
import SlideTemplate from './SlideTemplate';
import { Quote, Stat } from './components';

/**
 * Slide #1: Allie Summary Slide
 * This section establishes Allie as an AI-powered mental load solution that makes the 
 * invisible burden of family management visible, presenting a significant market opportunity.
 */
const AllieIntroSlide = () => {
  // Add enhanced console.log to verify that this component is being rendered with the correct title
  console.log("Rendering AllieIntroSlide with ALLIE title");
  
  return (
    <SlideTemplate
      title="ALLIE"
      subtitle="The AI-powered mental load solution"
    >
      <div className="flex flex-col items-center h-auto text-center mt-4 overflow-visible">

        {/* Add an anchor at the top to help with scrolling position */}
        <div id="allie-slide-anchor" className="h-4"></div>

        <Quote 
          text="The greatest burden families face isn't visible until it's gone. We've made it visible."
          author="Kimberly Palsson"
          role="CEO"
          className="max-w-4xl mx-auto mb-8"
        />

        <div className="mb-12 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-indigo-700 mb-3">Meet Allie</h3>
          <p className="text-gray-700 mb-4">
            Allie is your family's trusted third partner who brings awareness by making the invisible visible. She picks up the loose
            ends of parenting that often fall through the cracks, understanding your unique family needs and patterns.
          </p>
          <p className="text-gray-700 mb-4">
            By creating transparency and balance between parents, Allie brings back the joy of family time—turning administrative
            burdens into meaningful moments that matter.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <CheckCircle className="text-indigo-600 h-5 w-5" />
              </div>
              <span className="text-gray-700">Transforms family coordination from a burden to a seamless experience</span>
            </div>
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <CheckCircle className="text-indigo-600 h-5 w-5" />
              </div>
              <span className="text-gray-700">Creates a shared understanding between parents without blame</span>
            </div>
          </div>
        </div>

        <div className="bg-indigo-100 p-8 rounded-lg w-full max-w-4xl border border-indigo-300">
          <h3 className="text-xl font-semibold mb-6 text-center text-indigo-800">Our Opportunity</h3>
          <div className="grid grid-cols-3 gap-6">
            <Stat 
              value="$42B" 
              label="family management market growing at 17% annually" 
              color="text-indigo-800"
              labelColor="text-indigo-700"
            />
            <Stat 
              value="94%" 
              label="of millennial parents actively seeking mental load solutions" 
              color="text-indigo-800"
              labelColor="text-indigo-700"
            />
            <Stat 
              value="3-5yr" 
              label="technology advantage through our proprietary AI approach" 
              color="text-indigo-800"
              labelColor="text-indigo-700"
            />
          </div>
        </div>

        <div className="mt-8 text-right w-full">
          <p className="text-sm text-gray-500">May 2025 • Investor Presentation</p>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default AllieIntroSlide;