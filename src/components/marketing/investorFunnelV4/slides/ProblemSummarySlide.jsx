import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';

/**
 * Slide #2: Problem Summary
 * This section details the mental load crisis facing modern families, providing evidence of its 
 * impact on relationships, wellbeing, and society at large, establishing the urgent need for 
 * Allie's solution.
 */
const ProblemSummarySlide = () => {
  return (
    <SlideTemplate
      title="The Family Imbalance Crisis"
      subtitle="Understanding the invisible burdens of modern families"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <Card 
          title="Research Findings" 
          className="h-full bg-indigo-50 border-indigo-200"
        >
          <p className="mb-4 text-indigo-800 font-medium">Research shows that imbalanced family workloads lead to measurable negative outcomes:</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span><strong>33%</strong> higher parental burnout rates</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span><strong>42%</strong> more relationship conflicts</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Reduced career advancement for the overloaded parent</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Children developing limited views of gender roles</span>
            </li>
          </ul>
        </Card>

        <DataChart 
          type="bar"
          data={[
            {
              name: 'Relationship Satisfaction',
              'Balanced Families': 82,
              'Imbalanced Families': 41
            },
            {
              name: 'Parental Burnout',
              'Balanced Families': 24,
              'Imbalanced Families': 67
            },
            {
              name: 'Child Development',
              'Balanced Families': 78,
              'Imbalanced Families': 52
            },
            {
              name: 'Career Advancement',
              'Balanced Families': 76,
              'Imbalanced Families': 38
            }
          ]}
          options={{
            plugins: {
              title: {
                display: true,
                text: 'Impact of Mental Load on Family Wellbeing'
              },
              subtitle: {
                display: true,
                text: 'Comparing balanced vs. imbalanced families (higher is better)'
              },
              legend: {
                position: 'bottom'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Score (%)'
                },
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            }
          }}
          height={240}
        />
      </div>

      <div className="mb-8">
        <div className="relative flex flex-col items-center mb-4">
          <h3 className="text-lg font-semibold text-indigo-800 text-center mb-2">The Family Imbalance Cycle</h3>
          <p className="text-sm text-gray-600 text-center mb-6">How these factors compound to create a worsening family crisis</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 relative">
          {/* Problem 1 */}
          <div className="relative">
            <div className="absolute -top-6 left-0 right-0 flex justify-center">
              <div className="bg-indigo-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
            </div>
            <Card 
              title="The Hidden Mental Load" 
              className="h-full pt-4"
            >
              <p className="mb-4">Traditional approaches to balance fail because they ignore:</p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Invisible cognitive work of planning and organizing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Emotional labor of anticipating family needs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>The compounding effect of imbalance over time</span>
                </li>
              </ul>
            </Card>
            {/* Arrow to next */}
            <div className="absolute top-1/2 -right-12 transform translate-y-1/2 hidden md:block">
              <div className="h-1 w-8 bg-indigo-400"></div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-t-[6px] border-b-[6px] border-l-[10px] border-t-transparent border-b-transparent border-l-indigo-400"></div>
            </div>
          </div>

          {/* Problem 2 */}
          <div className="relative mt-8">
            <div className="absolute -top-6 left-0 right-0 flex justify-center">
              <div className="bg-indigo-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
            </div>
            <Card 
              title="The Information Overload" 
              className="h-full pt-4"
            >
              <p className="mb-4">The biggest contributor to parental imbalance:</p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Remembering thousands of critical details</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Information scattered across emails, texts, and papers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Mental burden of being the family's memory</span>
                </li>
              </ul>
            </Card>
            {/* Arrow to next */}
            <div className="absolute top-1/2 -right-12 transform translate-y-1/2 hidden md:block">
              <div className="h-1 w-8 bg-indigo-400"></div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-t-[6px] border-b-[6px] border-l-[10px] border-t-transparent border-b-transparent border-l-indigo-400"></div>
            </div>
          </div>

          {/* Problem 3 */}
          <div className="relative mt-4">
            <div className="absolute -top-6 left-0 right-0 flex justify-center">
              <div className="bg-indigo-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
            </div>
            <Card 
              title="The Worsening Crisis" 
              className="h-full pt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300"
            >
              <p className="mb-4">All these factors create a compounding crisis:</p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span><strong>33%</strong> higher parental burnout rates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span><strong>42%</strong> more relationship conflicts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Children developing limited views of gender roles</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>¹ Source: Journal of Family Psychology, 2023 - "Mental Load Distribution in Modern Families"</p>
        <p>² Source: Workload Equity Research Institute, 2024 - "Cognitive Labor in Household Management"</p>
      </div>
    </SlideTemplate>
  );
};

export default ProblemSummarySlide;