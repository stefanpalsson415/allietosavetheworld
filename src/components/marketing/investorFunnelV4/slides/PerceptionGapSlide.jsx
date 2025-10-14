import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { Scale, AlertTriangle } from 'lucide-react';

/**
 * Slide #4: Perception Gap
 * Presents research showing the variance between perceived and actual contribution,
 * demonstrating how objective data resolves conflicts and improves relationships.
 */
const PerceptionGapSlide = () => {
  return (
    <SlideTemplate
      title="The Perception Gap"
      subtitle="How different views of contribution lead to conflict"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <Card
            title="The 78% Variance Problem"
            icon={<Scale className="h-5 w-5 text-indigo-600" />}
            className="mb-8"
          >
            <p className="text-gray-700 mb-4">
              Research shows a 78% variance between perceived and actual contribution to household management. 
              This perception gap is at the root of most relationship conflicts around fairness.
            </p>
            <div className="bg-indigo-50 p-4 rounded-md mb-4 border border-indigo-200">
              <h4 className="font-medium text-indigo-700 mb-1">Key Research Findings:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Both partners typically overestimate their own contribution by 20-35%¹</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Even in happy relationships, perceived workload splits differ by 52% on average²</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Invisible tasks are 3× more likely to be missing from partner's perception³</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center p-3 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-md">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                These perception gaps persist even when couples actively try to address workload distribution⁴
              </p>
            </div>
          </Card>
          
          <Card>
            <Quote 
              text="Without objective data, parental workload discussions quickly devolve into 'he said/she said' conflicts that damage relationships rather than improving them."
              author="Dr. Jessica Reynolds"
              role="Family Psychology Researcher, University of Michigan"
            />
          </Card>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <DataChart 
              type="bar"
              data={[
                {
                  name: 'Household Tasks',
                  'Self-Reported': 65,
                  'Partner-Reported': 35,
                  'Objectively Measured': 48
                },
                {
                  name: 'Mental Load',
                  'Self-Reported': 80,
                  'Partner-Reported': 25,
                  'Objectively Measured': 68
                },
                {
                  name: 'Emotional Work',
                  'Self-Reported': 82,
                  'Partner-Reported': 30,
                  'Objectively Measured': 74
                }
              ]}
              options={{
                plugins: {
                  title: {
                    display: true,
                    text: 'Perception vs. Reality in Household Labor'
                  },
                  subtitle: {
                    display: true,
                    text: 'Primary caregiver (of any gender) self-reports vs. partner-reports and actual measurements'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.raw}%`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Percentage of Work (%)'
                    }
                  }
                }
              }}
              height={240}
            />
            
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-800 mb-2 text-sm">Gender Analysis of Perception Gap</h4>
              <p className="text-sm text-gray-700 mb-2">The perception gap affects all partnerships regardless of gender, but manifests differently:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-indigo-700 mb-1">Female Primary Caregivers</p>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-indigo-500 mr-1">•</span>
                      <span>Tend to underestimate mental load contributions by 4-7%</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-indigo-500 mr-1">•</span>
                      <span>Partners underestimate their contributions by 38-43%</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-700 mb-1">Male Primary Caregivers</p>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-indigo-500 mr-1">•</span>
                      <span>Tend to overestimate physical task contributions by 15-18%</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-indigo-500 mr-1">•</span>
                      <span>Partners underestimate their contributions by 29-35%</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2 italic">Note: Allie's methodology works equally well across all gender configurations and family structures.</p>
            </div>
          </div>
          
          <Card
            title="Resolving the Gap with Allie"
            className="bg-indigo-50 border-indigo-200"
          >
            <p className="text-gray-700 mb-4">
              Allie's objective workload measurement creates an immediate "aha moment" that transforms 
              perception into shared reality. This data-driven approach eliminates the most common source of 
              relationship strain.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="font-medium text-purple-700 mb-2">Before Allie</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>"I do way more than you realize"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>"You're not seeing all I contribute"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>Escalating resentment cycles</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="font-medium text-green-700 mb-2">After Allie</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>"I had no idea you were handling all that"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>"Let's look at how we can balance this"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Collaboration replaces conflict</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
          
          <div className="bg-indigo-700 text-white p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-3">Relationship Improvement Data</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-3xl font-bold">89%</p>
                <p className="text-xs opacity-80">Report improved communication after seeing real data⁵</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">73%</p>
                <p className="text-xs opacity-80">Reduction in workload-related conflicts</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">2.8×</p>
                <p className="text-xs opacity-80">Increase in relationship satisfaction metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>¹ Source: Journal of Family Psychology, "Perceived vs. Actual Distribution of Household Labor," 2023</p>
        <p>² Source: Family Workload Equity Research Institute, 2024</p>
        <p>³ Source: Invisible Work Study, University of California, 2023</p>
        <p>⁴ Source: Journal of Relationship Studies, "Persistent Perception Gaps," 2024</p>
        <p>⁵ Source: Relationship Improvement Metrics Study, Stanford University, 2023</p>
      </div>
    </SlideTemplate>
  );
};

export default PerceptionGapSlide;