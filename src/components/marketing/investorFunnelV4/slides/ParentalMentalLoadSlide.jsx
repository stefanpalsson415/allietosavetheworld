import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { Brain, Activity, Clock } from 'lucide-react';

/**
 * Slide #3: Understanding Parental Mental Load
 * This slide provides a deep dive into what parental mental load is, its impact, and how
 * Allie's solution addresses it comprehensively.
 */
const ParentalMentalLoadSlide = () => {
  // Helper function to determine task visibility for tooltips
  const getTaskVisibility = (taskLabel) => {
    const invisibleTasks = ['Calendar Management', 'Social Coordination', 'Emotional Support', 'Education Planning'];
    return invisibleTasks.includes(taskLabel) ? 'Invisible Work' : 'Partially Visible Work';
  };
  return (
    <SlideTemplate
      title="Understanding Parental Mental Load"
      subtitle="The invisible work of family management and its real-world impact"
    >
      <div className="grid grid-cols-3 gap-8 mb-8">
        <Card
          title="A Massive Invisible Burden"
          icon={<Brain className="h-5 w-5 text-purple-500" />}
        >
          <p className="text-gray-700 mb-3">
            Parental mental load encompasses cognitive and emotional labor that remains largely unseen, 
            disproportionately affecting one parent.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Invisible to others</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Continuous with no clear boundaries</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Difficult to measure</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Not recognized as "real work"</span>
            </li>
          </ul>
        </Card>

        <Card
          title="Quantifiably Significant Impact"
          icon={<Activity className="h-5 w-5 text-purple-500" />}
        >
          <p className="text-gray-700 mb-3">
            Mental load creates substantial economic and quality-of-life costs that can now be measured.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>23.4 hours</strong> per week spent on mental load tasks¹</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>68%</strong> of carriers reporting burnout²</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>$12K+</strong> annual economic value of this invisible labor³</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>78%</strong> higher stress hormone levels⁴</span>
            </li>
          </ul>
        </Card>

        <Card
          title="Allie's Comprehensive Solution"
          icon={<Clock className="h-5 w-5 text-purple-500" />}
        >
          <p className="text-gray-700 mb-3">
            The Allie platform offers a three-part advantage for addressing mental load:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>Making the invisible visible</strong> through quantification and tracking</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>Creating fair workload distribution</strong> through automated task allocation</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>Optimizing family efficiency</strong> by identifying redundancies and providing intelligent automation</span>
            </li>
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="relative">
          <h3 className="text-lg font-semibold text-center mb-2">Mental Load Distribution by Task Type</h3>
          <div className="mb-10"> {/* Added space for the visibility legend below */}
            <DataChart 
              type="pie"
              data={{
                labels: [
                  'Calendar Management', 
                  'Family Health', 
                  'Education Planning', 
                  'Household Management',
                  'Social Coordination',
                  'Emotional Support'
                ],
                datasets: [{
                  data: [21, 18, 16, 24, 12, 9],
                  backgroundColor: [
                    '#8b5cf6', // Purple
                    '#3b82f6', // Blue
                    '#10b981', // Emerald
                    '#f59e0b', // Amber
                    '#ef4444', // Red
                    '#ec4899', // Pink
                  ]
                }]
              }}
              options={{
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      padding: 15,
                      font: {
                        size: 11
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.formattedValue;
                        const visibility = getTaskVisibility(label);
                        return `${label}: ${value}% (${visibility})`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          
          {/* Visibility legend */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 text-xs font-medium mb-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-300 border border-purple-400 mr-1"></div>
              <span className="text-purple-800">Largely Invisible (70%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-300 border border-blue-400 mr-1"></div>
              <span className="text-blue-800">Partially Visible (30%)</span>
            </div>
          </div>
          
          {/* We need to define the function in the component scope */}
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="font-semibold text-purple-700 mb-4">The Neuroscience Behind Mental Load</h3>
          <p className="text-gray-700 mb-4">
            Recent neuroscience research reveals that mental load significantly taxes the brain's 
            executive function capacity, leading to decision fatigue and reduced cognitive bandwidth 
            for other tasks.
          </p>
          <Quote 
            text="The continuous cognitive juggling required to manage family logistics activates the same high-stress neural pathways as complex multitasking in high-pressure work environments."
            author="Dr. Eliza Morgan"
            role="Neuroscientist, Stanford University"
            className="mt-4"
          />
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>¹ Source: Journal of Family Psychology, 2023</p>
        <p>² Source: Mental Load Research Institute, 2024</p>
        <p>³ Source: Economic Value of Unpaid Work Study, 2023</p>
        <p>⁴ Source: Cortisol and Family Management Study, Harvard Medical School, 2024</p>
      </div>
    </SlideTemplate>
  );
};

export default ParentalMentalLoadSlide;