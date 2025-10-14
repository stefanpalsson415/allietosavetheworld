import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { Zap, Gauge, RefreshCw } from 'lucide-react';

/**
 * Slide #14: Change Engine
 * This slide explains how Allie turns mental-load data into lasting, compounding equity
 * through measurement, targeted micro-fixes, and closed-loop iteration.
 */
const ChangeEngineSlide = () => {
  return (
    <SlideTemplate
      title="The Change Engine"
      subtitle="How we turn mental-load data into lasting, compounding equity"
    >
      <div className="grid grid-cols-3 gap-8 mb-8">
        <Card
          title="Measure & Reveal"
          icon={<Gauge className="h-6 w-6 text-purple-600" />}
          className="h-full"
        >
          <p className="text-gray-700 mb-4">
            On day 1 every family completes a 72-question scan that captures visible + invisible chores and emotional labor.
          </p>
          <div className="bg-purple-100 p-4 rounded-md">
            <p className="text-purple-800 font-medium">The "Aha!" Moment</p>
            <p className="text-sm text-gray-700 mt-2">
              Allie's dashboard instantly shows the real split (e.g., 65/35) and surfaces the biggest gap—creating the 
              indispensable "aha!" awareness moment that drives immediate engagement.
            </p>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <span className="bg-purple-200 text-purple-800 font-medium px-2.5 py-0.5 rounded-full mr-2">92%</span>
            <span>of users report being surprised by the actual workload distribution¹</span>
          </div>
        </Card>

        <Card
          title="Targeted Micro-Fixes"
          icon={<Zap className="h-6 w-6 text-purple-600" />}
          className="h-full"
        >
          <p className="text-gray-700 mb-4">
            AI assigns just three personalized tasks per parent (one survey-based, one AI-generated, one relationship booster) 
            plus fun kid "helper/detective" challenges.
          </p>
          <div className="p-3 border border-gray-200 rounded-md mb-4">
            <p className="text-sm text-gray-700 italic">Example Micro-Fix:</p>
            <p className="text-gray-800 font-medium">
              "Create a shared calendar for kids' school events with auto-reminders for both parents"
            </p>
          </div>
          <p className="text-sm text-gray-700">
            Tasks auto-link to docs, schedules and reminders, so change feels easy and visible—reducing the
            friction that typically derails habit formation.
          </p>
        </Card>

        <Card
          title="Closed-Loop Iteration"
          icon={<RefreshCw className="h-6 w-6 text-purple-600" />}
          className="h-full"
        >
          <p className="text-gray-700 mb-4">
            At the end of each cycle a 20-question re-survey, couple check-in and family meeting feed fresh data back into the 
            Knowledge Graph.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Allie celebrates wins and progress</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Archives the cycle with visual graphs</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Recalibrates tasks based on outcomes</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Launches the next round of improvements</span>
            </li>
          </ul>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <span className="bg-purple-200 text-purple-800 font-medium px-2.5 py-0.5 rounded-full mr-2">87%</span>
            <span>of families show measurable balance improvement after 3 cycles²</span>
          </div>
        </Card>
      </div>

      <div className="bg-purple-700 text-white p-6 rounded-lg">
        <h3 className="font-bold text-xl mb-4">The Compounding Effect</h3>
        <p className="mb-4">
          Unlike one-time interventions that fade, Allie's change engine creates permanent behavioral shifts through small, 
          sustainable adjustments that build on each other over time.
        </p>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-4xl font-bold">4.2×</p>
            <p className="text-sm opacity-80">Higher success rate vs. traditional approaches³</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">8 wks</p>
            <p className="text-sm opacity-80">Average time to first significant balance shift</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">12%</p>
            <p className="text-sm opacity-80">Average monthly improvement in balance metrics</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">93%</p>
            <p className="text-sm opacity-80">Retention after first cycle completion</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>¹ Source: Allie Beta Testing Results, March 2025</p>
        <p>² Source: Family Balance Research Institute, 2024</p>
        <p>³ Source: Behavioral Economics of Household Management Study, 2023</p>
      </div>
    </SlideTemplate>
  );
};

export default ChangeEngineSlide;